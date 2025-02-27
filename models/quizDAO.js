const Quiz = require('./Quiz');
const Resultado = require('./Resultado');

class quizDAO {
    // READ: Obter todos os quizzes de um usuário
    static async getQuizzesByUser(userId) {
        try {
            const quizzes = await Quiz.find({ criadoPor: userId });
            return quizzes;
        } catch (err) {
            console.error('Erro ao buscar quizzes:', err);
            throw err;
        }
    }

    // CREATE: Inserir um novo quiz
    static async insertQuiz(titulo, perguntas, criadoPor) {
        try {
            const quiz = new Quiz({ titulo, perguntas, criadoPor });
            await quiz.save();
            return quiz;
        } catch (err) {
            console.error('Erro ao inserir quiz:', err);
            throw err;
        }
    }

    // READ: Obter um quiz por ID
    static async getQuizById(id, userId) {
        try {
            const quiz = await Quiz.findOne({ _id: id, criadoPor: userId });
            return quiz;
        } catch (err) {
            console.error('Erro ao buscar quiz por ID:', err);
            throw err;
        }
    }

    // CREATE: Inserir um resultado
    static async insertResultado(quizId, usuarioId, pontuacao, totalPerguntas) {
        try {
            const resultado = new Resultado({
                quiz: quizId,
                usuario: usuarioId,
                pontuacao,
                totalPerguntas
            });
            await resultado.save();
            return resultado;
        } catch (err) {
            console.error('Erro ao inserir resultado:', err);
            throw err;
        }
    }

    // READ: Obter resultados de um usuário
    static async getResultadosByUser(userId) {
        try {
            const resultados = await Resultado.find({ usuario: userId }).populate('quiz');
            return resultados;
        } catch (err) {
            console.error('Erro ao buscar resultados:', err);
            throw err;
        }
    }

    // DELETE: Excluir um quiz por ID
    static async deleteQuizById(id, userId) {
        try {
            const result = await Quiz.deleteOne({ _id: id, criadoPor: userId });
            if (result.deletedCount === 0) {
                throw new Error('Quiz não encontrado ou não pertence ao usuário.');
            }
            await Resultado.deleteMany({ quiz: id }); // Remove resultados associados
            return result;
        } catch (err) {
            console.error('Erro ao excluir quiz:', err);
            throw err;
        }
    }
}

module.exports = quizDAO;