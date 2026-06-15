const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const Usuario = require('../models/Usuario');

/**
 * @swagger
 * /api/alunos:
 *   get:
 *     summary: Lista todos os alunos
 *     tags: [Alunos]
 *     responses:
 *       200:
 *         description: Lista de alunos retornada com sucesso
 */
router.get('/', async (req, res) => {
  try {
    const alunos = await Usuario.find({ perfil: 'aluno' })
      .select('-senha')
      .populate('idCurso', 'nome');
    res.json(alunos);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao listar alunos', detalhe: error.message });
  }
});

/**
 * @swagger
 * /api/alunos/{id}:
 *   get:
 *     summary: Busca um aluno pelo ID
 *     tags: [Alunos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Aluno encontrado
 *       404:
 *         description: Aluno não encontrado
 */
router.get('/:id', async (req, res) => {
  try {
    const aluno = await Usuario.findOne({ _id: req.params.id, perfil: 'aluno' })
      .select('-senha')
      .populate('idCurso', 'nome');
    if (!aluno) {
      return res.status(404).json({ erro: 'Aluno não encontrado' });
    }
    res.json(aluno);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao buscar aluno', detalhe: error.message });
  }
});

/**
 * @swagger
 * /api/alunos:
 *   post:
 *     summary: Cadastra um novo aluno
 *     tags: [Alunos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nome
 *               - email
 *               - senha
 *               - matricula
 *     responses:
 *       201:
 *         description: Aluno criado com sucesso
 *       400:
 *         description: Dados inválidos ou e-mail já cadastrado
 */
router.post('/', async (req, res) => {
  try {
    const { nome, email, senha, matricula, telefone, idCurso } = req.body;

    if (!nome || !email || !senha || !matricula) {
      return res.status(400).json({ erro: 'Nome, e-mail, senha e matrícula são obrigatórios' });
    }

    const emailExistente = await Usuario.findOne({ email: email.toLowerCase() });
    if (emailExistente) {
      return res.status(400).json({ erro: 'E-mail já cadastrado' });
    }

    const matriculaExistente = await Usuario.findOne({ matricula });
    if (matriculaExistente) {
      return res.status(400).json({ erro: 'Matrícula já cadastrada' });
    }

    // FIX: hash da senha antes de salvar
    const senhaHash = await bcrypt.hash(senha, 10);

    const aluno = new Usuario({
      nome,
      email,
      senha: senhaHash,
      matricula,
      telefone: telefone || null,
      idCurso: idCurso || null,
      perfil: 'aluno'
    });

    await aluno.save();
    const resposta = aluno.toObject();
    delete resposta.senha;
    res.status(201).json(resposta);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao cadastrar aluno', detalhe: error.message });
  }
});

/**
 * @swagger
 * /api/alunos/{id}:
 *   put:
 *     summary: Atualiza dados de um aluno
 *     tags: [Alunos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Aluno atualizado com sucesso
 *       404:
 *         description: Aluno não encontrado
 */
router.put('/:id', async (req, res) => {
  try {
    const { nome, email, matricula, telefone, idCurso } = req.body;
    const aluno = await Usuario.findOneAndUpdate(
      { _id: req.params.id, perfil: 'aluno' },
      { nome, email, matricula, telefone, idCurso },
      { new: true, runValidators: true }
    ).select('-senha');
    if (!aluno) {
      return res.status(404).json({ erro: 'Aluno não encontrado' });
    }
    res.json(aluno);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao atualizar aluno', detalhe: error.message });
  }
});

/**
 * @swagger
 * /api/alunos/{id}:
 *   delete:
 *     summary: Remove um aluno
 *     tags: [Alunos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Aluno removido com sucesso
 *       404:
 *         description: Aluno não encontrado
 */
router.delete('/:id', async (req, res) => {
  try {
    const aluno = await Usuario.findOneAndDelete({ _id: req.params.id, perfil: 'aluno' });
    if (!aluno) {
      return res.status(404).json({ erro: 'Aluno não encontrado' });
    }
    res.json({ mensagem: 'Aluno removido com sucesso' });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao remover aluno', detalhe: error.message });
  }
});

module.exports = router;
