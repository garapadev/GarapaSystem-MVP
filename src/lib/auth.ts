import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { getUserPermissions } from './permissions'

const prisma = new PrismaClient()

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // Buscar usuário no banco
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email
            },
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

          if (!user) {
            return null
          }

          // Verificar senha
          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          )

          if (!isPasswordValid) {
            return null
          }

          // Verificar se usuário está ativo
          if (!user.isActive) {
            return null
          }

          // Buscar permissões do usuário
          const permissions = await getUserPermissions(user.id)

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            employee: user.employee,
            permissions
          }
        } catch (error) {
          console.error('Erro na autenticação:', error)
          return null
        }
      }
    })
  ],
  callbacks: {
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id
        session.user.employee = token.employee
        session.user.permissions = token.permissions
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.employee = user.employee
        token.permissions = user.permissions
      }
      return token
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error'
  },
  session: {
    strategy: 'jwt'
  }
}

export default NextAuth(authOptions)