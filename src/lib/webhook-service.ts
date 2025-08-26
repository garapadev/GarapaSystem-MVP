import crypto from 'crypto'

// Interface para configuração de webhook
interface WebhookConfig {
  url: string
  secret?: string
  headers?: Record<string, string>
  timeout?: number
}

// Interface para payload do webhook
interface WebhookPayload {
  event: string
  data: any
  timestamp: string
  source: string
}

// Interface para resposta do webhook
interface WebhookResponse {
  success: boolean
  status: number
  response?: any
  error?: string
  duration: number
}

// Classe para gerenciar webhooks
export class WebhookService {
  private config: WebhookConfig

  constructor(config: WebhookConfig) {
    this.config = {
      timeout: 30000, // 30 segundos por padrão
      ...config
    }
  }

  // Gerar assinatura HMAC para o payload
  private generateSignature(payload: string, secret: string): string {
    return crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex')
  }

  // Enviar webhook
  async sendWebhook(payload: WebhookPayload): Promise<WebhookResponse> {
    const startTime = Date.now()
    
    try {
      const payloadString = JSON.stringify(payload)
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'GarapaSystem-Webhook/1.0',
        ...this.config.headers
      }

      // Adicionar assinatura se secret estiver configurado
      if (this.config.secret) {
        const signature = this.generateSignature(payloadString, this.config.secret)
        headers['X-Webhook-Signature'] = `sha256=${signature}`
      }

      // Fazer requisição HTTP
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

      const response = await fetch(this.config.url, {
        method: 'POST',
        headers,
        body: payloadString,
        signal: controller.signal
      })

      clearTimeout(timeoutId)
      const duration = Date.now() - startTime

      let responseData: any
      try {
        responseData = await response.json()
      } catch {
        responseData = await response.text()
      }

      return {
        success: response.ok,
        status: response.status,
        response: responseData,
        duration
      }
    } catch (error: any) {
      const duration = Date.now() - startTime
      
      return {
        success: false,
        status: 0,
        error: error.message || 'Unknown error',
        duration
      }
    }
  }

  // Enviar webhook com retry
  async sendWebhookWithRetry(
    payload: WebhookPayload,
    maxRetries: number = 3,
    retryDelay: number = 1000
  ): Promise<WebhookResponse> {
    let lastResponse: WebhookResponse

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      lastResponse = await this.sendWebhook(payload)

      if (lastResponse.success) {
        return lastResponse
      }

      // Se não é a última tentativa, aguardar antes de tentar novamente
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt))
      }
    }

    return lastResponse!
  }

  // Validar assinatura de webhook recebido
  static validateSignature(
    payload: string,
    signature: string,
    secret: string
  ): boolean {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex')
      
      const receivedSignature = signature.replace('sha256=', '')
      
      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(receivedSignature, 'hex')
      )
    } catch {
      return false
    }
  }
}

// Factory para criar instâncias de WebhookService
export class WebhookServiceFactory {
  static create(config: WebhookConfig): WebhookService {
    return new WebhookService(config)
  }

  // Criar múltiplos webhooks para diferentes endpoints
  static createMultiple(configs: WebhookConfig[]): WebhookService[] {
    return configs.map(config => new WebhookService(config))
  }
}

// Utilitários para webhooks
export const WebhookUtils = {
  // Criar payload padrão
  createPayload(
    event: string,
    data: any,
    source: string = 'GarapaSystem'
  ): WebhookPayload {
    return {
      event,
      data,
      timestamp: new Date().toISOString(),
      source
    }
  },

  // Validar URL de webhook
  isValidWebhookUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url)
      return ['http:', 'https:'].includes(parsedUrl.protocol)
    } catch {
      return false
    }
  }
}