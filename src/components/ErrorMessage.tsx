import React from 'react';
import { AlertTriangle, RefreshCw, X, Info } from 'lucide-react';
import { AppError, ErrorType, ErrorHandler } from '../utils/errorHandler';

interface ErrorMessageProps {
  error: AppError | string;
  onDismiss?: () => void;
  isDarkMode?: boolean;
  className?: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({
  error,
  onDismiss,
  isDarkMode = false,
  className = ''
}) => {
  const appError = typeof error === 'string' 
    ? ErrorHandler.createError(ErrorType.UNKNOWN_ERROR, error, error)
    : error;

  const getErrorIcon = () => {
    switch (appError.type) {
      case ErrorType.NETWORK_ERROR:
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case ErrorType.AI_API_ERROR:
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case ErrorType.AUTHENTICATION_ERROR:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case ErrorType.VALIDATION_ERROR:
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
  };

  const getErrorColor = () => {
    switch (appError.type) {
      case ErrorType.NETWORK_ERROR:
        return isDarkMode 
          ? 'bg-orange-900/20 border-orange-800 text-orange-400'
          : 'bg-orange-50 border-orange-200 text-orange-800';
      case ErrorType.AI_API_ERROR:
        return isDarkMode 
          ? 'bg-red-900/20 border-red-800 text-red-400'
          : 'bg-red-50 border-red-200 text-red-800';
      case ErrorType.AUTHENTICATION_ERROR:
        return isDarkMode 
          ? 'bg-yellow-900/20 border-yellow-800 text-yellow-400'
          : 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case ErrorType.VALIDATION_ERROR:
        return isDarkMode 
          ? 'bg-blue-900/20 border-blue-800 text-blue-400'
          : 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return isDarkMode 
          ? 'bg-red-900/20 border-red-800 text-red-400'
          : 'bg-red-50 border-red-200 text-red-800';
    }
  };

  return (
    <div className={`rounded-lg border p-4 ${getErrorColor()} ${className}`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-0.5">
          {getErrorIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="text-sm font-medium mb-1">
                {ErrorHandler.getErrorMessages()[appError.type]}
              </h4>
              <p className="text-sm opacity-90">
                {appError.userMessage}
              </p>
              
              {/* Mostrar timestamp en desarrollo */}
              {import.meta.env.DEV && (
                <p className="text-xs opacity-60 mt-1">
                  {appError.timestamp.toLocaleTimeString()} - {appError.type}
                </p>
              )}
            </div>
            
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="flex-shrink-0 ml-3 p-1 rounded hover:bg-black hover:bg-opacity-10 transition-colors"
                title="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          
          {/* Botones de acción */}
          <div className="flex items-center space-x-3 mt-3">
            {appError.type === ErrorType.AI_API_ERROR && (
              <button
                onClick={() => {
                  alert('Error de conexión con la IA. Verifica tu conexión a internet e intenta nuevamente.');
                }}
                className="text-xs font-medium hover:underline"
              >
                Reintentar
              </button>
            )}
            
            {appError.type === ErrorType.AUTHENTICATION_ERROR && (
              <button
                onClick={() => {
                  // Abrir modal de login
                  const event = new CustomEvent('openLogin');
                  window.dispatchEvent(event);
                }}
                className="text-xs font-medium hover:underline"
              >
                Iniciar Sesión
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorMessage;