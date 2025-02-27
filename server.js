const express = require('express');
const path = require('path');
const mongoose = require('mongoose');

const app = express();

// Configurações do Express
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // Para receber JSON no corpo das requisições
app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Conexão com o MongoDB
mongoose.connect('mongodb+srv://isadorabraide:flordeliz@cluster0.fu2zu.mongodb.net/guia-vestibular?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('Conectado ao MongoDB!');
}).catch((err) => {
    console.error('Erro ao conectar ao MongoDB:', err);
});

// Importando as rotas centralizadas
const routes = require('./routes/index');
app.use('/', routes);

// Definir a porta e encerrar processos anteriores
const PORT = process.env.PORT || 3000;

// Tenta rodar na porta, mas fecha qualquer processo que esteja rodando antes
const server = app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.log(`A porta ${PORT} já está em uso. Tentando encerrar o processo...`);
        const exec = require('child_process').exec;
        exec(`npx kill-port ${PORT}`, () => {
            console.log('Processo encerrado. Reiniciando o servidor...');
            server.close(() => {
                process.exit(1);
            });
        });
    } else {
        console.error(err);
    }
});