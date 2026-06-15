const mongoose = require('mongoose');

const atividadeSchema = new mongoose.Schema({
  titulo: {
    type: String,
    required: [true, 'Título é obrigatório'],
    trim: true
  },
  descricao: {
    type: String,
    default: null
  },
  cargaHoraria: {
    type: Number,
    required: [true, 'Carga horária é obrigatória'],
    min: [1, 'Carga horária deve ser maior que zero']
  },
  dataEnvio: {
    type: Date,
    default: Date.now
  },
  dataRealizacao: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['pendente', 'aprovado', 'rejeitado'],
    default: 'pendente'
  },
  // certificado PDF enviado pelo aluno
  certificado: {
    nomeArquivo: { type: String, default: null },
    base64:      { type: String, default: null },
    tamanho:     { type: Number, default: null }
  },
  idAluno: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: [true, 'Aluno é obrigatório']
  },
  idCurso: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Curso',
    required: [true, 'Curso é obrigatório']
  },
  idCategoria: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Categoria',
    required: [true, 'Categoria é obrigatória']
  },
  avaliacao: {
    cargaHorariaValidada: { type: Number, default: 0 },
    observacao:           { type: String, default: null },
    dataAvaliacao:        { type: Date, default: null },
    idCoordenador: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      default: null
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Atividade', atividadeSchema);
