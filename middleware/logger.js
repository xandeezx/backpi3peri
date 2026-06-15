const Log = require('../models/Log');

// Função helper que pode ser chamada dentro das rotas
async function registrarLog({ acao, descricao, idUsuario = null, idReferencia = null, tipoReferencia = null, ip = null, sucesso = true, erro = null }) {
  try {
    await Log.create({ acao, descricao, idUsuario, idReferencia, tipoReferencia, ip, sucesso, erro });
  } catch (err) {
    // Log não pode quebrar a requisição principal
    console.error('[LOG] Erro ao registrar log:', err.message);
  }
}

module.exports = { registrarLog };
