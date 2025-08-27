// Servicio de IA que usa el backend Node.js local
import { logger } from '../utils/logger';

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

class AIService {
  private getBackendUrl(): string {
    // En producción, usar la URL de Render
    if (import.meta.env.PROD) {
      return 'https://tu-backend-render.onrender.com';
    }
    
    // En desarrollo local
    return 'http://localhost:3001';
  }

  isAIConfigured(): boolean {
    // Siempre true porque el backend maneja la configuración
    return true;
  }

  async sendMessage(messages: AIMessage[], type: 'chat' | 'document' | 'draft' | 'comparative' = 'chat', options?: {
    documentName?: string;
    draftType?: string;
    entity1?: string;
    entity2?: string;
    entity1Name?: string;
    entity2Name?: string;
    analysisType?: 'document' | 'scenario';
  }): Promise<AIResponse> {
    console.log('🚀 AIService: Enviando mensaje al backend Node.js...');
    logger.info('Starting AI request via backend Node.js', 'AIService', { 
      messageCount: messages.length,
      type 
    });
    
    try {
      const backendUrl = this.getBackendUrl();
      const endpoint = `${backendUrl}/api/chat`;
      
      console.log('📡 AIService: Llamando al backend en:', endpoint);
      
      const requestBody: any = {
        message: messages[messages.length - 1]?.content || '',
        context: messages.slice(0, -1),
        type
      };

      // Agregar opciones específicas según el tipo
      if (options) {
        if (options.documentName) requestBody.documentName = options.documentName;
        if (options.draftType) requestBody.draftType = options.draftType;
        if (options.entity1) requestBody.entity1 = options.entity1;
        if (options.entity2) requestBody.entity2 = options.entity2;
        if (options.entity1Name) requestBody.entity1Name = options.entity1Name;
        if (options.entity2Name) requestBody.entity2Name = options.entity2Name;
        if (options.analysisType) requestBody.analysisType = options.analysisType;
      }
      
      console.log('⏰ AIService: Iniciando petición al backend...');
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      console.log('📡 AIService: Estado de respuesta del backend:', response.status, response.statusText);
      
      if (!response.ok) {
        const responseText = await response.text();
        console.error('❌ AIService: Respuesta de error del backend:', responseText);
        
        if (response.status === 404) {
          throw new Error('🚨 Backend no encontrado. Verifica que el servidor Node.js esté ejecutándose en puerto 3001.');
        }
        
        if (response.status === 500) {
          throw new Error('🔧 Error del servidor backend. Verifica que:\n1. La OPENAI_API_KEY esté configurada en backend/.env\n2. El servidor Node.js esté funcionando correctamente');
        }
        
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch {
          throw new Error(`HTTP ${response.status}: ${responseText || response.statusText}`);
        }
        
        throw new Error(errorData.error || errorData.details || `Error HTTP ${response.status}`);
      }

      const responseText = await response.text();
      console.log('📡 AIService: Longitud de respuesta del backend:', responseText.length);
      
      if (!responseText.trim()) {
        throw new Error('Respuesta vacía del backend. Verifica la configuración de OPENAI_API_KEY en backend/.env.');
      }
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ AIService: Error de JSON:', parseError);
        console.error('❌ AIService: Texto de respuesta:', responseText);
        throw new Error('Respuesta inválida del backend Node.js.');
      }
      
      const content = data.response || 'No pude generar una respuesta.';

      console.log('✅ AIService: Respuesta recibida exitosamente del backend');

      return {
        content,
        usage: data.usage || {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0
        }
      };
    } catch (error) {
      console.error('❌ AIService: Error en sendMessage:', error);
      
      if (error.name === 'AbortError') {
        throw new Error('⏰ La solicitud tardó demasiado tiempo. Intenta nuevamente.');
      }
      
      if (error.message?.includes('Failed to fetch')) {
        throw new Error('🌐 Error de conexión con el backend. Verifica que el servidor Node.js esté ejecutándose.');
      }
      
      logger.error('AI service error', 'AIService', error);
      throw error;
    }
  }

  async analyzeDocument(documentContent: string, fileName: string): Promise<AIResponse> {
    console.log('📄 AIService: Analizando documento...');
    
    const messages = [
      { 
        role: 'system' as const, 
        content: 'Eres IkbaTech, asistente de IA legal para estudiantes de derecho y abogados profesionales. Analiza documentos legales de manera técnica y educativa.' 
      },
      { 
        role: 'user' as const, 
        content: `Analiza este documento: "${fileName}"\n\nContenido:\n${documentContent}` 
      }
    ];
    
    return this.sendMessage(messages, 'document', { documentName: fileName });
  }

  async generateLegalDraft(type: 'amparo' | 'denuncia' | 'demanda', details: string): Promise<AIResponse> {
    console.log('📝 AIService: Generando borrador legal...');
    
    const messages = [
      { 
        role: 'system' as const, 
        content: 'Eres IkbaTech, asistente de IA legal especializado en redacción de documentos jurídicos para abogados profesionales.' 
      },
      { 
        role: 'user' as const, 
        content: `Genera un borrador técnico de ${type.toUpperCase()} para revisión y desarrollo del colega abogado. Detalles: ${details}` 
      }
    ];
    
    return this.sendMessage(messages, 'draft', { draftType: type });
  }

  async compareLegalEntities(entity1: string, entity2: string, type: 'document' | 'scenario', entity1Name?: string, entity2Name?: string): Promise<AIResponse> {
    console.log('🔍 AIService: Realizando análisis comparativo...');
    
    const messages = [
      { 
        role: 'system' as const, 
        content: 'Eres IkbaTech, asistente de IA legal especializado en análisis comparativo de documentos y escenarios jurídicos para abogados profesionales.' 
      },
      { 
        role: 'user' as const, 
        content: `Realiza un análisis comparativo detallado.` 
      }
    ];
    
    return this.sendMessage(messages, 'comparative', {
      entity1,
      entity2,
      entity1Name,
      entity2Name,
      analysisType: type
    });
  }

  async analyzeImage(base64Image: string, fileName: string): Promise<AIResponse> {
    console.log('🖼️ AIService: Analizando imagen...');
    
    try {
      const backendUrl = this.getBackendUrl();
      const endpoint = `${backendUrl}/api/analyze-image`;
      
      console.log('📡 AIService: Llamando al backend para análisis de imagen:', endpoint);
      
      // Crear FormData para enviar la imagen
      const formData = new FormData();
      
      // Convertir base64 a blob
      const base64Data = base64Image.split(',')[1] || base64Image;
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/jpeg' });
      
      formData.append('image', blob, fileName);
      formData.append('prompt', `Analiza esta imagen desde una perspectiva legal: "${fileName}"`);

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const responseText = await response.text();
        console.error('❌ AIService: Error en análisis de imagen:', responseText);
        throw new Error(`Error analizando imagen: ${responseText}`);
      }

      const data = await response.json();
      
      return {
        content: data.response || 'No pude analizar la imagen.',
        usage: data.usage || {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0
        }
      };
    } catch (error) {
      console.error('❌ AIService: Error en analyzeImage:', error);
      logger.error('Image analysis error', 'AIService', error);
      throw error;
    }
  }
}

export const aiService = new AIService();

export const isAIReady = (): boolean => {
  return aiService.isAIConfigured();
};