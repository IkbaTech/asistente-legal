const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const OpenAI = require('openai');
const multer = require('multer');
const helmet = require('helmet');

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Verificar API key de OpenAI
if (!process.env.OPENAI_API_KEY) {
  console.error('❌ Error: OPENAI_API_KEY no está configurada en el archivo .env');
  process.exit(1);
}

console.log('✅ OpenAI API key configured');

// Configurar OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Middleware de seguridad
app.use(helmet());

// Configurar CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : [
    'http://localhost:5173',
    'http://localhost:3000',
    // Permitir dominios de StackBlitz/WebContainer
    /^https:\/\/.*\.local-credentialless\.webcontainer-api\.io$/,
    /^https:\/\/.*\.webcontainer\.io$/,
    /^https:\/\/.*\.stackblitz\.io$/
  ],
  credentials: true
}));

// Middleware para parsing JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Configurar multer para archivos
const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido'), false);
    }
  }
});

// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    message: 'IkbaTech Backend API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: 'GET /health',
      chat: 'POST /api/chat',
      analyzeImage: 'POST /api/analyze-image'
    }
  });
});

// Ruta de salud
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Ruta para chat con IA
app.post('/api/chat', async (req, res) => {
  try {
    const { message, context = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Mensaje requerido' });
    }

    console.log('📨 Procesando mensaje:', message.substring(0, 100) + '...');

    // Construir mensajes para OpenAI
    const messages = [
      {
        role: 'system',
        content: `Eres un asistente de IA especializado en derecho guatemalteco y educación jurídica para IkbaTech. 

Tu misión es ayudar tanto a estudiantes de derecho como a abogados profesionales con:

PARA ESTUDIANTES:
- Explicar conceptos jurídicos de manera clara y didáctica
- Ayudar con tareas, ensayos y casos de estudio
- Definir términos técnicos con ejemplos prácticos
- Proporcionar casos relevantes del derecho guatemalteco
- Guiar en metodología de investigación jurídica

PARA ABOGADOS:
- Análisis técnico profundo de documentos legales
- Redacción de documentos profesionales
- Investigación jurisprudencial avanzada
- Análisis comparativo de casos
- Plantillas y formatos legales

CARACTERÍSTICAS:
- Responde en español
- Usa ejemplos del contexto guatemalteco cuando sea posible
- Sé preciso pero accesible según el nivel del usuario
- Incluye referencias a leyes guatemaltecas relevantes
- Mantén un tono profesional pero amigable

Si no tienes información específica sobre algún tema del derecho guatemalteco, indícalo claramente y sugiere fuentes confiables para consultar.`
      },
      ...context.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      {
        role: 'user',
        content: message
      }
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: messages,
      max_tokens: 2000,
      temperature: 0.7,
    });

    const response = completion.choices[0].message.content;
    console.log('✅ Respuesta generada exitosamente');

    res.json({ response });

  } catch (error) {
    console.error('❌ Error en chat:', error);
    
    if (error.code === 'insufficient_quota') {
      return res.status(429).json({ 
        error: 'Límite de API excedido. Por favor, intenta más tarde.' 
      });
    }
    
    if (error.code === 'invalid_api_key') {
      return res.status(401).json({ 
        error: 'API key inválida. Contacta al administrador.' 
      });
    }

    res.status(500).json({ 
      error: 'Error interno del servidor. Por favor, intenta más tarde.' 
    });
  }
});

// Ruta para análisis de imágenes
app.post('/api/analyze-image', upload.single('image'), async (req, res) => {
  try {
    const { prompt = 'Analiza esta imagen desde una perspectiva legal' } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'Imagen requerida' });
    }

    console.log('🖼️ Analizando imagen:', req.file.originalname);

    // Convertir imagen a base64
    const base64Image = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-vision-preview',
      messages: [
        {
          role: 'system',
          content: 'Eres un experto en análisis legal de documentos e imágenes. Analiza la imagen desde una perspectiva jurídica, identificando elementos relevantes para el derecho guatemalteco.'
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`
              }
            }
          ]
        }
      ],
      max_tokens: 1500,
      temperature: 0.5,
    });

    const response = completion.choices[0].message.content;
    console.log('✅ Análisis de imagen completado');

    res.json({ response });

  } catch (error) {
    console.error('❌ Error en análisis de imagen:', error);
    res.status(500).json({ 
      error: 'Error al analizar la imagen. Por favor, intenta más tarde.' 
    });
  }
});

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  console.error('❌ Error no manejado:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// Middleware para rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor backend ejecutándose en http://localhost:${PORT}`);
  console.log(`📋 Rutas disponibles:`);
  console.log(`   GET  /health - Estado del servidor`);
  console.log(`   POST /api/chat - Chat con IA`);
  console.log(`   POST /api/analyze-image - Análisis de imágenes`);
});

module.exports = app;
