export const LEGAL_TEMPLATES = [
  {
    id: 'amparo',
    name: 'Amparo Constitucional',
    type: 'amparo' as const,
    description: 'Redacción profesional de amparo constitucional con fundamentos jurisprudenciales'
  },
  {
    id: 'denuncia',
    name: 'Denuncia Penal',
    type: 'denuncia' as const,
    description: 'Denuncia penal técnica conforme al CPP guatemalteco'
  },
  {
    id: 'demanda',
    name: 'Demanda Civil',
    type: 'demanda' as const,
    description: 'Demanda civil profesional según CPCYM guatemalteco'
  }
];

export const SAMPLE_LEGAL_RESPONSES = [
  "Análisis jurisprudencial: La Corte de Constitucionalidad ha establecido en expediente 1234-2023...",
  "Precedente procesal: Según criterio de la CSJ, Sala Penal, en materia de nulidades procesales...",
  "Fundamento constitucional: El artículo 12 de la CPRG establece criterios específicos para...",
  "Doctrina legal aplicable: En materia contractual, el CC guatemalteco en su artículo 1517..."
] as const;

// Configuración de rendimiento
export const PERFORMANCE_CONFIG = {
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutos
  DEBOUNCE_DELAY: 300, // 300ms
  THROTTLE_LIMIT: 1000, // 1 segundo
  MAX_MESSAGE_HISTORY: 50,
  CHUNK_SIZE: 1000,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  SUPPORTED_DOCUMENT_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ],
  SUPPORTED_DOCUMENT_EXTENSIONS: ['.pdf', '.doc', '.docx', '.txt'],
  MAX_DOCUMENT_PREVIEW_LENGTH: 1000
} as const;

// Mensajes de error comunes
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Error de conexión. Verifica tu conexión a internet.',
  AI_ERROR: 'Error del servicio de IA. Intenta nuevamente.',
  AUTH_ERROR: 'Error de autenticación. Inicia sesión nuevamente.',
  FILE_TOO_LARGE: 'El archivo es demasiado grande. Máximo 10MB.',
  UNSUPPORTED_FILE: 'Tipo de archivo no soportado.',
  PROCESSING_ERROR: 'Error al procesar el archivo.',
  PLAN_LIMIT_REACHED: 'Has alcanzado el límite de tu plan actual.'
} as const;

export const QUICK_ACTIONS = [
  {
    id: 'amparo',
    title: 'Amparo Constitucional',
    description: 'Redactar amparo con fundamentos jurisprudenciales',
    icon: 'Shield',
    category: 'constitutional'
  },
  {
    id: 'denuncia',
    title: 'Denuncia Penal',
    description: 'Crear denuncia técnica conforme al CPP',
    icon: 'AlertTriangle',
    category: 'penal'
  },
  {
    id: 'demanda',
    title: 'Demanda Civil',
    description: 'Elaborar demanda según CPCYM guatemalteco',
    icon: 'FileText',
    category: 'civil'
  },
  {
    id: 'contrato',
    title: 'Análisis de Contrato',
    description: 'Revisar cláusulas y términos contractuales',
    icon: 'FileCheck',
    category: 'contractual'
  }
] as const;