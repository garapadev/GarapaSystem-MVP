const fetch = require('node-fetch')
const crypto = require('crypto')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Worker para processamento de webhooks
class WebhookWorker {
  constructor() {
    this.isRunning = false
    this.processInterval = null
    this.batchSize = 5 // Processar 5 webhooks por vez
    this.processIntervalMs = 30 * 1000 // 30 segundos
    this.maxRetries = 3
    this.retryDelay = 5000 // 5 segundos
  }

  // Iniciar o worker
  async start() {
    if (this.isRunning) {
      console.log('Webhook worker já está rodando')
      return
    }

    this.isRunning = true
    console.log('Iniciando webhook worker...')

    // Executar processamento imediatamente
    await this.processWebhooks()

    // Configurar intervalo de processamento
    this.processInterval = setInterval(async () => {
      await this.processWebhooks()
    }, this.processIntervalMs)

    console.log(`Webhook worker iniciado. Processando a cada ${this.processIntervalMs / 1000} segundos.`)
  }

  // Parar o worker
  async stop() {
    if (!this.isRunning) {
      console.log('Webhook worker não está rodando')
      return
    }

    this.isRunning = false
    
    if (this.processInterval) {
      clearInterval(this.processInterval)
      this.processInterval = null
    }

    await prisma.$disconnect()
    console.log('Webhook worker parado')
  }

  // Processar webhooks pendentes
  async processWebhooks() {
    try {
      console.log('Verificando webhooks pendentes...')
      
      // Buscar webhooks pendentes
      const pendingWebhooks = await prisma.webhook.findMany({
        where: {
          status: 'PENDING',
          retries: {
            lt: this.maxRetries
          }
        },
        orderBy: {
          createdAt: 'asc'
        },
        take: this.batchSize
      })

      if (pendingWebhooks.length === 0) {
        console.log('Nenhum webhook pendente encontrado')
        return
      }

      console.log(`Processando ${pendingWebhooks.length} webhooks pendentes`)

      // Processar webhooks
      for (const webhook of pendingWebhooks) {
        await this.processWebhook(webhook)
        
        // Pequena pausa entre webhooks
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      console.log('Processamento de webhooks concluído')
    } catch (error) {
      console.error('Erro no processamento de webhooks:', error)
    }
  }

  // Processar um webhook específico
  async processWebhook(webhook) {
    try {
      console.log(`Processando webhook ${webhook.id} para ${webhook.url}`)
      
      // Marcar como processando
      await prisma.webhook.update({
        where: { id: webhook.id },
        data: { 
          status: 'PROCESSING',
          lastAttemptAt: new Date()
        }
      })

      // Enviar webhook
      const result = await this.sendWebhook(webhook)
      
      if (result.success) {
        // Sucesso
        await prisma.webhook.update({
          where: { id: webhook.id },
          data: {
            status: 'SUCCESS',
            response: result.response,
            completedAt: new Date()
          }
        })
        
        console.log(`Webhook ${webhook.id} enviado com sucesso`)
      } else {
        // Falha - incrementar tentativas
        const newRetries = webhook.retries + 1
        const status = newRetries >= this.maxRetries ? 'FAILED' : 'PENDING'
        
        await prisma.webhook.update({
          where: { id: webhook.id },
          data: {
            status,
            retries: newRetries,
            lastError: result.error,
            failedAt: status === 'FAILED' ? new Date() : null
          }
        })
        
        if (status === 'FAILED') {
          console.log(`Webhook ${webhook.id} falhou após ${this.maxRetries} tentativas`)
        } else {
          console.log(`Webhook ${webhook.id} falhou, tentativa ${newRetries}/${this.maxRetries}`)
        }
      }
    } catch (error) {
      console.error(`Erro ao processar webhook ${webhook.id}:`, error)
      
      // Marcar como erro
      await prisma.webhook.update({
        where: { id: webhook.id },
        data: {
          status: 'FAILED',
          lastError: error.message,
          failedAt: new Date()
        }
      })
    }
  }

  // Enviar webhook
  async sendWebhook(webhook) {
    const startTime = Date.now()
    
    try {
      const payload = JSON.parse(webhook.payload)
      const payloadString = JSON.stringify(payload)
      
      const headers = {
        'Content-Type': 'application/json',
        'User-Agent': 'GarapaSystem-Webhook/1.0',
        ...JSON.parse(webhook.headers || '{}')
      }

      // Adicionar assinatura se secret estiver configurado
      if (webhook.secret) {
        const signature = this.generateSignature(payloadString, webhook.secret)
        headers['X-Webhook-Signature'] = `sha256=${signature}`
      }

      // Fazer requisição HTTP
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), webhook.timeout || 30000)

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body: payloadString,
        signal: controller.signal
      })

      clearTimeout(timeoutId)
      const duration = Date.now() - startTime

      let responseData
      try {
        responseData = await response.json()
      } catch {
        responseData = await response.text()
      }

      return {
        success: response.ok,
        status: response.status,
        response: {
          status: response.status,
          data: responseData,
          duration
        },
        duration
      }
    } catch (error) {
      const duration = Date.now() - startTime
      
      return {
        success: false,
        status: 0,
        error: error.message || 'Unknown error',
        duration
      }
    }
  }

  // Gerar assinatura HMAC
  generateSignature(payload, secret) {
    return crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex')
  }

  // Limpar webhooks antigos
  async cleanupOldWebhooks(daysOld = 30) {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysOld)
      
      const result = await prisma.webhook.deleteMany({
        where: {
          OR: [
            {
              status: 'SUCCESS',
              completedAt: {
                lt: cutoffDate
              }
            },
            {
              status: 'FAILED',
              failedAt: {
                lt: cutoffDate
              }
            }
          ]
        }
      })
      
      console.log(`Removidos ${result.count} webhooks antigos`)
    } catch (error) {
      console.error('Erro ao limpar webhooks antigos:', error)
    }
  }

  // Estatísticas de webhooks
  async getStats() {
    try {
      const stats = await prisma.webhook.groupBy({
        by: ['status'],
        _count: {
          status: true
        }
      })
      
      const result = {
        total: 0,
        pending: 0,
        processing: 0,
        success: 0,
        failed: 0
      }
      
      stats.forEach(stat => {
        result.total += stat._count.status
        result[stat.status.toLowerCase()] = stat._count.status
      })
      
      return result
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error)
      return null
    }
  }
}

// Inicializar worker se executado diretamente
if (require.main === module) {
  const worker = new WebhookWorker()
  
  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('Recebido SIGINT, parando worker...')
    await worker.stop()
    process.exit(0)
  })

  process.on('SIGTERM', async () => {
    console.log('Recebido SIGTERM, parando worker...')
    await worker.stop()
    process.exit(0)
  })

  // Iniciar worker
  worker.start().catch(error => {
    console.error('Erro ao iniciar worker:', error)
    process.exit(1)
  })
}

module.exports = WebhookWorker