// Configuración de límites por plan
export interface PlanLimits {
  maxMessages: number;
  canUploadDocuments: boolean;
  canUseLegalTemplates: boolean;
  canUseComparativeAnalysis: boolean;
  canUseImageAnalysis: boolean;
  maxDocumentSize: number; // en MB
  maxDocumentsPerMonth: number;
  hasAdvancedFeatures: boolean;
  supportLevel: 'basic' | 'priority' | 'premium';
}

export const PLAN_LIMITS: Record<string, PlanLimits> = {
  free: {
    maxMessages: 3,
    canUploadDocuments: true,
    canUseLegalTemplates: true,
    canUseComparativeAnalysis: false,
    canUseImageAnalysis: false,
    maxDocumentSize: 2, // 2MB para usuarios gratuitos
    maxDocumentsPerMonth: 3, // 3 documentos por mes
    hasAdvancedFeatures: false,
    supportLevel: 'basic'
  },
  basic: {
    maxMessages: 100,
    canUploadDocuments: true,
    canUseLegalTemplates: true,
    canUseComparativeAnalysis: false,
    canUseImageAnalysis: false,
    maxDocumentSize: 5, // 5MB
    maxDocumentsPerMonth: 10,
    hasAdvancedFeatures: false,
    supportLevel: 'basic'
  },
  professional: {
    maxMessages: 400,
    canUploadDocuments: true,
    canUseLegalTemplates: true,
    canUseComparativeAnalysis: true,
    canUseImageAnalysis: true,
    maxDocumentSize: 10, // 10MB
    maxDocumentsPerMonth: 50,
    hasAdvancedFeatures: true,
    supportLevel: 'priority'
  },
  advanced: {
    maxMessages: -1, // Ilimitado
    canUploadDocuments: true,
    canUseLegalTemplates: true,
    canUseComparativeAnalysis: true,
    canUseImageAnalysis: true,
    maxDocumentSize: 25, // 25MB
    maxDocumentsPerMonth: -1, // Ilimitado
    hasAdvancedFeatures: true,
    supportLevel: 'premium'
  }
};

export const getPlanLimits = (plan: string): PlanLimits => {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.free;
};

export const getPlanName = (plan: string): string => {
  const names: Record<string, string> = {
    free: 'Acceso Gratuito',
    basic: 'Plan Estudiante',
    professional: 'Plan Abogado',
    advanced: 'Plan Bufete'
  };
  return names[plan] || 'Plan Gratuito';
};

export const getPlanFeatures = (plan: string): string[] => {
  const limits = getPlanLimits(plan);
  const features: string[] = [];

  if (limits.maxMessages === -1) {
    features.push('Mensajes ilimitados');
  } else {
    features.push(`Hasta ${limits.maxMessages} mensajes por mes`);
  }

  if (limits.canUploadDocuments) {
    features.push('Análisis de documentos');
    features.push(`Documentos hasta ${limits.maxDocumentSize}MB`);
    if (limits.maxDocumentsPerMonth === -1) {
      features.push('Documentos ilimitados por mes');
    } else {
      features.push(`Hasta ${limits.maxDocumentsPerMonth} documentos por mes`);
    }
  }

  if (limits.canUseLegalTemplates) {
    features.push('Ayuda con redacción legal');
  }

  if (limits.canUseComparativeAnalysis) {
    features.push('Análisis comparativo');
  }

  if (limits.canUseImageAnalysis) {
    features.push('Análisis de imágenes');
  }

  if (limits.hasAdvancedFeatures) {
    features.push('IA especializada y funciones avanzadas');
  }

  const supportLevels = {
    basic: 'Soporte estudiantil por email',
    priority: 'Soporte profesional prioritario',
    premium: 'Soporte premium 24/7 para bufetes'
  };
  features.push(supportLevels[limits.supportLevel]);

  return features;
};