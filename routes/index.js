const express = require('express');
const User = require('../models/User');
const Quiz = require('../models/Quiz');
const Resultado = require('../models/Resultado');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Middleware de autenticação (opcional, se precisar proteger rotas)
const authMiddleware = (req, res, next) => {
    let token = req.headers['authorization'];
    console.log('Cabeçalho Authorization recebido:', token);

    if (!token) {
        console.log('Token não fornecido.');
        return res.status(401).send('Acesso negado.');
    }

    // Remove o prefixo "Bearer " se existir
    if (token.startsWith('Bearer ')) {
        token = token.slice(7);
    }
    console.log('Token limpo:', token);

    try {
        const decoded = jwt.verify(token, 'seuSegredoJWT');
        console.log('Token decodificado:', decoded);
        req.userId = decoded.userId;
        next();
    } catch (error) {
        console.error('Erro ao verificar token:', error.message);
        res.status(400).send('Token inválido.');
    }
};

// Rota da página inicial
router.get('/', (req, res) => {
    res.render('index');
});

// Rota para a página de criação de quiz
router.get('/criar-quiz', (req, res) => {
    res.render('criar-quiz');
});

// Rota para salvar o quiz
router.post('/saveQuiz', async (req, res) => {
    try {
        const { titulo, perguntas } = req.body;
        const token = req.headers['authorization'];
        if (!token) {
            return res.status(401).json({ error: 'Acesso negado. Token não fornecido.' });
        }

        const decoded = jwt.verify(token, 'seuSegredoJWT');
        const userId = decoded.userId;

        const quiz = new Quiz({ titulo, perguntas, criadoPor: userId });
        await quiz.save();

        res.status(201).json({ message: 'Quiz salvo com sucesso!', quizId: quiz._id });
    } catch (error) {
        console.error('Erro ao salvar o quiz:', error);
        res.status(500).json({ error: 'Erro ao salvar o quiz.' });
    }
});

router.get('/responder-quiz', (req, res) => {
    res.render('responder-quiz');
});

// Rota para exibir a página "Meus Quizzes"
// Rota para renderizar a página básica
router.get('/meus-quizzes', (req, res) => {
    res.render('meus-quizzes', { quizzes: [] });
});

// Nova rota para buscar os dados dos quizzes
router.get('/meus-quizzes-data', authMiddleware, async (req, res) => {
    try {
        const quizzes = await Quiz.find({ criadoPor: req.userId });
        res.json(quizzes);
    } catch (error) {
        console.error('Erro ao buscar quizzes:', error);
        res.status(500).json({ error: 'Erro ao buscar quizzes.' });
    }
});

// Rota para exibir a página "Meus Resultados"
router.get('/meus-resultados', (req, res) => {
    // Renderiza o template sem buscar resultados diretamente
    res.render('meus-resultados', { resultados: [] });
});

// Rota de cadastro
router.post('/cadastro', async (req, res) => {
    try {
        const { nome, email, password } = req.body;

        // Verifica se todos os campos foram enviados
        if (!nome || !email || !password) {
            return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
        }

        // Verifica se o e-mail já está cadastrado
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ error: 'E-mail já cadastrado.' });
        }

        // Cria o usuário
        const user = new User({ nome, email, password });
        await user.save();

        res.status(201).json({ message: 'Usuário registrado com sucesso!' });
    } catch (error) {
        console.error('Erro ao registrar usuário:', error);
        res.status(500).json({ error: 'Erro ao registrar usuário.' });
    }
});

// Rota de login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ error: 'Credenciais inválidas.' });
        }
        const token = jwt.sign({ userId: user._id }, 'seuSegredoJWT', { expiresIn: '1h' });
        res.json({ token, userName: user.nome });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao fazer login.' });
    }
});

// Rota para a página de login (renderização)
router.get('/login', (req, res) => {
    res.render('login');
});

// Rota para a página de cadastro (renderização)
router.get('/cadastro', (req, res) => {
    res.render('cadastro');
});

// Rota para exibir a página "Quiz Salvo"
router.get('/quiz-salvo', (req, res) => {
    res.render('quiz-salvo');
});

// Rota para buscar os dados dos resultados
router.get('/meus-resultados-data', authMiddleware, async (req, res) => {
    try {
        const resultados = await Resultado.find({ usuario: req.userId }).populate('quiz');
        res.json(resultados);
    } catch (error) {
        console.error('Erro ao buscar resultados:', error);
        res.status(500).json({ error: 'Erro ao buscar resultados.' });
    }
});


// Rota para carregar um quiz específico
router.get('/quiz/:id', authMiddleware, async (req, res) => {
    try {
        const quiz = await Quiz.findOne({ _id: req.params.id, criadoPor: req.userId });
        if (!quiz) return res.status(404).json({ error: 'Quiz não encontrado.' });
        res.json(quiz);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao carregar o quiz.' });
    }
});

// Rota para enviar respostas e calcular pontuação
router.post('/submit-quiz/:id', authMiddleware, async (req, res) => {
    try {
        const quiz = await Quiz.findOne({ _id: req.params.id, criadoPor: req.userId });
        if (!quiz) return res.status(404).json({ error: 'Quiz não encontrado.' });

        const { respostas } = req.body;
        let pontuacao = 0;
        quiz.perguntas.forEach((pergunta, index) => {
            if (pergunta.respostaCorreta === respostas[index]) {
                pontuacao += 1;
            }
        });

        const totalPerguntas = quiz.perguntas.length; // Total de perguntas

        const resultado = new Resultado({
            quiz: quiz._id,
            usuario: req.userId,
            pontuacao,
            totalPerguntas // Certifique-se de que está aqui
        });
        await resultado.save();

        res.json({ pontuacao, total: totalPerguntas }); // Enviando totalPerguntas no JSON
    } catch (error) {
        res.status(500).json({ error: 'Erro ao processar respostas.' });
    }
});

router.delete('/delete-quiz/:id', authMiddleware, async (req, res) => {
    try {
        const quiz = await Quiz.findOne({ _id: req.params.id, criadoPor: req.userId });
        if (!quiz) {
            return res.status(404).json({ error: 'Quiz não encontrado ou não pertence ao usuário.' });
        }

        await Quiz.deleteOne({ _id: req.params.id });
        await Resultado.deleteMany({ quiz: req.params.id }); // Remove resultados associados
        res.status(200).json({ message: 'Quiz excluído com sucesso!' });
    } catch (error) {
        console.error('Erro ao excluir quiz:', error);
        res.status(500).json({ error: 'Erro ao excluir quiz.' });
    }
});
module.exports = router;