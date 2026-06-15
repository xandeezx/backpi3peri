const mongoose = require('mongoose');

// Cada entrada define o limite de horas que uma CATEGORIA pode contribuir neste curso
const regraCategoriasSchema = new mongoose.Schema({
  idCategoria: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Categoria',
    required: true
  },
  maxHoras: {
    type: Number,
    required: true,
    min: [1, 'Máximo de horas deve ser maior que zero']
  }
}, { _id: false });

const cursoSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: [true, 'Nome do curso é obrigatório'],
    trim: true
  },
  // Total de horas complementares que o aluno precisa integralizar
  cargaHorariaTotal: {
    type: Number,
    required: [true, 'Carga horária total é obrigatória'],
    min: [1, 'Carga horária deve ser maior que zero']
  },
  // Limites por categoria: quantas horas de cada tipo podem ser aproveitadas
  regrasCategoria: {
    type: [regraCategoriasSchema],
    default: []
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Curso', cursoSchema);
