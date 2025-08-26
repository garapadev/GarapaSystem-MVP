"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Star,
  Paperclip,
  MoreHorizontal,
  Archive,
  Trash2,
  MarkAsUnread,
  Forward,
  Reply,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"

interface Email {
  id: string
  from: {
    name: string
    email: string
  }
  to: string[]
  cc?: string[]
  bcc?: string[]
  subject: string
  body: string
  isRead: boolean
  isStarred: boolean
  hasAttachments: boolean
  folder: "inbox" | "sent" | "drafts" | "trash" | "spam"
  receivedAt: Date
  labels?: string[]
}

interface EmailListProps {
  emails: Email[]
  selectedEmails: string[]
  onEmailSelect: (emailId: string) => void
  onEmailClick: (email: Email) => void
  onEmailStar: (emailId: string) => void
  onEmailRead: (emailId: string, isRead: boolean) => void
  onEmailArchive: (emailId: string) => void
  onEmailDelete: (emailId: string) => void
  onEmailReply: (email: Email) => void
  onEmailForward: (email: Email) => void
}

const folderLabels = {
  inbox: "Caixa de Entrada",
  sent: "Enviados",
  drafts: "Rascunhos",
  trash: "Lixeira",
  spam: "Spam",
}

const folderColors = {
  inbox: "bg-blue-100 text-blue-800",
  sent: "bg-green-100 text-green-800",
  drafts: "bg-yellow-100 text-yellow-800",
  trash: "bg-red-100 text-red-800",
  spam: "bg-orange-100 text-orange-800",
}

function formatDate(date: Date): string {
  const now = new Date()
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
  
  if (diffInHours < 24) {
    return format(date, "HH:mm", { locale: ptBR })
  } else if (diffInHours < 24 * 7) {
    return format(date, "EEE", { locale: ptBR })
  } else {
    return format(date, "dd/MM", { locale: ptBR })
  }
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + "..."
}

export function EmailList({
  emails,
  selectedEmails,
  onEmailSelect,
  onEmailClick,
  onEmailStar,
  onEmailRead,
  onEmailArchive,
  onEmailDelete,
  onEmailReply,
  onEmailForward,
}: EmailListProps) {
  const [hoveredEmail, setHoveredEmail] = useState<string | null>(null)

  const toggleStar = (emailId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    onEmailStar(emailId)
  }

  const toggleRead = (emailId: string, isRead: boolean, event: React.MouseEvent) => {
    event.stopPropagation()
    onEmailRead(emailId, !isRead)
  }

  return (
    <div className="space-y-1">
      {emails.map((email) => {
        const isSelected = selectedEmails.includes(email.id)
        const isHovered = hoveredEmail === email.id
        
        return (
          <Card
            key={email.id}
            className={cn(
              "cursor-pointer transition-colors hover:bg-muted/50",
              !email.isRead && "border-l-4 border-l-primary",
              isSelected && "bg-muted"
            )}
            onMouseEnter={() => setHoveredEmail(email.id)}
            onMouseLeave={() => setHoveredEmail(null)}
            onClick={() => onEmailClick(email)}
          >
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => onEmailSelect(email.id)}
                  onClick={(e) => e.stopPropagation()}
                />
                
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-6 w-6 p-0",
                    email.isStarred ? "text-yellow-500" : "text-muted-foreground"
                  )}
                  onClick={(e) => toggleStar(email.id, e)}
                >
                  <Star className={cn("h-4 w-4", email.isStarred && "fill-current")} />
                </Button>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 min-w-0">
                      <span className={cn(
                        "font-medium truncate",
                        !email.isRead && "font-semibold"
                      )}>
                        {email.from.name || email.from.email}
                      </span>
                      
                      {email.folder !== "inbox" && (
                        <Badge
                          variant="secondary"
                          className={cn("text-xs", folderColors[email.folder])}
                        >
                          {folderLabels[email.folder]}
                        </Badge>
                      )}
                      
                      {email.cc && email.cc.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          CC
                        </Badge>
                      )}
                      
                      {email.hasAttachments && (
                        <Paperclip className="h-3 w-3 text-muted-foreground" />
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-muted-foreground">
                        {formatDate(email.receivedAt)}
                      </span>
                      
                      {(isHovered || isSelected) && (
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={(e) => toggleRead(email.id, email.isRead, e)}
                          >
                            <MarkAsUnread className="h-3 w-3" />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation()
                              onEmailArchive(email.id)
                            }}
                          >
                            <Archive className="h-3 w-3" />
                          </Button>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreHorizontal className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => onEmailReply(email)}>
                                <Reply className="h-4 w-4 mr-2" />
                                Responder
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onEmailForward(email)}>
                                <Forward className="h-4 w-4 mr-2" />
                                Encaminhar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => onEmailDelete(email.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-1">
                    <p className={cn(
                      "text-sm truncate",
                      !email.isRead && "font-medium"
                    )}>
                      {email.subject}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-1">
                      {truncateText(email.body.replace(/<[^>]*>/g, ""), 100)}
                    </p>
                  </div>
                  
                  {email.labels && email.labels.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {email.labels.map((label) => (
                        <Badge key={label} variant="outline" className="text-xs">
                          {label}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
      
      {emails.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          Nenhum email encontrado.
        </div>
      )}
    </div>
  )
}