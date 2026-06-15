const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const Usuario = require('../models/Usuario');

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Realiza login no sistema
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - senha
 *             properties:
 *               email:
 *                 type: string
 *                 example: joao@email.com
 *               senha:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Login realizado com sucesso
 *       401:
 *         description: E-mail ou senha incorretos
 */
router.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ erro: 'E-mail e senha são obrigatórios' });
    }

    // FIX: busca apenas por email, depois compara hash
    const usuario = await Usuario.findOne({ email: email.toLowerCase() });

    if (!usuario || !(await bcrypt.compare(senha, usuario.senha))) {
      return res.status(401).json({ erro: 'E-mail ou senha incorretos' });
    }

    res.json({
      id: usuario._id,
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil
    });
  } catch (error) {
    res.status(500).json({ erro: 'Erro interno no servidor', detalhe: error.message });
  }
});

module.exports = router;
