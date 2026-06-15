const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API - Atividades Complementares',
      version: '1.0.0',
      description: 'API do sistema de gerenciamento de atividades complementares.'
    },
    servers: [
      {
        url: process.env.SERVER_URL || `http://localhost:${process.env.PORT || 3000}`,
        description: 'Servidor atual'
      }
    ],
    tags: [
      { name: 'Autenticação', description: 'Login de usuários' },
      { name: 'Alunos', description: 'Gerenciamento de alunos' },
      { name: 'Coordenadores', description: 'Gerenciamento de coordenadores' },
      { name: 'Cursos', description: 'Gerenciamento de cursos' },
      { name: 'Categorias', description: 'Categorias de atividades' },
      { name: 'Solicitações', description: 'Envio e avaliação de atividades complementares' },
      { name: 'Dashboard', description: 'Métricas gerais do sistema' }
    ]
  },
  apis: ['./routes/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;