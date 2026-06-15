const express = require('express');
const router = express.Router();
const Categoria = require('../models/Categoria');

// categorias academicas padrao
const CATEGORIAS_PADRAO = [
  {
    nome: 'Pesquisa e Iniciação Científica',
    descricao: 'Participação em projetos de pesquisa, iniciação científica, publicação de artigos e trabalhos científicos.'
  },
  {
    nome: 'Extensão e Projetos Sociais',
    descricao: 'Atividades de extensão universitária, projetos sociais, voluntariado e ações comunitárias.'
  },
  {
    nome: 'Ensino e Monitoria',
    descricao: 'Monitoria acadêmica, tutoria, participação como instrutor em cursos e minicursos.'
  },
  {
    nome: 'Eventos Científicos e Tecnológicos',
    descricao: 'Participação em congressos, simpósios, seminários, workshops e feiras tecnológicas.'
  },
  {
    nome: 'Vivência Profissional',
    descricao: 'Estágio não obrigatório, empresa júnior, visitas técnicas e atividades em ambiente profissional.'
  },
  {
    nome: 'Representação Estudantil',
    descricao: 'Atuação em diretório acadêmico, centro acadêmico, colegiado de curso e órgãos colegiados.'
  },
  {
    nome: 'Cultura, Arte e Esporte',
    descricao: 'Participação em grupos culturais, artísticos, esportivos e competições acadêmicas.'
  },
  {
    nome: 'Cursos e Capacitações',
    descricao: 'Cursos livres, certificações, treinamentos e capacitações complementares à formação acadêmica.'
  }
];

/**
 * @swagger
 * /api/categorias:
 *   get:
 *     summary: Lista todas as categorias de atividades
 *     tags: [Categorias]
 *     responses:
 *       200:
 *         description: Lista de categorias retornada com sucesso
 */
router.get('/', async (req, res) => {
  try {
    const categorias = await Categoria.find().sort({ nome: 1 });
    res.json(categorias);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao listar categorias', detalhe: error.message });
  }
});

/**
 * @swagger
 * /api/categorias/popular:
 *   post:
 *     summary: Apaga as categorias existentes e cria as categorias acadêmicas padrão
 *     tags: [Categorias]
 *     responses:
 *       201:
 *         description: Categorias criadas com sucesso
 */
router.post('/popular', async (req, res) => {
  try {
    await Categoria.deleteMany({});
    const criadas = await Categoria.insertMany(CATEGORIAS_PADRAO);
    res.status(201).json({
      mensagem: `${criadas.length} categorias criadas com sucesso!`,
      categorias: criadas
    });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao popular categorias', detalhe: error.message });
  }
});

/**
 * @swagger
 * /api/categorias/{id}:
 *   get:
 *     summary: Busca uma categoria pelo ID
 *     tags: [Categorias]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Categoria encontrada
 *       404:
 *         description: Categoria não encontrada
 */
router.get('/:id', async (req, res) => {
  try {
    const categoria = await Categoria.findById(req.params.id);
    if (!categoria) return res.status(404).json({ erro: 'Categoria não encontrada' });
    res.json(categoria);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao buscar categoria', detalhe: error.message });
  }
});

/**
 * @swagger
 * /api/categorias:
 *   post:
 *     summary: Cria uma nova categoria
 *     tags: [Categorias]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nome
 *             properties:
 *               nome:
 *                 type: string
 *               descricao:
 *                 type: string
 *     responses:
 *       201:
 *         description: Categoria criada com sucesso
 */
router.post('/', async (req, res) => {
  try {
    const { nome, descricao } = req.body;
    if (!nome) return res.status(400).json({ erro: 'Nome da categoria é obrigatório' });

    const categoria = new Categoria({ nome, descricao });
    await categoria.save();
    res.status(201).json(categoria);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao criar categoria', detalhe: error.message });
  }
});

/**
 * @swagger
 * /api/categorias/{id}:
 *   delete:
 *     summary: Remove uma categoria
 *     tags: [Categorias]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Categoria removida com sucesso
 *       404:
 *         description: Categoria não encontrada
 */
router.delete('/:id', async (req, res) => {
  try {
    const categoria = await Categoria.findByIdAndDelete(req.params.id);
    if (!categoria) return res.status(404).json({ erro: 'Categoria não encontrada' });
    res.json({ mensagem: 'Categoria removida com sucesso' });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao remover categoria', detalhe: error.message });
  }
});

module.exports = router;
