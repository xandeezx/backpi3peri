const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const Usuario = require('../models/Usuario');

/**
 * @swagger
 * /api/coordenadores:
 *   get:
 *     summary: Lista todos os coordenadores
 *     tags: [Coordenadores]
 *     responses:
 *       200:
 *         description: Lista de coordenadores retornada com sucesso
 */
router.get('/', async (req, res) => {
  try {
    const coordenadores = await Usuario.find({ perfil: 'coordenador' }).select('-senha');
    res.json(coordenadores);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao listar coordenadores', detalhe: error.message });
  }
});

/**
 * @swagger
 * /api/coordenadores/{id}:
 *   get:
 *     summary: Busca um coordenador pelo ID
 *     tags: [Coordenadores]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Coordenador encontrado
 *       404:
 *         description: Coordenador não encontrado
 */
router.get('/:id', async (req, res) => {
  try {
    const coordenador = await Usuario.findOne({ _id: req.params.id, perfil: 'coordenador' }).select('-senha');

    if (!coordenador) {
      return res.status(404).json({ erro: 'Coordenador não encontrado' });
    }

    res.json(coordenador);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao buscar coordenador', detalhe: error.message });
  }
});

/**
 * @swagger
 * /api/coordenadores:
 *   post:
 *     summary: Cadastra um novo coordenador
 *     tags: [Coordenadores]
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
 *             properties:
 *               nome:
 *                 type: string
 *                 example: Maria Oliveira
 *               email:
 *                 type: string
 *                 example: maria@email.com
 *               senha:
 *                 type: string
 *                 example: "senha123"
 *               telefone:
 *                 type: string
 *                 example: "(81) 98888-1111"
 *     responses:
 *       201:
 *         description: Coordenador criado com sucesso
 *       400:
 *         description: Dados inválidos ou e-mail já cadastrado
 */
router.post('/', async (req, res) => {
  try {
    const { nome, email, senha, telefone } = req.body;

    if (!nome || !email || !senha) {
      return res.status(400).json({ erro: 'Nome, e-mail e senha são obrigatórios' });
    }

    const emailExistente = await Usuario.findOne({ email: email.toLowerCase() });
    if (emailExistente) {
      return res.status(400).json({ erro: 'E-mail já cadastrado' });
    }

    // FIX: hash da senha antes de salvar
    const senhaHash = await bcrypt.hash(senha, 10);

    const coordenador = new Usuario({
      nome,
      email,
      senha: senhaHash,
      telefone: telefone || null,
      perfil: 'coordenador'
    });

    await coordenador.save();

    const resposta = coordenador.toObject();
    delete resposta.senha;

    res.status(201).json(resposta);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao cadastrar coordenador', detalhe: error.message });
  }
});

/**
 * @swagger
 * /api/coordenadores/{id}:
 *   delete:
 *     summary: Remove um coordenador
 *     tags: [Coordenadores]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Coordenador removido com sucesso
 *       404:
 *         description: Coordenador não encontrado
 */
router.delete('/:id', async (req, res) => {
  try {
    const coordenador = await Usuario.findOneAndDelete({ _id: req.params.id, perfil: 'coordenador' });

    if (!coordenador) {
      return res.status(404).json({ erro: 'Coordenador não encontrado' });
    }

    res.json({ mensagem: 'Coordenador removido com sucesso' });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao remover coordenador', detalhe: error.message });
  }
});

module.exports = router;