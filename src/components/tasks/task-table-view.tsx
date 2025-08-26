"use client"

import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, ArrowUpDown } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface Task {
  id: string
  title: string
  description?: string
  status: "todo" | "in_progress" | "done"
  priority: "low" | "medium" | "high"
  dueDate?: Date
  assignedTo?: string
  createdAt: Date
  updatedAt: Date
}

interface TaskTableViewProps {
  tasks: Task[]
  onTaskEdit: (task: Task) => void
  onTaskDelete: (taskId: string) => void
}

type SortField = "title" | "status" | "priority" | "dueDate" | "assignedTo" | "createdAt"
type SortDirection = "asc" | "desc"

const statusLabels = {
  todo: "A Fazer",
  in_progress: "Em Progresso",
  done: "Concluído",
}

const statusColors = {
  todo: "bg-gray-100 text-gray-800",
  in_progress: "bg-blue-100 text-blue-800",
  done: "bg-green-100 text-green-800",
}

const priorityLabels = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
}

const priorityColors = {
  low: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-red-100 text-red-800",
}

function formatDate(date: Date | undefined): string {
  if (!date) return "-"
  return format(date, "dd/MM/yyyy", { locale: ptBR })
}

function isOverdue(date: Date | undefined): boolean {
  if (!date) return false
  return date < new Date()
}

export function TaskTableView({
  tasks,
  onTaskEdit,
  onTaskDelete,
}: TaskTableViewProps) {
  const [sortField, setSortField] = useState<SortField>("createdAt")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const sortedTasks = [...tasks].sort((a, b) => {
    let aValue: any = a[sortField]
    let bValue: any = b[sortField]

    // Tratar valores undefined
    if (aValue === undefined) aValue = ""
    if (bValue === undefined) bValue = ""

    // Tratar datas
    if (sortField === "dueDate" || sortField === "createdAt") {
      aValue = aValue ? new Date(aValue).getTime() : 0
      bValue = bValue ? new Date(bValue).getTime() : 0
    }

    // Tratar strings
    if (typeof aValue === "string" && typeof bValue === "string") {
      aValue = aValue.toLowerCase()
      bValue = bValue.toLowerCase()
    }

    if (aValue < bValue) {
      return sortDirection === "asc" ? -1 : 1
    }
    if (aValue > bValue) {
      return sortDirection === "asc" ? 1 : -1
    }
    return 0
  })

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 p-0 font-semibold"
      onClick={() => handleSort(field)}
    >
      {children}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  )

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <SortButton field="title">Título</SortButton>
            </TableHead>
            <TableHead>
              <SortButton field="status">Status</SortButton>
            </TableHead>
            <TableHead>
              <SortButton field="priority">Prioridade</SortButton>
            </TableHead>
            <TableHead>
              <SortButton field="dueDate">Vencimento</SortButton>
            </TableHead>
            <TableHead>
              <SortButton field="assignedTo">Responsável</SortButton>
            </TableHead>
            <TableHead>
              <SortButton field="createdAt">Criado em</SortButton>
            </TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedTasks.map((task) => (
            <TableRow key={task.id}>
              <TableCell>
                <div>
                  <div className="font-medium">{task.title}</div>
                  {task.description && (
                    <div className="text-sm text-muted-foreground line-clamp-1">
                      {task.description}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge
                  variant="secondary"
                  className={statusColors[task.status]}
                >
                  {statusLabels[task.status]}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant="secondary"
                  className={priorityColors[task.priority]}
                >
                  {priorityLabels[task.priority]}
                </Badge>
              </TableCell>
              <TableCell>
                <span
                  className={`${
                    isOverdue(task.dueDate) && task.status !== "done"
                      ? "text-red-600 font-medium"
                      : ""
                  }`}
                >
                  {formatDate(task.dueDate)}
                </span>
              </TableCell>
              <TableCell>{task.assignedTo || "-"}</TableCell>
              <TableCell>{formatDate(task.createdAt)}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onTaskEdit(task)}>
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onTaskDelete(task.id)}
                      className="text-red-600"
                    >
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {sortedTasks.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          Nenhuma tarefa encontrada.
        </div>
      )}
    </div>
  )
}