"use client"

import { useState } from "react"
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Calendar, User } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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

interface TaskKanbanViewProps {
  tasks: Task[]
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void
  onTaskEdit: (task: Task) => void
  onTaskDelete: (taskId: string) => void
}

const columns = [
  { id: "todo", title: "A Fazer", status: "todo" as const },
  { id: "in_progress", title: "Em Progresso", status: "in_progress" as const },
  { id: "done", title: "Concluído", status: "done" as const },
]

const priorityColors = {
  low: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-red-100 text-red-800",
}

const priorityLabels = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
}

function TaskCard({
  task,
  onEdit,
  onDelete,
}: {
  task: Task
  onEdit: (task: Task) => void
  onDelete: (taskId: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`cursor-grab active:cursor-grabbing ${isDragging ? "opacity-50" : ""}`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-sm font-medium">{task.title}</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(task)}>
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(task.id)}
                className="text-red-600"
              >
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {task.description}
          </p>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          <Badge
            variant="secondary"
            className={priorityColors[task.priority]}
          >
            {priorityLabels[task.priority]}
          </Badge>
          
          {task.dueDate && (
            <div className="flex items-center text-xs text-muted-foreground">
              <Calendar className="mr-1 h-3 w-3" />
              {format(task.dueDate, "dd/MM/yyyy", { locale: ptBR })}
            </div>
          )}
          
          {task.assignedTo && (
            <div className="flex items-center text-xs text-muted-foreground">
              <User className="mr-1 h-3 w-3" />
              {task.assignedTo}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function KanbanColumn({
  column,
  tasks,
  onTaskEdit,
  onTaskDelete,
}: {
  column: typeof columns[0]
  tasks: Task[]
  onTaskEdit: (task: Task) => void
  onTaskDelete: (taskId: string) => void
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold">{column.title}</h3>
        <Badge variant="secondary">{tasks.length}</Badge>
      </div>
      
      <div className="flex-1 p-4 space-y-3 overflow-y-auto">
        <SortableContext items={tasks} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={onTaskEdit}
              onDelete={onTaskDelete}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  )
}

export function TaskKanbanView({
  tasks,
  onTaskUpdate,
  onTaskEdit,
  onTaskDelete,
}: TaskKanbanViewProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id)
    setActiveTask(task || null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)

    if (!over) return

    const activeTask = tasks.find((t) => t.id === active.id)
    if (!activeTask) return

    // Se foi solto em uma coluna diferente
    const overColumn = columns.find((col) => col.id === over.id)
    if (overColumn && activeTask.status !== overColumn.status) {
      onTaskUpdate(activeTask.id, { status: overColumn.status })
      return
    }

    // Se foi solto em outra tarefa, reorganizar
    const overTask = tasks.find((t) => t.id === over.id)
    if (overTask && activeTask.id !== overTask.id) {
      const activeIndex = tasks.findIndex((t) => t.id === activeTask.id)
      const overIndex = tasks.findIndex((t) => t.id === overTask.id)
      
      if (activeTask.status === overTask.status) {
        // Reorganizar dentro da mesma coluna
        const newTasks = arrayMove(tasks, activeIndex, overIndex)
        // Aqui você pode implementar a lógica para salvar a nova ordem
      } else {
        // Mover para coluna diferente
        onTaskUpdate(activeTask.id, { status: overTask.status })
      }
    }
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
        {columns.map((column) => {
          const columnTasks = tasks.filter((task) => task.status === column.status)
          
          return (
            <Card key={column.id} className="flex flex-col h-full">
              <KanbanColumn
                column={column}
                tasks={columnTasks}
                onTaskEdit={onTaskEdit}
                onTaskDelete={onTaskDelete}
              />
            </Card>
          )
        })}
      </div>
      
      <DragOverlay>
        {activeTask ? (
          <TaskCard
            task={activeTask}
            onEdit={() => {}}
            onDelete={() => {}}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}