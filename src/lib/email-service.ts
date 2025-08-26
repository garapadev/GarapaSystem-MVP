import Imap from 'node-imap'
import * as nodemailer from 'nodemailer'
import { simpleParser } from 'mailparser'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Interface para configuração de conta de email
interface EmailAccountConfig {
  id: string
  name: string
  email: string
  imapHost: string
  imapPort: number
  imapSecure: boolean
  smtpHost: string
  smtpPort: number
  smtpSecure: boolean
  username: string
  password: string
}

// Interface para email parseado
interface ParsedEmail {
  messageId: string
  subject: string
  from: { address: string; name?: string }
  to: Array<{ address: string; name?: string }>
  cc?: Array<{ address: string; name?: string }>
  bcc?: Array<{ address: string; name?: string }>
  date: Date
  textBody?: string
  htmlBody?: string
  attachments: Array<{
    filename: string
    contentType: string
    size: number
    content: Buffer
  }>
}

// Classe para gerenciar operações de email
export class EmailService {
  private account: EmailAccountConfig

  constructor(account: EmailAccountConfig) {
    this.account = account
  }

  // Conectar ao IMAP e buscar emails
  async syncEmails(folderName: string = 'INBOX', limit: number = 50): Promise<ParsedEmail[]> {
    return new Promise((resolve, reject) => {
      const imapConfig = {
        user: this.account.username,
        password: this.account.password,
        host: this.account.imapHost,
        port: this.account.imapPort,
        tls: this.account.imapSecure,
        connTimeout: 60000,
        authTimeout: 3000,
        tlsOptions: { rejectUnauthorized: false }
      }

      const imap = new Imap(imapConfig)
      const emails: ParsedEmail[] = []

      imap.once('ready', () => {
        imap.openBox(folderName, false, (err, box) => {
          if (err) {
            reject(err)
            return
          }

          // Buscar os últimos emails
          const searchCriteria = ['ALL']
          const fetchOptions = {
            bodies: '',
            struct: true,
            markSeen: false
          }

          imap.search(searchCriteria, (err, results) => {
            if (err) {
              reject(err)
              return
            }

            if (!results || results.length === 0) {
              resolve([])
              return
            }

            // Pegar apenas os últimos N emails
            const recentResults = results.slice(-limit)
            const fetch = imap.fetch(recentResults, fetchOptions)
            let emailCount = 0

            fetch.on('message', (msg, seqno) => {
              let buffer = ''
              let attributes: any = null