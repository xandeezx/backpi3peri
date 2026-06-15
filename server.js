require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');

const app = express();

// ==================== MIDDLEWARES ====================
app.use(cors());
// limite de 10mb para suportar PDF em base64
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Log de requisições
app.use((req, res, next) => {
  const inicio = Date.now();
  res.on('finish', () => {
    const duracao = Date.now() - inicio;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} → ${res.statusCode} (${duracao}ms)`);
  });
  next();
});

// ==================== SWAGGER ====================
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'API - Atividades Complementares'
}));

// ==================== ROTAS ====================
app.use('/api/auth',          require('./routes/auth'));
app.use('/api/alunos',        require('./routes/alunos'));
app.use('/api/coordenadores', require('./routes/coordenadores'));
app.use('/api/cursos',        require('./routes/cursos'));
app.use('/api/categorias',    require('./routes/categorias'));
app.use('/api/solicitacoes',  require('./routes/solicitacoes'));
app.use('/api/dashboard',     require('./routes/dashboard'));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', versao: '2.0.0', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.json({ mensagem: 'API de Atividades Complementares v2 — Acesse /api-docs para a documentação' });
});

// ==================== MONGODB ====================
const MONGO_URI = process.env.MONGODB_URI;
const PORT = process.env.PORT || 10000;

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ Conectado ao MongoDB com sucesso!');
    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
      console.log(`📄 Swagger: http://localhost:${PORT}/api-docs`);
      console.log(`📧 E-mail: ${process.env.SMTP_USER ? 'CONFIGURADO ✅' : 'NÃO CONFIGURADO ⚠️  (adicione SMTP_* no .env)'}`);
    });
  })
  .catch((error) => {
    console.error('❌ Erro ao conectar ao MongoDB:', error.message);
    process.exit(1);
  });
