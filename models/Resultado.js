const mongoose = require('mongoose');

const resultadoSchema = new mongoose.Schema({
    quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    pontuacao: { type: Number, required: true },
    totalPerguntas: { type: Number, required: true }, // Novo campo adicionado
    data: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Resultado', resultadoSchema);