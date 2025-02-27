const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
    titulo: { type: String, required: true },
    perguntas: [{
        pergunta: { type: String, required: true },
        opcoes: [{ type: String }],
        respostaCorreta: { type: String, required: true },
    }],
    criadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

module.exports = mongoose.model('Quiz', quizSchema);