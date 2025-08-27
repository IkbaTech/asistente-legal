import { useState, useCallback } from 'react';
import { AppError, ErrorHandler, ErrorType } from '../utils/errorHandler';
import { logger } from '../utils/logger';

interface UseErrorHandlerReturn {
  error: AppError | null;
  isRetrying: boolean;
  showError: (error: Error | AppError | string, context?: string) => void;
  clearError: () => void;
  retryLastAction: () => void;
  setRetryAction: (action: () => Promise<void> | void) => void;
}

export const useErrorHandler = (): UseErrorHandlerReturn => {
  const [error, setError] = useState<AppError | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryAction, setRetryActionState] = useState<(() => Promise<void> | void) | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const showError = useCallback((error: Error | AppError | string, context?: string) => {
    let appError: AppError;

    if (typeof error === 'string') {
      appError = ErrorHandler.createError(
        ErrorType.UNKNOWN_ERROR,
        error,
        error,
        undefined,
        context
      );
    } else if (error instanceof Error) {
      appError = ErrorHandler.handleError(error, context);
    } else {
      appError = error;
    }

    setError(appError);
    setRetryCount(0);
    
    logger.info('Error shown to user', 'useErrorHandler', {
      type: appError.type,
      message: appError.userMessage,
      context: appError.context
    });
  }, []);

  const clearError = useCallback(() => {
    setError(null);
    setIsRetrying(false);
    setRetryCount(0);
    
    logger.debug('Error cleared', 'useErrorHandler');
  }, []);

  const setRetryAction = useCallback((action: () => Promise<void> | void) => {
    setRetryActionState(() => action);
  }, []);

  const retryLastAction = useCallback(async () => {
    if (!retryAction || !error || !ErrorHandler.shouldRetry(error)) {
      return;
    }

    setIsRetrying(true);
    const currentRetryCount = retryCount + 1;
    setRetryCount(currentRetryCount);

    logger.info('Retrying action', 'useErrorHandler', {
      attempt: currentRetryCount,
      errorType: error.type
    });

    try {
      // Aplicar delay de backoff exponencial
      const delay = ErrorHandler.getRetryDelay(currentRetryCount);
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      await retryAction();
      
      // Si llegamos aquí, el retry fue exitoso
      clearError();
      
      logger.info('Retry successful', 'useErrorHandler', {
        attempt: currentRetryCount,
        errorType: error.type
      });
    } catch (retryError) {
      logger.warn('Retry failed', 'useErrorHandler', {
        attempt: currentRetryCount,
        originalError: error.type,
        retryError: retryError instanceof Error ? retryError.message : 'Unknown error'
      });

      // Si hemos intentado demasiadas veces, mostrar error final
      if (currentRetryCount >= 3) {
        const finalError = ErrorHandler.createError(
          error.type,
          `Error después de ${currentRetryCount} intentos: ${error.message}`,
          'No se pudo completar la operación después de varios intentos. Por favor, intenta más tarde.',
          error.originalError,
          error.context,
          false,
          false
        );
        setError(finalError);
      } else {
        // Actualizar el error con información del retry
        const updatedError = {
          ...error,
          message: `${error.message} (Intento ${currentRetryCount} falló)`,
          userMessage: `${error.userMessage} Reintentando...`
        };
        setError(updatedError);
      }
    } finally {
      setIsRetrying(false);
    }
  }, [error, retryAction, retryCount, clearError]);

  return {
    error,
    isRetrying,
    showError,
    clearError,
    retryLastAction,
    setRetryAction
  };
};