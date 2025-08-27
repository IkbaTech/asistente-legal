import { logger } from './logger';

export enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  AI_API_ERROR = 'AI_API_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  FILE_PROCESSING_ERROR = 'FILE_PROCESSING_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface AppError {
  type: ErrorType;
  message: string;
  userMessage: string;
  originalError?: Error;
  context?: string;
  timestamp: Date;
  recoverable: boolean;
  retryable: boolean;
}

export class ErrorHandler {
  static createError(
    type: ErrorType,
    message: string,
    userMessage: string,
    originalError?: Error,
    context?: string,
    recoverable: boolean = true,
    retryable: boolean = false
  ): AppError {
    return {
      type,
      message,
      userMessage,
      originalError,
      context,
      timestamp: new Date(),
      recoverable,
      retryable
    };
  }

  static handleError(error: AppError | Error | unknown, context?: string): AppError {
    let appError: AppError;

    if (error instanceof Error) {
      appError = this.mapErrorToAppError(error, context);
    } else if (this.isAppError(error)) {
      appError = error;
    } else {
      appError = this.createError(
        ErrorType.UNKNOWN_ERROR,
        'Error desconocido',
        'Ha ocurrido un error inesperado. Por favor, intenta nuevamente.',
        undefined,
        context
      );
    }

    // Log del error
    logger.error(appError.message, appError.context, {
      type: appError.type,
      userMessage: appError.userMessage,
      recoverable: appError.recoverable,
      retryable: appError.retryable,
      originalError: appError.originalError?.message,
      stack: appError.originalError?.stack
    });

    return appError;
  }

  private static isAppError(error: any): error is AppError {
    return error && typeof error === 'object' && 'type' in error && 'userMessage' in error;
  }

  private static mapErrorToAppError(error: Error, context?: string): AppError {
    const message = error.message.toLowerCase();

    // Errores de red
    if (message.includes('fetch') || message.includes('network') || message.includes('connection')) {
      return this.createError(
        ErrorType.NETWORK_ERROR,
        `Error de conexión: ${error.message}`,
        'Error de conexión. Verifica tu conexión a internet e intenta nuevamente.',
        error,
        context,
        true,
        true
      );
    }

    // Errores de API de IA
    if (message.includes('api') && (message.includes('openai') || message.includes('anthropic'))) {
      return this.createError(
        ErrorType.AI_API_ERROR,
        `Error de API de IA: ${error.message}`,
        'Error al conectar con el servicio de IA. Verifica tu configuración de API key.',
        error,
        context,
        true,
        true
      );
    }

    // Errores de autenticación
    if (message.includes('unauthorized') || message.includes('authentication') || message.includes('401')) {
      return this.createError(
        ErrorType.AUTHENTICATION_ERROR,
        `Error de autenticación: ${error.message}`,
        'Error de autenticación. Por favor, inicia sesión nuevamente.',
        error,
        context,
        true,
        false
      );
    }

    // Errores específicos de Supabase refresh token
    if (message.includes('refresh token not found') || message.includes('refresh_token_not_found') || message.includes('invalid refresh token')) {
      return this.createError(
        ErrorType.AUTHENTICATION_ERROR,
        `Error de token de sesión: ${error.message}`,
        'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
        error,
        context,
        true,
        false
      );
    }

    // Errores de validación
    if (message.includes('validation') || message.includes('invalid')) {
      return this.createError(
        ErrorType.VALIDATION_ERROR,
        `Error de validación: ${error.message}`,
        'Los datos ingresados no son válidos. Por favor, verifica la información.',
        error,
        context,
        true,
        false
      );
    }

    // Error genérico
    return this.createError(
      ErrorType.UNKNOWN_ERROR,
      `Error: ${error.message}`,
      'Ha ocurrido un error inesperado. Por favor, intenta nuevamente.',
      error,
      context
    );
  }

  static getErrorMessages(): Record<ErrorType, string> {
    return {
      [ErrorType.NETWORK_ERROR]: 'Error de conexión a internet',
      [ErrorType.AI_API_ERROR]: 'Error del servicio de inteligencia artificial',
      [ErrorType.VALIDATION_ERROR]: 'Error en los datos ingresados',
      [ErrorType.AUTHENTICATION_ERROR]: 'Error de autenticación',
      [ErrorType.FILE_PROCESSING_ERROR]: 'Error al procesar el archivo',
      [ErrorType.UNKNOWN_ERROR]: 'Error desconocido'
    };
  }

  static shouldRetry(error: AppError): boolean {
    return error.retryable && [
      ErrorType.NETWORK_ERROR,
      ErrorType.AI_API_ERROR
    ].includes(error.type);
  }

  static getRetryDelay(attemptNumber: number): number {
    // Backoff exponencial: 1s, 2s, 4s, 8s, máximo 30s
    return Math.min(1000 * Math.pow(2, attemptNumber - 1), 30000);
  }
}