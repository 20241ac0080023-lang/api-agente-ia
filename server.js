// 1. Importações
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require("@google/generative-ai");

// 2. Configuração do servidor
const app = express();

app.use(cors({
    origin: "*",
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

// 4. Rota de teste
app.get('/', (req, res) => {
    res.send("🚀 API está online!");
});

// 5. Rota principal
app.post('/api/chat', async (req, res) => {
    try {
        const { pergunta } = req.body;

        if (!pergunta) {
            return res.status(400).json({
                sucesso: false,
                erro: "Envie uma pergunta."
            });
        }

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash"
        });

        const promptFinal = `Você é um robô sarcástico. Responda: ${pergunta}`;

        const result = await model.generateContent(promptFinal);

        const respostaDaIA = result.response.text();

        // 🔥 GARANTE QUE SEMPRE EXISTA RESPOSTA
        if (!respostaDaIA) {
            return res.status(500).json({
                sucesso: false,
                erro: "A IA não retornou resposta."
            });
        }

        return res.json({
            sucesso: true,
            resposta: respostaDaIA
        });

    } catch (erro) {
        console.error("❌ ERRO NO SERVIDOR:", erro);

        return res.status(500).json({
            sucesso: false,
            erro: "Erro ao comunicar com a IA."
        });
    }
});

// 6. Porta
const PORTA = process.env.PORT || 3000;

app.listen(PORTA, () => {
    console.log(`🚀 Rodando na porta ${PORTA}`);
});