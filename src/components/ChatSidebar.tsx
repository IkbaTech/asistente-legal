import React, { useState } from 'react';
import { MessageSquare, Plus, Trash2, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Chat } from '../types';
import { useAuth } from '../hooks/useAuth';

interface ChatSidebarProps {
  chats: Chat[];
  currentChat: Chat | null;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
  onDeleteChat: (chatId: string) => void;
  loadingChats: boolean;
  isDarkMode: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
  chats,
  currentChat,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  loadingChats,
  isDarkMode,
  isCollapsed,
  onToggleCollapse
}) => {
  const [hoveredChat, setHoveredChat] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  // No mostrar sidebar para usuarios no autenticados
  if (!isAuthenticated) {
    return null;
  }

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('es-GT', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString('es-GT', { 
        weekday: 'short' 
      });
    } else {
      return date.toLocaleDateString('es-GT', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const handleDeleteChat = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    if (window.confirm('¿Estás seguro de que quieres eliminar esta conversación?')) {
      onDeleteChat(chatId);
    }
  };

  if (isCollapsed) {
    return (
      <div className="w-12 sidebar-premium transition-all duration-300">
        <div className="p-2">
          <button
            onClick={onToggleCollapse}
            className="w-8 h-8 rounded-lg flex items-center justify-center glass hover-glow transition-all duration-300 text-white"
            title="Expandir panel de chats"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="px-2 pb-2">
          <button
            onClick={onNewChat}
            className="w-8 h-8 rounded-lg flex items-center justify-center glass hover-glow transition-all duration-300 text-white"
            title="Nuevo chat"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 sidebar-premium transition-all duration-300 animate-slideInFromLeft border-r border-white">
      {/* Header */}
      <div className="p-4 border-b border-white/20">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold gradient-text">
            Conversaciones
          </h2>
          <button
            onClick={onToggleCollapse}
            className="p-1 rounded-lg glass hover-glow transition-all duration-300 text-white"
            title="Contraer panel"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>
        <button
          onClick={onNewChat}
          className="w-full btn-premium px-4 py-2 rounded-lg flex items-center justify-center space-x-2 hover-lift"
        >
          <Plus className="h-4 w-4" />
          <span>Nuevo Chat</span>
        </button>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {loadingChats ? (
          <div className="p-4 text-center">
            <div className="spinner-premium mx-auto mb-2" />
            <div className="text-sm text-blue-300">
              Cargando conversaciones...
            </div>
          </div>
        ) : chats.length === 0 ? (
          <div className="p-4 text-center">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 text-blue-400 animate-float" />
            <p className="text-sm text-blue-300">
              No hay conversaciones aún
            </p>
            <p className="text-xs mt-1 text-blue-400">
              Inicia una nueva conversación para comenzar
            </p>
          </div>
        ) : (
          <div className="p-2">
            {chats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => onSelectChat(chat.id)}
                onMouseEnter={() => setHoveredChat(chat.id)}
                onMouseLeave={() => setHoveredChat(null)}
                className={`relative p-3 rounded-lg cursor-pointer transition-all duration-300 mb-2 group card-premium ${
                  currentChat?.id === chat.id
                    ? 'neon-blue scale-105'
                    : 'hover-lift'
                }`}
              >
                
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium truncate text-white">
                      {chat.title}
                    </h3>
                    {/* Debug info - remove in production */}
                    {import.meta.env.DEV && (
                      <div className="text-xs opacity-50 mb-1">
                        ID: {chat.id.slice(-8)}
                      </div>
                    )}
                    <div className="flex items-center space-x-2 mt-1">
                      <Calendar className="h-3 w-3 text-blue-400" />
                      <span className="text-xs text-blue-300">
                        {formatDate(chat.updatedAt)}
                      </span>
                    </div>
                  </div>
                  
                  {(hoveredChat === chat.id || currentChat?.id === chat.id) && (
                    <button
                      onClick={(e) => handleDeleteChat(e, chat.id)}
                      className="p-1 rounded transition-all duration-300 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-red-400 hover-rotate"
                      title="Eliminar conversación"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatSidebar;