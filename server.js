// 1. Importações (Bibliotecas)
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require("@google/generative-ai");

// 2. Configurações Iniciais do Servidor
const app = express();

// 🔥 CONFIGURAÇÃO CORS MELHORADA
app.use(cors({
    origin: "*", // libera qualquer frontend (ideal para teste)
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"]
}));

app.use(express.json());

// 3. Configuração da IA
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.error("❌ ERRO: API KEY não encontrada!");
}

const genAI = new GoogleGenerativeAI(apiKey);

// 4. ROTA DE TESTE (IMPORTANTE PRA DEBUG)
app.get('/', (req, res) => {
    res.send("🚀 API está online!");
});

// 5. ROTA PRINCIPAL
app.post('/api/chat', async (req, res) => {
    try {
        if (!req.body) {
            return res.status(400).json({ erro: "Requisição sem corpo." });
        }

        const { pergunta } = req.body;

        if (!pergunta) {
            return res.status(400).json({ erro: "Envie uma pergunta." });
        }

        console.log(`📩 Pergunta: ${pergunta}`);

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const promptFinal = `Você é um robô sarcástico. Responda: ${pergunta}`;

        const result = await model.generateContent(promptFinal);
        const respostaDaIA = result.response.text();

        return res.status(200).json({
            sucesso: true,
            resposta: respostaDaIA
        });

    } catch (erro) {
        console.error("❌ Erro:", erro);

        return res.status(500).json({
            erro: "Erro interno no servidor"
        });
    }
});

// 6. Ligar o Servidor
const PORTA = process.env.PORT || 3000;

app.listen(PORTA, () => {
    console.log(`🚀 Rodando na porta ${PORTA}`);
});
