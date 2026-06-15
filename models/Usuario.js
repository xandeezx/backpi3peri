const mongoose = require('mongoose');

const usuarioSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: [true, 'Nome é obrigatório'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'E-mail é obrigatório'],
    unique: true,
    lowercase: true,
    trim: true
  },
  senha: {
    type: String,
    required: [true, 'Senha é obrigatória']
  },
  telefone: {
    type: String,
    default: null
  },
  // perfil: 'aluno', 'coordenador', 'admin'
  perfil: {
    type: String,
    enum: ['aluno', 'coordenador', 'admin'],
    required: [true, 'Perfil é obrigatório']
  },
  // Campos exclusivos de aluno
  matricula: {
    type: String,
    default: null
  },
  dataIngresso: {
    type: Date,
    default: null
  },
  // Aluno pode estar matriculado em um curso
  idCurso: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Curso',
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Usuario', usuarioSchema);
