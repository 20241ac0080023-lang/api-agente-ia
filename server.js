// 1. Importações
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 2. Configuração do servidor
const app = express();
const usuarios = [];

const JWT_SECRET = process.env.JWT_SECRET || 'segredo-temporario-sprint5';

function verificarToken(req, res, next) {
    const autorizacao = req.headers.authorization;

    if (!autorizacao) {
        return res.status(401).json({
            sucesso: false,
            erro: "Token não informado."
        });
    }

    const partes = autorizacao.split(" ");

    if (partes.length !== 2 || partes[0] !== "Bearer") {
        return res.status(401).json({
            sucesso: false,
            erro: "Formato do token inválido."
        });
    }

    const token = partes[1];

    try {
        const usuario = jwt.verify(token, JWT_SECRET);

        req.usuario = usuario;

        next();

    } catch (erro) {
        return res.status(401).json({
            sucesso: false,
            erro: "Token inválido ou expirado."
        });
    }
}

app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
allowedHeaders: ["Content-Type", "Authorization"]
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

// 5. Autenticação

app.post('/api/register', async (req, res) => {
    try {
        const { nome, email, senha } = req.body;

        if (!nome || !email || !senha) {
            return res.status(400).json({
                sucesso: false,
                erro: "Nome, email e senha são obrigatórios."
            });
        }

        const usuarioExistente = usuarios.find(usuario => usuario.email === email);

        if (usuarioExistente) {
            return res.status(409).json({
                sucesso: false,
                erro: "Este email já está cadastrado."
            });
        }

        const senhaHash = await bcrypt.hash(senha, 10);

        const novoUsuario = {
            id: usuarios.length + 1,
            nome,
            email,
            senha: senhaHash
        };

        usuarios.push(novoUsuario);

        return res.status(201).json({
            sucesso: true,
            mensagem: "Usuário cadastrado com sucesso."
        });

    } catch (erro) {
        console.error("Erro no cadastro:", erro);

        return res.status(500).json({
            sucesso: false,
            erro: "Erro ao cadastrar usuário."
        });
    }
});

app.post('/api/login', async (req, res) => {
    
    try {
        const { email, senha } = req.body;

        if (!email || !senha) {
            return res.status(400).json({
                sucesso: false,
                erro: "Email e senha são obrigatórios."
            });
        }

        const usuario = usuarios.find(usuario => usuario.email === email);

        if (!usuario) {
            return res.status(401).json({
                sucesso: false,
                erro: "Email ou senha inválidos."
            });
        }

        const senhaCorreta = await bcrypt.compare(senha, usuario.senha);

        if (!senhaCorreta) {
            return res.status(401).json({
                sucesso: false,
                erro: "Email ou senha inválidos."
            });
        }

        const token = jwt.sign(
            {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email
            },
            JWT_SECRET,
            {
                expiresIn: '2h'
            }
        );

        return res.json({
            sucesso: true,
            mensagem: "Login realizado com sucesso.",
            token
        });

    } catch (erro) {
        console.error("Erro no login:", erro);

        return res.status(500).json({
            sucesso: false,
            erro: "Erro ao realizar login."
        });
    }
});

app.post('/api/logout', verificarToken, (req, res) => {
    return res.json({
        sucesso: true,
        mensagem: "Logout realizado com sucesso."
    });
});

// 5. Health Check
app.get('/api/health', (req, res) => {
    return res.status(200).json({
        status: "ok",
        api: "online",
        timestamp: new Date().toISOString()
    });
});

// 6. Rota principal
app.post('/api/chat', verificarToken, async (req, res) => {
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

// 7. Porta
const PORTA = process.env.PORT || 3000;

app.listen(PORTA, () => {
    console.log(`🚀 Rodando na porta ${PORTA}`);
});