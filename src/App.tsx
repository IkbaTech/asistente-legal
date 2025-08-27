import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SecurityProvider from './components/SecurityProvider';
import Header from './components/Header';
import ChatSidebar from './components/ChatSidebar';
import ErrorBoundary from './components/ErrorBoundary';
import ChatInterface from './components/ChatInterface';
import PaymentSuccess from './components/PaymentSuccess';
import PaymentCancel from './components/PaymentCancel';
import EntranceAnimation from './components/EntranceAnimation';
import { useChatPersistence } from './hooks/useChatPersistence';
import { useAuth } from './hooks/useAuth';
import { Message } from './types';
import { useChat } from './hooks/useChat';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showEntranceAnimation, setShowEntranceAnimation] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  
  const { isAuthenticated } = useAuth();
  const { 
    chats, 
    currentChatId, 
    currentChat,
    loadingChats,
    saveMessage,
    createNewChat,
    deleteChat,
    loadChat,
    setCurrentChatId,
    updateCurrentChatMessages
  } = useChatPersistence();
  
  const handleLegalAction = (action: string) => {
    console.log('Legal action:', action);
  };

  const onMessageSaved = async (message: Message) => {
    // Simplificado: solo guardar si está autenticado
    if (isAuthenticated) {
      try {
        await saveMessage(message, currentChatId || undefined);
      } catch (error) {
        console.warn('Failed to save messages to database:', error);
      }
    }
  };

  const handleSelectChat = (chatId: string) => {
    const messages = loadChat(chatId);
    console.log('Loading chat:', chatId, 'with', messages.length, 'messages');
    // Los mensajes se cargarán automáticamente en ChatInterface
  };

  const handleNewChat = async () => {
    if (isAuthenticated) {
      await createNewChat();
    }
  };

  const handleDeleteChat = (chatId: string) => {
    deleteChat(chatId);
  };

  const handleClearChat = () => {
    // Limpiar el chat actual
    setCurrentChatId(null);
    setHasUserInteracted(false);
    
    // Si hay un chat actual, también limpiarlo
    if (currentChat) {
      updateCurrentChatMessages([{
        id: 'welcome',
        content: 'Chat limpiado. ¿En qué análisis legal puedo asistirle, colega?',
        role: 'assistant',
        timestamp: new Date(),
        type: 'text'
      }]);
    }
  };

  const handleAnimationComplete = () => {
    setShowEntranceAnimation(false);
  };

  // Mostrar animación de entrada
  if (showEntranceAnimation) {
    return (
      <ErrorBoundary isDarkMode={isDarkMode}>
        <EntranceAnimation 
          onAnimationComplete={handleAnimationComplete}
          isDarkMode={isDarkMode}
        />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary isDarkMode={isDarkMode}>
      <SecurityProvider>
        <Router>
          <Routes>
            <Route path="/payment-success" element={<PaymentSuccess isDarkMode={isDarkMode} />} />
            <Route path="/payment-cancel" element={<PaymentCancel isDarkMode={isDarkMode} />} />
            <Route path="/*" element={
              <div className="min-h-screen bg-black page-enter page-enter-active relative overflow-hidden">
                {/* Partículas de fondo globales */}
                <div className="particles">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="particle"
                      style={{
                        left: `${10 + i * 15}%`,
                        animationDelay: `${i * 2}s`,
                        animationDuration: `${20 + i * 5}s`
                      }}
                    />
                  ))}
                </div>
                
                <Header 
                  isDarkMode={isDarkMode} 
                  setIsDarkMode={setIsDarkMode}
                  onClearChat={handleClearChat}
                  onLegalAction={handleLegalAction}
                />
                <div className="h-[calc(100vh-4rem)] flex relative z-10">
                  {/* Sidebar de chats */}
                  {isAuthenticated && chats.length > 0 && (
                    <ChatSidebar
                      chats={chats}
                      currentChat={currentChat}
                      onSelectChat={handleSelectChat}
                      onNewChat={handleNewChat}
                      onDeleteChat={handleDeleteChat}
                      loadingChats={loadingChats}
                      isDarkMode={isDarkMode}
                      isCollapsed={sidebarCollapsed}
                      onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
                    />
                  )}
                  
                  {/* Área principal del chat */}
                  <div className={`w-full ${isAuthenticated && chats.length > 0 ? '' : 'max-w-4xl mx-auto'}`}>
                    <ChatInterface 
                      isDarkMode={isDarkMode}
                      currentChat={currentChat}
                      onUpdateMessages={updateCurrentChatMessages}
                      onMessageSaved={onMessageSaved}
                      onClearChat={handleClearChat}
                      onUserInteraction={() => setHasUserInteracted(true)}
                    />
                  </div>
                </div>
              </div>
            } />
          </Routes>
        </Router>
      </SecurityProvider>
    </ErrorBoundary>
  );
}

export default App;