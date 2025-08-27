import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Brain } from 'lucide-react';
import { logger } from '../utils/logger';
import { ErrorHandler, ErrorType } from '../utils/errorHandler';

interface Props {
  children: ReactNode;
  isDarkMode?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return {
      hasError: true,
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const appError = ErrorHandler.handleError(error, 'ErrorBoundary');
    
    logger.error('Error boundary caught error', 'ErrorBoundary', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId
    });

    this.setState({
      error,
      errorInfo,
    });

    // En producción, aquí enviarías el error a un servicio de monitoreo
    if (!import.meta.env.DEV) {
      this.reportErrorToService(error, errorInfo);
    }
  }

  private reportErrorToService(error: Error, errorInfo: ErrorInfo) {
    // Implementar envío a servicio de monitoreo (Sentry, LogRocket, etc.)
    console.log('Reporting error to monitoring service:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString()
    });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    });
  };

  private handleReportError = () => {
    const errorReport = {
      errorId: this.state.errorId,
      message: this.state.error?.message,
      stack: this.state.error?.stack,
      componentStack: this.state.errorInfo?.componentStack,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      logs: logger.getLogs()
    };

    const mailtoLink = `mailto:ikbatech@gmail.com?subject=Error Report - ${this.state.errorId}&body=${encodeURIComponent(
      `Error Report:\n\n${JSON.stringify(errorReport, null, 2)}`
    )}`;

    window.open(mailtoLink);
  };

  render() {
    if (this.state.hasError) {
      const { isDarkMode = false } = this.props;

      return (
        <div className={`min-h-screen flex items-center justify-center p-4 ${
          isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
        }`}>
          <div className={`max-w-lg w-full rounded-lg shadow-xl p-8 text-center ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            {/* Header */}
            <div className="flex items-center justify-center mb-6">
              <div className="bg-red-100 p-3 rounded-full">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </div>

            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="bg-blue-900 p-2 rounded-lg">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <h1 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                IkbaTech
              </h1>
            </div>

            <h2 className={`text-lg font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              ¡Oops! Algo salió mal
            </h2>

            <p className={`text-sm mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Ha ocurrido un error inesperado en la aplicación. Nuestro equipo ha sido notificado 
              automáticamente y trabajaremos para solucionarlo.
            </p>

            {/* Error ID */}
            <div className={`mb-6 p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                ID del Error: <code className="font-mono">{this.state.errorId}</code>
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={this.handleReload}
                className="w-full bg-blue-900 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors flex items-center justify-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Recargar Aplicación</span>
              </button>

              <button
                onClick={this.handleGoHome}
                className={`w-full px-4 py-2 rounded-lg transition-colors flex items-center justify-center space-x-2 ${
                  isDarkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Home className="h-4 w-4" />
                <span>Volver al Inicio</span>
              </button>

              <button
                onClick={this.handleReportError}
                className={`w-full px-4 py-2 rounded-lg transition-colors text-sm ${
                  isDarkMode
                    ? 'text-gray-400 hover:text-gray-300'
                    : 'text-gray-500 hover:text-gray-600'
                }`}
              >
                Reportar Error por Email
              </button>
            </div>

            {/* Development info */}
            {import.meta.env.DEV && this.state.error && (
              <details className={`mt-6 text-left ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <summary className="cursor-pointer text-sm font-medium mb-2">
                  Detalles del Error (Solo en Desarrollo)
                </summary>
                <div className={`p-3 rounded text-xs font-mono overflow-auto max-h-40 ${
                  isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
                }`}>
                  <div className="mb-2">
                    <strong>Error:</strong> {this.state.error.message}
                  </div>
                  <div className="mb-2">
                    <strong>Stack:</strong>
                    <pre className="whitespace-pre-wrap">{this.state.error.stack}</pre>
                  </div>
                  {this.state.errorInfo && (
                    <div>
                      <strong>Component Stack:</strong>
                      <pre className="whitespace-pre-wrap">{this.state.errorInfo.componentStack}</pre>
                    </div>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;