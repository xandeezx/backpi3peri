const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  acao: {
    type: String,
    required: true
    // Ex: 'login', 'solicitacao_criada', 'solicitacao_aprovada', 'solicitacao_rejeitada',
    //     'aluno_criado', 'curso_criado', 'email_enviado'
  },
  descricao: {
    type: String,
    required: true
  },
  idUsuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    default: null
  },
  idReferencia: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  tipoReferencia: {
    type: String,
    default: null
    // Ex: 'Atividade', 'Usuario', 'Curso'
  },
  ip: {
    type: String,
    default: null
  },
  sucesso: {
    type: Boolean,
    default: true
  },
  erro: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Log', logSchema);
