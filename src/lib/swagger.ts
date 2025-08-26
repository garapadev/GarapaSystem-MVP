import swaggerJsdoc from 'swagger-jsdoc'

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'GarapaSystem-MVP API',
      version: '1.0.0',
      description: 'API completa para GarapaSystem-MVP com gestão de colaboradores, tarefas, webmail e muito mais',
      contact: {
        name: 'CRM API Support',
        email: 'api-support@company.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Servidor de Desenvolvimento',
      },
      {
        url: 'https://api.crm.company.com',
        description: 'Servidor de Produção',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Mensagem de erro',
            },
            details: {
              type: 'array',
              items: {
                type: 'object',
              },
              description: 'Detalhes adicionais do erro',
            },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            page: {
              type: 'integer',
              description: 'Página atual',
            },
            limit: {
              type: 'integer',
              description: 'Itens por página',
            },
            totalCount: {
              type: 'integer',
              description: 'Total de itens',
            },
            totalPages: {
              type: 'integer',
              description: 'Total de páginas',
            },
            hasNext: {
              type: 'boolean',
              description: 'Tem próxima página',
            },
            hasPrev: {
              type: 'boolean',
              description: 'Tem página anterior',
            },
          },
        },
        Employee: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'ID único do colaborador',
            },
            employeeNumber: {
              type: 'string',
              description: 'Número do colaborador',
            },
            firstName: {
              type: 'string',
              description: 'Primeiro nome',
            },
            lastName: {
              type: 'string',
              description: 'Sobrenome',
            },