import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { getPlanLimits, PlanLimits } from '../utils/planLimits';
import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';

export const usePlanLimits = () => {
  const { user, profile, isAuthenticated } = useAuth();
  const [currentLimits, setCurrentLimits] = useState<PlanLimits>(getPlanLimits('free'));
  const [usage, setUsage] = useState({
    messagesThisMonth: 0,
    documentsThisMonth: 0,
    lastReset: new Date()
  });
  const [loading, setLoading] = useState(false);

  // Actualizar límites cuando cambie el perfil
  useEffect(() => {
    const plan = profile?.plan || 'free';
    setCurrentLimits(getPlanLimits(plan));
  }, [profile]);

  // Cargar uso actual del usuario
  const loadUsage = async () => {
    if (!isAuthenticated || !user) return;

    setLoading(true);
    try {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      // Contar mensajes del usuario este mes
      const { count: messageCount, error: messageError } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'user')
        .gte('created_at', oneMonthAgo.toISOString())
        .in('chat_id', 
          supabase
            .from('chats')
            .select('id')
            .eq('user_id', user.id)
        );

      if (messageError) {
        logger.error('Error counting messages', 'usePlanLimits', messageError);
      }

      // Contar documentos subidos este mes (si existe la tabla)
      let documentCount = 0;
      try {
        const { count: docCount, error: docError } = await supabase
          .from('legal_documents')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', oneMonthAgo.toISOString());

        if (!docError) {
          documentCount = docCount || 0;
        }
      } catch (error) {
        // Tabla no existe aún, ignorar
        logger.debug('Legal documents table not found', 'usePlanLimits');
      }

      setUsage({
        messagesThisMonth: messageCount || 0,
        documentsThisMonth: documentCount,
        lastReset: oneMonthAgo
      });

      logger.info('Usage loaded', 'usePlanLimits', {
        messages: messageCount,
        documents: documentCount
      });
    } catch (error) {
      logger.error('Error loading usage', 'usePlanLimits', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsage();
  }, [isAuthenticated, user]);

  // Verificar si una función está disponible
  const canUseFeature = (feature: keyof PlanLimits): boolean => {
    if (!isAuthenticated) {
      // Usuarios no autenticados solo pueden usar funciones básicas
      return feature === 'maxMessages' && usage.messagesThisMonth < 3;
    }

    const limit = currentLimits[feature];
    
    if (typeof limit === 'boolean') {
      return limit;
    }
    
    if (typeof limit === 'number') {
      if (limit === -1) return true; // Ilimitado
      
      if (feature === 'maxMessages') {
        return usage.messagesThisMonth < limit;
      }
      
      if (feature === 'maxDocumentsPerMonth') {
        return usage.documentsThisMonth < limit;
      }
      
      return true;
    }
    
    return false;
  };

  // Verificar límite de mensajes
  const canSendMessage = (): boolean => {
    if (!isAuthenticated) {
      return usage.messagesThisMonth < 3;
    }
    
    if (currentLimits.maxMessages === -1) return true;
    return usage.messagesThisMonth < currentLimits.maxMessages;
  };

  // Verificar límite de documentos
  const canUploadDocument = (): boolean => {
    if (!currentLimits.canUploadDocuments) return false;
    if (currentLimits.maxDocumentsPerMonth === -1) return true;
    return usage.documentsThisMonth < currentLimits.maxDocumentsPerMonth;
  };

  // Obtener mensaje de límite alcanzado
  const getLimitMessage = (feature: string): string => {
    const plan = profile?.plan || 'free';
    const planName = plan === 'free' ? 'gratuito' : plan;
    
    const messages: Record<string, string> = {
      messages: `Has alcanzado el límite de mensajes de tu plan ${planName}. Actualiza tu plan para continuar.`,
      documents: `Has alcanzado el límite de documentos de tu plan ${planName}. Actualiza tu plan para subir más documentos.`,
      templates: `Las plantillas legales no están disponibles en tu plan ${planName}. Actualiza tu plan para acceder.`,
      comparative: `El análisis comparativo no está disponible en tu plan ${planName}. Actualiza tu plan para acceder.`,
      images: `El análisis de imágenes no está disponible en tu plan ${planName}. Actualiza tu plan para acceder.`
    };
    
    return messages[feature] || `Esta función no está disponible en tu plan ${planName}.`;
  };

  // Obtener porcentaje de uso
  const getUsagePercentage = (feature: 'messages' | 'documents'): number => {
    if (feature === 'messages') {
      if (currentLimits.maxMessages === -1) return 0;
      return Math.min((usage.messagesThisMonth / currentLimits.maxMessages) * 100, 100);
    }
    
    if (feature === 'documents') {
      if (currentLimits.maxDocumentsPerMonth === -1) return 0;
      return Math.min((usage.documentsThisMonth / currentLimits.maxDocumentsPerMonth) * 100, 100);
    }
    
    return 0;
  };

  return {
    currentLimits,
    usage,
    loading,
    canUseFeature,
    canSendMessage,
    canUploadDocument,
    getLimitMessage,
    getUsagePercentage,
    refreshUsage: loadUsage
  };
};