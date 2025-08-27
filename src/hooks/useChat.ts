import { useState, useCallback } from 'react';
import { Message } from '../types';
import { aiService } from '../services/aiService';
import { logger } from '../utils/logger';

export const useChat = (onMessageSaved?: (message: Message) => void) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      content: 'Bienvenido a IkbaTech, tu asistente de IA legal para estudiantes de derecho y abogados. ¿En qué puedo ayudarte con tus estudios o práctica jurídica?',
      role: 'assistant',
      timestamp: new Date(),
      type: 'text'
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  const sendMessage = useCallback(async (content: string, type: 'text' | 'document' = 'text', documentName?: string) => {
    console.log('📤 Sending message:', content.substring(0, 50) + '...');
    
    clearError();
    
    // Crear mensaje del usuario
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      role: 'user',
      timestamp: new Date(),
      type,
      documentName
    };

    // Añadir mensaje del usuario
    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    // Guardar mensaje del usuario
    if (onMessageSaved) {
      try {
        onMessageSaved(userMessage);
      } catch (error) {
        console.warn('Failed to save user message:', error);
      }
    }

    try {
      console.log('🤖 Calling AI service...');
      
      // Preparar mensajes para la IA
      const aiMessages = [...messages, userMessage].map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      }));

      console.log('📤 Sending to AI directly:', aiMessages.length, 'messages');

      const response = await aiService.sendMessage(aiMessages);

      console.log('✅ AI response received:', response.content.substring(0, 50) + '...');

      // Crear mensaje del asistente
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.content,
        role: 'assistant',
        timestamp: new Date(),
        type: 'text'
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      if (onMessageSaved) {
        try {
          onMessageSaved(assistantMessage);
        } catch (error) {
          console.warn('Failed to save assistant message:', error);
        }
      }
      
    } catch (error) {
      console.error('❌ Error in sendMessage:', error);
      
      let errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      
      // Manejo de errores más específico
      if (errorMessage.includes('OPENAI_API_KEY') || errorMessage.includes('API key')) {
        errorMessage = '🔑 Error de configuración: Falta configurar la OPENAI_API_KEY en Supabase. Ve a tu Dashboard de Supabase → Settings → Edge Functions → Environment Variables y agrega tu API key de OpenAI.';
      } else if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        errorMessage = '🔐 Error de autenticación: Verifica tu sesión o la configuración de Supabase.';
      } else if (errorMessage.includes('respuesta está vacía') || errorMessage.includes('no es válida')) {
        errorMessage = '⚙️ Error de configuración del servidor: ' + errorMessage;
      } else if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
        errorMessage = '🌐 Error de conexión: Verifica tu conexión a internet y que Supabase esté funcionando.';
      }
      
      setError(errorMessage);
      
      // Crear mensaje de error para mostrar al usuario
      const errorMessageObj: Message = {
        id: (Date.now() + 2).toString(),
        content: `❌ ${errorMessage}\n\nSi el problema persiste, verifica la configuración en el README.md del proyecto.`,
        role: 'assistant',
        timestamp: new Date(),
        type: 'text'
      };
      
      setMessages(prev => [...prev, errorMessageObj]);
    } finally {
      setIsTyping(false);
    }
  }, [messages, onMessageSaved]);

  const generateLegalDraft = useCallback(async (type: 'amparo' | 'denuncia' | 'demanda', details: string) => {
    setIsTyping(true);
    clearError();

    try {
      const response = await aiService.generateLegalDraft(type, details);

      const draftMessage: Message = {
        id: Date.now().toString(),
        content: response.content,
        role: 'assistant',
        timestamp: new Date(),
        type: 'draft'
      };

      setMessages(prev => [...prev, draftMessage]);
      
      if (onMessageSaved) {
        try {
          onMessageSaved(draftMessage);
        } catch (error) {
          console.warn('Failed to save draft message:', error);
        }
      }

    } catch (error) {
      console.error('❌ Error generating draft:', error);
      setError(error instanceof Error ? error.message : 'Error generando borrador');
    } finally {
      setIsTyping(false);
    }
  }, [onMessageSaved]);

  const sendComparativeAnalysis = useCallback(async (entity1: string, entity2: string, type: 'document' | 'scenario', entity1Name?: string, entity2Name?: string) => {
    setIsTyping(true);
    clearError();

    // Crear mensaje del usuario
    const userMessage: Message = {
      id: Date.now().toString(),
      content: `Análisis comparativo de ${type === 'document' ? 'documentos' : 'escenarios'}`,
      role: 'user',
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, userMessage]);

    if (onMessageSaved) {
      try {
        onMessageSaved(userMessage);
      } catch (error) {
        console.warn('Failed to save user message:', error);
      }
    }

    try {

      const response = await aiService.compareLegalEntities(entity1, entity2, type, entity1Name, entity2Name);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.content,
        role: 'assistant',
        timestamp: new Date(),
        type: 'text'
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      if (onMessageSaved) {
        try {
          onMessageSaved(assistantMessage);
        } catch (error) {
          console.warn('Failed to save assistant message:', error);
        }
      }
      
    } catch (error) {
      console.error('❌ Error in comparative analysis:', error);
      setError(error instanceof Error ? error.message : 'Error en análisis comparativo');
    } finally {
      setIsTyping(false);
    }
  }, [onMessageSaved]);

  const clearChat = useCallback(() => {
    console.log('🧹 Clearing chat messages...');
    
    // Limpiar completamente los mensajes
    setMessages([]);
    
    // Después de un pequeño delay, agregar el mensaje de bienvenida
    setTimeout(() => {
      setMessages([
        {
          id: 'welcome',
          content: 'Bienvenido a IkbaTech, tu asistente de IA legal para estudiantes de derecho y abogados. ¿En qué puedo ayudarte con tus estudios o práctica jurídica?',
          role: 'assistant',
          timestamp: new Date(),
          type: 'text'
        }
      ]);
    }, 100);
    
    clearError();
    console.log('✅ Chat cleared successfully');
  }, []);

  return {
    messages,
    isTyping,
    error,
    sendMessage,
    generateLegalDraft,
    sendComparativeAnalysis,
    clearChat,
    clearError
  };
};