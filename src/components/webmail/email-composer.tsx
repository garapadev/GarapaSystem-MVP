"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { X, Paperclip, Send } from "lucide-react"
import { toast } from "sonner"

const emailSchema = z.object({
  to: z.string().min(1, "Campo obrigatório"),
  cc: z.string().optional(),
  bcc: z.string().optional(),
  subject: z.string().min(1, "Assunto é obrigatório"),
  body: z.string().min(1, "Corpo do email é obrigatório"),
})

type EmailFormData = z.infer<typeof emailSchema>

interface EmailComposerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  replyTo?: {
    to: string
    subject: string
    body?: string
  }
}

interface Attachment {
  id: string
  name: string
  size: number
  file: File
}

export function EmailComposer({
  open,
  onOpenChange,
  replyTo,
}: EmailComposerProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showCc, setShowCc] = useState(false)
  const [showBcc, setShowBcc] = useState(false)
  const [isHtmlMode, setIsHtmlMode] = useState(false)
  const [attachments, setAttachments] = useState<Attachment[]>([])

  const form = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      to: "",
      cc: "",
      bcc: "",
      subject: "",
      body: "",
    },
  })

  useEffect(() => {
    if (replyTo) {
      form.setValue("to", replyTo.to)
      form.setValue("subject", replyTo.subject.startsWith("Re: ") ? replyTo.subject : `Re: ${replyTo.subject}`)
      if (replyTo.body) {
        form.setValue("body", `\n\n--- Mensagem original ---\n${replyTo.body}`)
      }
    }
  }, [replyTo, form])

  const parseEmails = (emailString: string): string[] => {
    return emailString
      .split(/[,;]/) // Separar por vírgula ou ponto e vírgula
      .map(email => email.trim())
      .filter(email => email.length > 0)
  }

  const validateEmails = (emailString: string): boolean => {
    if (!emailString.trim()) return true // Campo opcional
    
    const emails = parseEmails(emailString)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    
    return emails.every(email => emailRegex.test(email))
  }

  const handleSubmit = async (data: EmailFormData) => {
    // Validar emails
    if (!validateEmails(data.to)) {
      toast.error("Email(s) de destinatário inválido(s)")
      return
    }
    if (data.cc && !validateEmails(data.cc)) {
      toast.error("Email(s) de CC inválido(s)")
      return
    }
    if (data.bcc && !validateEmails(data.bcc)) {
      toast.error("Email(s) de BCC inválido(s)")
      return
    }

    setIsLoading(true)
    try {
      // Preparar dados do email
      const emailData = {
        ...data,
        to: parseEmails(data.to),
        cc: data.cc ? parseEmails(data.cc) : undefined,
        bcc: data.bcc ? parseEmails(data.bcc) : undefined,
        attachments: attachments.map(att => ({
          name: att.name,
          size: att.size,
          // TODO: Converter arquivo para base64 ou upload para servidor
          content: att.file,
        })),
        isHtml: isHtmlMode,
      }

      // TODO: Implementar envio do email
      console.log("Enviando email:", emailData)
      
      toast.success("Email enviado com sucesso!")
      form.reset()
      setAttachments([])
      onOpenChange(false)
    } catch (error) {
      console.error("Erro ao enviar email:", error)
      toast.error("Erro ao enviar email")
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileAttachment = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    Array.from(files).forEach(file => {
      const attachment: Attachment = {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: file.size,
        file,
      }
      setAttachments(prev => [...prev, attachment])
    })

    // Limpar input
    event.target.value = ""
  }

  const removeAttachment = (attachmentId: string) => {
    setAttachments(prev => prev.filter(att => att.id !== attachmentId))
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Email</DialogTitle>
          <DialogDescription>
            Compose um novo email para enviar.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="to"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Para</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="email@exemplo.com, outro@exemplo.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowCc(!showCc)}
              >
                CC
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowBcc(!showBcc)}
              >
                BCC
              </Button>
            </div>
            
            {showCc && (
              <FormField
                control={form.control}
                name="cc"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CC</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="email@exemplo.com, outro@exemplo.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            {showBcc && (
              <FormField
                control={form.control}
                name="bcc"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>BCC</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="email@exemplo.com, outro@exemplo.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assunto</FormLabel>
                  <FormControl>
                    <Input placeholder="Digite o assunto do email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex items-center space-x-2">
              <Switch
                id="html-mode"
                checked={isHtmlMode}
                onCheckedChange={setIsHtmlMode}
              />
              <label htmlFor="html-mode" className="text-sm font-medium">
                Modo HTML
              </label>
            </div>
            
            <FormField
              control={form.control}
              name="body"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mensagem</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Digite sua mensagem aqui..."
                      className="min-h-[200px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  id="file-attachment"
                  multiple
                  className="hidden"
                  onChange={handleFileAttachment}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById("file-attachment")?.click()}
                >
                  <Paperclip className="h-4 w-4 mr-2" />
                  Anexar Arquivo
                </Button>
              </div>
              
              {attachments.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Anexos:</p>
                  <div className="flex flex-wrap gap-2">
                    {attachments.map((attachment) => (
                      <Badge
                        key={attachment.id}
                        variant="secondary"
                        className="flex items-center gap-1 pr-1"
                      >
                        <span className="text-xs">
                          {attachment.name} ({formatFileSize(attachment.size)})
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                          onClick={() => removeAttachment(attachment.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  "Enviando..."
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Enviar
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}