import { createSwaggerSpec } from 'next-swagger-doc'

export const getApiDocs = async () => {
  const spec = createSwaggerSpec({
    apiFolder: 'src/app/api',
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'GarapaSystem-MVP API',
        version: '1.0.0',
        description: 'API documentation for GarapaSystem-MVP'
      },
      servers: [
        {
          url: process.env.NEXTAUTH_URL || 'http://localhost:3000',
          description: 'Development server'
        }
      ],
      components: {
        securitySchemes: {
          BearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          }
        },
        schemas: {
          Error: {
            type: 'object',
            properties: {
              error: {
                type: 'string'
              },
              message: {
                type: 'string'
              }
            }
          },
          PaginationMeta: {
            type: 'object',
            properties: {
              page: {
                type: 'integer'
              },
              limit: {
                type: 'integer'
              },
              total: {
                type: 'integer'
              },
              totalPages: {
                type: 'integer'
              }
            }
          },
          Employee: {
            type: 'object',
            properties: {
              id: {
                type: 'string'
              },
              employeeNumber: {
                type: 'string'
              },
              firstName: {
                type: 'string'
              },
              lastName: {
                type: 'string'
              },
              email: {
                type: 'string'
              },
              phone: {
                type: 'string'
              },
              position: {
                type: 'string'
              },
              department: {
                type: 'string'
              },
              hireDate: {
                type: 'string',
                format: 'date'
              },
              salary: {
                type: 'number'
              },
              isActive: {
                type: 'boolean'
              },
              createdAt: {
                type: 'string',
                format: 'date-time'
              },
              updatedAt: {
                type: 'string',
                format: 'date-time'
              }
            }
          },
          Task: {
            type: 'object',
            properties: {
              id: {
                type: 'string'
              },
              title: {
                type: 'string'
              },
              description: {
                type: 'string'
              },
              status: {
                type: 'string',
                enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']
              },
              priority: {
                type: 'string',
                enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
              },
              dueDate: {
                type: 'string',
                format: 'date-time'
              },
              assigneeId: {
                type: 'string'
              },
              createdById: {
                type: 'string'
              },
              createdAt: {
                type: 'string',
                format: 'date-time'
              },
              updatedAt: {
                type: 'string',
                format: 'date-time'
              }
            }
          },
          EmailAccount: {
            type: 'object',
            properties: {
              id: {
                type: 'string'
              },
              name: {
                type: 'string'
              },
              email: {
                type: 'string'
              },
              imapHost: {
                type: 'string'
              },
              imapPort: {
                type: 'integer'
              },
              imapSecure: {
                type: 'boolean'
              },
              smtpHost: {
                type: 'string'
              },
              smtpPort: {
                type: 'integer'
              },
              smtpSecure: {
                type: 'boolean'
              },
              isActive: {
                type: 'boolean'
              },
              createdAt: {
                type: 'string',
                format: 'date-time'
              },
              updatedAt: {
                type: 'string',
                format: 'date-time'
              }
            }
          },
          Email: {
            type: 'object',
            properties: {
              id: {
                type: 'string'
              },
              messageId: {
                type: 'string'
              },
              subject: {
                type: 'string'
              },
              fromAddress: {
                type: 'string'
              },
              fromName: {
                type: 'string'
              },
              toAddresses: {
                type: 'array',
                items: {
                  type: 'string'
                }
              },
              ccAddresses: {
                type: 'array',
                items: {
                  type: 'string'
                }
              },
              bccAddresses: {
                type: 'array',
                items: {
                  type: 'string'
                }
              },
              bodyText: {
                type: 'string'
              },
              bodyHtml: {
                type: 'string'
              },
              hasAttachments: {
                type: 'boolean'
              },
              isRead: {
                type: 'boolean'
              },
              receivedAt: {
                type: 'string',
                format: 'date-time'
              },
              emailAccountId: {
                type: 'string'
              },
              createdAt: {
                type: 'string',
                format: 'date-time'
              }
            }
          },
          Group: {
            type: 'object',
            properties: {
              id: {
                type: 'string'
              },
              name: {
                type: 'string'
              },
              description: {
                type: 'string'
              },
              isActive: {
                type: 'boolean'
              },
              createdAt: {
                type: 'string',
                format: 'date-time'
              },
              updatedAt: {
                type: 'string',
                format: 'date-time'
              }
            }
          },
          PermissionGroup: {
            type: 'object',
            properties: {
              id: {
                type: 'string'
              },
              groupId: {
                type: 'string'
              },
              permissionId: {
                type: 'string'
              },
              createdAt: {
                type: 'string',
                format: 'date-time'
              }
            }
          }
        }
      }
    }
  })
  return spec
}