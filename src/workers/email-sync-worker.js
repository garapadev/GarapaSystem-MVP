const Imap = require('node-imap')
const { simpleParser } = require('mailparser')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Worker para sincronização de emails
class EmailSyncWorker {
  constructor() {
    this.isRunning = false
    this.syncInterval = null
    this.batchSize = 10 // Processar 10 contas por vez
    this.syncIntervalMs = 5 * 60 * 1000 // 5 minutos
  }

  // Iniciar o worker
  async start() {
    if (this.isRunning) {
      console.log('Email sync worker já está rodando')
      return
    }

    this.isRunning = true
    console.log('Iniciando email sync worker...')

    // Executar sincronização imediatamente
    await this.syncAllAccounts()

    // Configurar intervalo de sincronização
    this.syncInterval = setInterval(async () => {
      await this.syncAllAccounts()
    }, this.syncIntervalMs)

    console.log(`Email sync worker iniciado. Sincronizando a cada ${this.syncIntervalMs / 1000} segundos.`)
  }

  // Parar o worker
  async stop() {
    if (!this.isRunning) {
      console.log('Email sync worker não está rodando')
      return
    }

    this.isRunning = false
    
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }

    await prisma.$disconnect()
    console.log('Email sync worker parado')
  }

  // Sincronizar todas as contas ativas
  async syncAllAccounts() {
    try {
      console.log('Iniciando sincronização de contas de email...')
      
      // Buscar contas ativas
      const accounts = await prisma.emailAccount.findMany({
        where: {
          isActive: true
        }
      })

      if (accounts.length === 0) {
        console.log('Nenhuma conta de email ativa encontrada')
        return
      }

      console.log(`Encontradas ${accounts.length} contas ativas para sincronização`)

      // Processar contas em lotes
      for (let i = 0; i < accounts.length; i += this.batchSize) {
        const batch = accounts.slice(i, i + this.batchSize)
        await this.processBatch(batch)
        
        // Pequena pausa entre lotes para não sobrecarregar
        if (i + this.batchSize < accounts.length) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }

      console.log('Sincronização de contas concluída')
    } catch (error) {
      console.error('Erro na sincronização de contas:', error)
    }
  }

  // Processar um lote de contas
  async processBatch(accounts) {
    const promises = accounts.map(account => this.syncAccount(account))
    await Promise.allSettled(promises)
  }

  // Sincronizar uma conta específica
  async syncAccount(account) {
    try {
      console.log(`Sincronizando conta: ${account.email}`)
      
      const imapConfig = {
        user: account.username,
        password: account.password,
        host: account.imapHost,
        port: account.imapPort,
        tls: account.imapSecure,
        connTimeout: 60000,
        authTimeout: 3000,
        tlsOptions: { rejectUnauthorized: false }
      }

      await this.syncImapAccount(account, imapConfig)
      
      // Atualizar última sincronização
      await prisma.emailAccount.update({
        where: { id: account.id },
        data: { lastSyncAt: new Date() }
      })

      console.log(`Conta ${account.email} sincronizada com sucesso`)
    } catch (error) {
      console.error(`Erro ao sincronizar conta ${account.email}:`, error)
      
      // Registrar erro no banco
      await prisma.emailAccount.update({
        where: { id: account.id },
        data: { 
          lastSyncAt: new Date(),
          lastError: error.message
        }
      })
    }
  }

  // Sincronizar conta IMAP
  async syncImapAccount(account, imapConfig) {
    return new Promise((resolve, reject) => {
      const imap = new Imap(imapConfig)
      
      imap.once('ready', () => {
        imap.openBox('INBOX', false, async (err, box) => {
          if (err) {
            reject(err)
            return
          }

          try {
            // Buscar emails não sincronizados
            const searchCriteria = ['UNSEEN'] // Apenas não lidos
            
            imap.search(searchCriteria, async (err, results) => {
              if (err) {
                reject(err)
                return
              }

              if (!results || results.length === 0) {
                imap.end()
                resolve()
                return
              }

              console.log(`Encontrados ${results.length} emails novos para ${account.email}`)
              
              // Processar emails em lotes menores
              const emailBatchSize = 5
              for (let i = 0; i < results.length; i += emailBatchSize) {
                const emailBatch = results.slice(i, i + emailBatchSize)
                await this.processEmailBatch(imap, emailBatch, account)
              }

              imap.end()
              resolve()
            })
          } catch (error) {
            imap.end()
            reject(error)
          }
        })
      })

      imap.once('error', (err) => {
        reject(err)
      })

      imap.connect()
    })
  }

  // Processar lote de emails
  async processEmailBatch(imap, emailIds, account) {
    return new Promise((resolve, reject) => {
      const fetch = imap.fetch(emailIds, {
        bodies: '',
        struct: true,
        markSeen: false
      })

      const emails = []
      
      fetch.on('message', (msg, seqno) => {
        let buffer = ''
        let attributes = null

        msg.on('body', (stream, info) => {
          stream.on('data', (chunk) => {
            buffer += chunk.toString('utf8')
          })
        })

        msg.once('attributes', (attrs) => {
          attributes = attrs
        })

        msg.once('end', async () => {
          try {
            const parsed = await simpleParser(buffer)
            emails.push({
              parsed,
              attributes,
              accountId: account.id
            })
          } catch (error) {
            console.error('Erro ao parsear email:', error)
          }
        })
      })

      fetch.once('error', (err) => {
        reject(err)
      })

      fetch.once('end', async () => {
        try {
          // Salvar emails no banco
          for (const emailData of emails) {
            await this.saveEmail(emailData)
          }
          resolve()
        } catch (error) {
          reject(error)
        }
      })
    })
  }

  // Salvar email no banco de dados
  async saveEmail(emailData) {
    try {
      const { parsed, attributes, accountId } = emailData
      
      // Verificar se email já existe
      const existingEmail = await prisma.email.findFirst({
        where: {
          messageId: parsed.messageId,
          accountId: accountId
        }
      })

      if (existingEmail) {
        return // Email já existe
      }

      // Criar novo email
      await prisma.email.create({
        data: {
          messageId: parsed.messageId || `${Date.now()}-${Math.random()}`,
          subject: parsed.subject || 'Sem assunto',
          fromAddress: parsed.from?.value?.[0]?.address || '',
          fromName: parsed.from?.value?.[0]?.name || '',
          toAddresses: parsed.to?.value?.map(addr => addr.address) || [],
          ccAddresses: parsed.cc?.value?.map(addr => addr.address) || [],
          bccAddresses: parsed.bcc?.value?.map(addr => addr.address) || [],
          textBody: parsed.text || '',
          htmlBody: parsed.html || '',
          receivedAt: parsed.date || new Date(),
          isRead: attributes?.flags?.includes('\\Seen') || false,
          isStarred: attributes?.flags?.includes('\\Flagged') || false,
          folder: 'INBOX',
          accountId: accountId,
          attachments: parsed.attachments?.map(att => ({
            filename: att.filename || 'attachment',
            contentType: att.contentType || 'application/octet-stream',
            size: att.size || 0,
            content: att.content || Buffer.alloc(0)
          })) || []
        }
      })

      console.log(`Email salvo: ${parsed.subject}`)
    } catch (error) {
      console.error('Erro ao salvar email:', error)
    }
  }
}

// Inicializar worker se executado diretamente
if (require.main === module) {
  const worker = new EmailSyncWorker()
  
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

module.exports = EmailSyncWorker