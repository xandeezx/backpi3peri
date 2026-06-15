const mongoose = require('mongoose');

const categoriaSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: [true, 'Nome da categoria é obrigatório'],
    trim: true
  },
  descricao: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Categoria', categoriaSchema);
