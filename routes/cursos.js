const express = require('express');
const router = express.Router();
const Curso = require('../models/Curso');
const Atividade = require('../models/Atividade');
const { registrarLog } = require('../middleware/logger');

/**
 * @swagger
 * /api/cursos:
 *   get:
 *     summary: Lista todos os cursos
 *     tags: [Cursos]
 *     responses:
 *       200:
 *         description: Lista de cursos retornada com sucesso
 */
router.get('/', async (req, res) => {
  try {
    const lista = await Curso.find().populate('regrasCategoria.idCategoria', 'nome');
    res.json(lista);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao listar cursos', detalhe: error.message });
  }
});

/**
 * @swagger
 * /api/cursos/{id}:
 *   get:
 *     summary: Busca um curso pelo ID
 *     tags: [Cursos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Curso encontrado
 *       404:
 *         description: Curso não encontrado
 */
router.get('/:id', async (req, res) => {
  try {
    const curso = await Curso.findById(req.params.id).populate('regrasCategoria.idCategoria', 'nome');
    if (!curso) return res.status(404).json({ erro: 'Curso não encontrado' });
    res.json(curso);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao buscar curso', detalhe: error.message });
  }
});

/**
 * @swagger
 * /api/cursos:
 *   post:
 *     summary: Cria um novo curso com regras de horas por categoria
 *     tags: [Cursos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nome, cargaHorariaTotal]
 *             properties:
 *               nome:
 *                 type: string
 *                 example: Sistemas de Informação
 *               cargaHorariaTotal:
 *                 type: number
 *                 example: 200
 *               regrasCategoria:
 *                 type: array
 *                 description: Limite de horas por categoria
 *                 items:
 *                   type: object
 *                   properties:
 *                     idCategoria:
 *                       type: string
 *                     maxHoras:
 *                       type: number
 *     responses:
 *       201:
 *         description: Curso criado com sucesso
 */
router.post('/', async (req, res) => {
  try {
    const { nome, cargaHorariaTotal, regrasCategoria } = req.body;

    if (!nome || !cargaHorariaTotal) {
      return res.status(400).json({ erro: 'Nome e carga horária total são obrigatórios' });
    }

    // Valida que a soma dos limites por categoria não ultrapassa a carga total
    if (regrasCategoria && regrasCategoria.length > 0) {
      const somaLimites = regrasCategoria.reduce((acc, r) => acc + (r.maxHoras || 0), 0);
      if (somaLimites > cargaHorariaTotal) {
        return res.status(400).json({
          erro: 'A soma dos limites por categoria não pode ultrapassar a carga horária total do curso.',
          detalhe: `Soma atual: ${somaLimites}h / Total do curso: ${cargaHorariaTotal}h`
        });
      }
    }

    const curso = new Curso({ nome, cargaHorariaTotal, regrasCategoria: regrasCategoria || [] });
    await curso.save();

    await registrarLog({
      acao: 'curso_criado',
      descricao: `Curso "${nome}" criado com carga de ${cargaHorariaTotal}h`,
      idReferencia: curso._id,
      tipoReferencia: 'Curso',
      ip: req.ip
    });

    res.status(201).json(curso);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao criar curso', detalhe: error.message });
  }
});

/**
 * @swagger
 * /api/cursos/{id}:
 *   put:
 *     summary: Atualiza um curso e suas regras de horas
 *     tags: [Cursos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Curso atualizado com sucesso
 */
router.put('/:id', async (req, res) => {
  try {
    const { nome, cargaHorariaTotal, regrasCategoria } = req.body;

    if (regrasCategoria && cargaHorariaTotal) {
      const somaLimites = regrasCategoria.reduce((acc, r) => acc + (r.maxHoras || 0), 0);
      if (somaLimites > cargaHorariaTotal) {
        return res.status(400).json({
          erro: 'A soma dos limites por categoria não pode ultrapassar a carga horária total.',
          detalhe: `Soma atual: ${somaLimites}h / Total do curso: ${cargaHorariaTotal}h`
        });
      }
    }

    const curso = await Curso.findByIdAndUpdate(
      req.params.id,
      { nome, cargaHorariaTotal, regrasCategoria },
      { new: true, runValidators: true }
    ).populate('regrasCategoria.idCategoria', 'nome');

    if (!curso) return res.status(404).json({ erro: 'Curso não encontrado' });

    await registrarLog({
      acao: 'curso_atualizado',
      descricao: `Curso "${curso.nome}" atualizado`,
      idReferencia: curso._id,
      tipoReferencia: 'Curso',
      ip: req.ip
    });

    res.json(curso);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao atualizar curso', detalhe: error.message });
  }
});

/**
 * @swagger
 * /api/cursos/{id}:
 *   delete:
 *     summary: Remove um curso
 *     tags: [Cursos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Curso removido com sucesso
 */
router.delete('/:id', async (req, res) => {
  try {
    const curso = await Curso.findByIdAndDelete(req.params.id);
    if (!curso) return res.status(404).json({ erro: 'Curso não encontrado' });
    res.json({ mensagem: 'Curso removido com sucesso' });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao remover curso', detalhe: error.message });
  }
});

/**
 * @swagger
 * /api/cursos/{id}/progresso/{idAluno}:
 *   get:
 *     summary: Retorna o progresso de horas de um aluno no curso
 *     tags: [Cursos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: idAluno
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Progresso do aluno retornado
 */
router.get('/:id/progresso/:idAluno', async (req, res) => {
  try {
    const curso = await Curso.findById(req.params.id).populate('regrasCategoria.idCategoria', 'nome');
    if (!curso) return res.status(404).json({ erro: 'Curso não encontrado' });

    const atividadesAprovadas = await Atividade.find({
      idAluno: req.params.idAluno,
      idCurso: req.params.id,
      status: 'aprovado'
    }).populate('idCategoria', 'nome');

    const totalAprovado = atividadesAprovadas.reduce((acc, a) => acc + (a.avaliacao?.cargaHorariaValidada || 0), 0);

    // Progresso por categoria
    const progressoPorCategoria = curso.regrasCategoria.map(regra => {
      const horasCategoria = atividadesAprovadas
        .filter(a => a.idCategoria?._id.toString() === regra.idCategoria?._id.toString())
        .reduce((acc, a) => acc + (a.avaliacao?.cargaHorariaValidada || 0), 0);

      return {
        categoria: regra.idCategoria?.nome || 'Desconhecida',
        idCategoria: regra.idCategoria?._id,
        horasAprovadas: horasCategoria,
        maxHoras: regra.maxHoras,
        percentual: Math.min(100, Math.round((horasCategoria / regra.maxHoras) * 100))
      };
    });

    res.json({
      curso: { nome: curso.nome, cargaHorariaTotal: curso.cargaHorariaTotal },
      totalHorasAprovadas: totalAprovado,
      percentualGeral: Math.min(100, Math.round((totalAprovado / curso.cargaHorariaTotal) * 100)),
      progressoPorCategoria
    });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao calcular progresso', detalhe: error.message });
  }
});

module.exports = router;
