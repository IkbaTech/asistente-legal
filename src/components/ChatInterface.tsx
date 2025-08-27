import React, { useState, useRef, useEffect } from 'react';
import { Send, Upload, FileText, GitCompare, Loader2, AlertCircle, Lock } from 'lucide-react';
import { useChat } from '../hooks/useChat';
import { usePlanLimits } from '../hooks/usePlanLimits';
import { useAuth } from '../hooks/useAuth';
import Message from './Message';
import DocumentUpload from './DocumentUpload';
import ComparativeAnalysisForm from './ComparativeAnalysisForm';
import QuickActions from './QuickActions';
import PlanLimitWarning from './PlanLimitWarning';
import ErrorMessage from './ErrorMessage';
import { Chat } from '../types';
import { logger } from '../utils/logger';

interface ChatInterfaceProps {
  isDarkMode: boolean;
  currentChat: Chat | null;
  onUpdateMessages: (messages: any[]) => void;
  onMessageSaved: (message: any) => void;
  onClearChat: () => void;
  onUserInteraction: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  isDarkMode,
  currentChat,
  onUpdateMessages,
  onMessageSaved,
  onClearChat,
  onUserInteraction
}) => {
  const [input, setInput] = useState('');
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);
  const [showComparativeAnalysis, setShowComparativeAnalysis] = useState(false);
  const [showPlanWarning, setShowPlanWarning] = useState(false);
  const [planWarningInfo, setPlanWarningInfo] = useState({ feature: '', message: '' });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  const { isAuthenticated, profile } = useAuth();
  const { canUseFeature, canSendMessage, getLimitMessage } = usePlanLimits();
  
  const { messages, isTyping, error, sendMessage, generateLegalDraft, sendComparativeAnalysis, clearError } = useChat(onMessageSaved);

  // Sincronizar mensajes con el chat actual
  useEffect(() => {
    if (currentChat) {
      onUpdateMessages(currentChat.messages);
    } else {
      onUpdateMessages(messages);
    }
  }, [messages, currentChat, onUpdateMessages]);

  // Auto-scroll al final
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Focus en input
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || isTyping) return;

    onUserInteraction();

    // Verificar límites de plan
    if (!canSendMessage()) {
      setPlanWarningInfo({
        feature: 'messages',
        message: getLimitMessage('messages')
      });
      setShowPlanWarning(true);
      return;
    }

    const message = input.trim();
    setInput('');
    
    try {
      await sendMessage(message);
      logger.info('Message sent successfully', 'ChatInterface');
    } catch (error) {
      logger.error('Error sending message', 'ChatInterface', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleQuickAction = async (action: string) => {
    onUserInteraction();

    // Ahora 'action' ya es el prompt completo que viene de QuickActions
    try {
      await sendMessage(action);
      logger.info('Quick action executed successfully', 'ChatInterface');
    } catch (error) {
      logger.error('Error in quick action', 'ChatInterface', error);
    }
  };

  const handleFileUpload = async (content: string, fileName: string) => {
    onUserInteraction();
    setShowDocumentUpload(false);
    
    try {
      await sendMessage(content, 'document', fileName);
      logger.info('Document uploaded and analyzed', 'ChatInterface', { fileName });
    } catch (error) {
      logger.error('Error uploading document', 'ChatInterface', error);
    }
  };

  const handleComparativeAnalysis = async (entity1: string, entity2: string, type: 'document' | 'scenario', entity1Name?: string, entity2Name?: string) => {
    onUserInteraction();
    setShowComparativeAnalysis(false);

    // Verificar límites de plan
    if (!canUseFeature('canUseComparativeAnalysis')) {
      setPlanWarningInfo({
        feature: 'comparative',
        message: getLimitMessage('comparative')
      });
      setShowPlanWarning(true);
      return;
    }

    try {
      await sendComparativeAnalysis(entity1, entity2, type, entity1Name, entity2Name);
      logger.info('Comparative analysis completed', 'ChatInterface');
    } catch (error) {
      logger.error('Error in comparative analysis', 'ChatInterface', error);
    }
  };

  const handleUpgradeClick = () => {
    const event = new CustomEvent('openPaymentModal');
    window.dispatchEvent(event);
    setShowPlanWarning(false);
  };

  const displayMessages = currentChat ? currentChat.messages : messages;

  return (
    <div className="flex flex-col h-full bg-black relative">
      {/* Área de mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Acciones rápidas - solo mostrar si no hay mensajes del usuario */}
        {displayMessages.length <= 1 && (
          <div className="animate-fadeInUp">
            <QuickActions onActionClick={handleQuickAction} isDarkMode={isDarkMode} />
          </div>
        )}

        {/* Mensajes */}
        <div className="space-y-4">
          {displayMessages.map((message) => (
            <Message
              key={message.id}
              message={message}
              isDarkMode={isDarkMode}
            />
          ))}
          
          {/* Indicador de escritura */}
          {isTyping && (
            <div className="flex justify-start animate-fadeInUp">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-black border border-white flex items-center justify-center">
                  <Loader2 className="h-4 w-4 text-white animate-spin" />
                </div>
                <div className="bg-black border border-white text-white px-4 py-3 rounded-2xl">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">Analizando...</span>
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div ref={messagesEndRef} />
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4">
          <ErrorMessage
            error={error}
            onDismiss={clearError}
            isDarkMode={isDarkMode}
          />
        </div>
      )}

      {/* Formulario de análisis comparativo */}
      {showComparativeAnalysis && (
        <div className="p-4">
          <ComparativeAnalysisForm
            onSubmit={handleComparativeAnalysis}
            onCancel={() => setShowComparativeAnalysis(false)}
            isDarkMode={isDarkMode}
          />
        </div>
      )}

      {/* Área de entrada */}
      <div className="border-t border-white p-4 bg-black">
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Botones de acción */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-2">
            <button
              type="button"
              onClick={() => {
                setShowDocumentUpload(true);
              }}
              className="flex items-center space-x-2 px-3 py-2 text-sm border border-white rounded-lg hover:bg-white hover:text-black transition-all duration-300 text-white whitespace-nowrap"
              title="Subir documento"
            >
              <Upload className="h-4 w-4" />
              <span>Subir Documento</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (!canUseFeature('canUseComparativeAnalysis')) {
                  setPlanWarningInfo({
                    feature: 'comparative',
                    message: getLimitMessage('comparative')
                  });
                  setShowPlanWarning(true);
                  return;
                }
                setShowComparativeAnalysis(true);
              }}
              className="flex items-center space-x-2 px-3 py-2 text-sm border border-white rounded-lg hover:bg-white hover:text-black transition-all duration-300 text-white whitespace-nowrap"
              title="Análisis comparativo"
            >
              {!canUseFeature('canUseComparativeAnalysis') && <Lock className="h-4 w-4" />}
              <GitCompare className="h-4 w-4" />
              <span>Comparar</span>
            </button>
          </div>

          {/* Input de mensaje */}
          <div className="flex items-end space-x-3">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  isAuthenticated 
                    ? "Pregunta sobre derecho, casos, leyes, o sube documentos para analizar..." 
                    : "Haz preguntas sobre derecho o inicia sesión para funciones avanzadas..."
                }
                className="w-full px-4 py-3 bg-black border border-white rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-white text-white placeholder-gray-400 min-h-[50px] max-h-32"
                rows={1}
                disabled={isTyping}
                style={{
                  height: 'auto',
                  minHeight: '50px'
                }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = Math.min(target.scrollHeight, 128) + 'px';
                }}
              />
            </div>
            
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="bg-white text-black p-3 rounded-2xl hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center"
              title="Enviar mensaje"
            >
              {isTyping ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* Información del plan para usuarios no autenticados */}
          {!isAuthenticated && (
            <div className="text-center">
              <p className="text-xs text-gray-400">
                Usuarios no registrados: máximo 3 consultas gratuitas. 
                <button
                  onClick={() => {
                    const event = new CustomEvent('openLogin');
                    window.dispatchEvent(event);
                  }}
                  className="text-white hover:underline ml-1"
                >
                  Inicia sesión
                </button>
                {' '}para acceso ilimitado y funciones avanzadas.
              </p>
            </div>
          )}
        </form>
      </div>

      {/* Modales */}
      {showDocumentUpload && (
        <DocumentUpload
          onFileUpload={handleFileUpload}
          onClose={() => setShowDocumentUpload(false)}
          isDarkMode={isDarkMode}
        />
      )}

      {showPlanWarning && (
        <PlanLimitWarning
          feature={planWarningInfo.feature}
          currentPlan={profile?.plan || 'free'}
          message={planWarningInfo.message}
          onUpgrade={handleUpgradeClick}
          onClose={() => setShowPlanWarning(false)}
          isDarkMode={isDarkMode}
        />
      )}
    </div>
  );
};

export default ChatInterface;