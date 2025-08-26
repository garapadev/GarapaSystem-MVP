import { PrismaClient } from '@prisma/client'
import { useSession } from 'next-auth/react'

const prisma = new PrismaClient()

// Função para buscar permissões de um usuário
export async function getUserPermissions(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        employee: {
          include: {
            groups: {
              include: {
                group: {
                  include: {
                    permissions: {
                      include: {
                        permission: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!user?.employee) {
      return []
    }

    // Coletar todas as permissões dos grupos do usuário
    const permissions: Array<{
      resource: string
      action: string
    }> = []

    user.employee.groups.forEach(employeeGroup => {
      employeeGroup.group.permissions.forEach(groupPermission => {
        permissions.push({
          resource: groupPermission.permission.resource,
          action: groupPermission.permission.action
        })
      })
    })

    // Remover duplicatas
    const uniquePermissions = permissions.filter((permission, index, self) => 
      index === self.findIndex(p => 
        p.resource === permission.resource && p.action === permission.action
      )
    )

    return uniquePermissions
  } catch (error) {
    console.error('Erro ao buscar permissões do usuário:', error)
    return []
  }
}

// Função para verificar se usuário tem uma permissão específica
export async function hasPermission(
  userId: string, 
  resource: string, 
  action: string
): Promise<boolean> {
  try {
    const permissions = await getUserPermissions(userId)
    return permissions.some(p => p.resource === resource && p.action === action)
  } catch (error) {
    console.error('Erro ao verificar permissão:', error)
    return false
  }
}

// Hook para usar permissões no frontend
export function usePermissions() {
  const { data: session } = useSession()
  
  const permissions = session?.user?.permissions || []
  
  const hasPermission = (resource: string, action: string) => {
    return permissions.some((p: any) => p.resource === resource && p.action === action)
  }
  
  return {
    permissions,
    hasPermission
  }
}