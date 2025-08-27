import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { Message, Chat } from '../types';
import { logger } from '../utils/logger';

export const useChatPersistence = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [loadingChats, setLoadingChats] = useState(false);
  const [savingMessage, setSavingMessage] = useState(false);
  const { user, isAuthenticated } = useAuth();

  // Cargar chats del usuario
  const loadChats = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    setLoadingChats(true);
    try {
      // Cargar chats
      const { data: chatsData, error: chatsError } = await supabase
        .from('chats')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (chatsError) throw chatsError;

      // Cargar mensajes para cada chat
      const chatsWithMessages = await Promise.all(
        (chatsData || []).map(async (chat) => {
          const { data: messagesData, error: messagesError } = await supabase
            .from('messages')
            .select('*')
            .eq('chat_id', chat.id)
            .order('created_at', { ascending: true });

          if (messagesError) {
            logger.error('Error loading messages for chat', 'useChatPersistence', messagesError);
            return {
              ...chat,
              messages: [],
              createdAt: new Date(chat.created_at),
              updatedAt: new Date(chat.updated_at)
            };
          }

          const messages: Message[] = (messagesData || []).map(msg => ({
            id: msg.id,
            content: msg.content,
            role: msg.role as 'user' | 'assistant',
            timestamp: new Date(msg.created_at),
            type: msg.type as 'text' | 'document' | 'draft',
            documentName: msg.document_name || undefined
          }));

          return {
            id: chat.id,
            title: chat.title,
            messages,
            createdAt: new Date(chat.created_at),
            updatedAt: new Date(chat.updated_at),
            userId: chat.user_id
          };
        })
      );

      setChats(chatsWithMessages);
      logger.info('Chats loaded successfully', 'useChatPersistence', { count: chatsWithMessages.length });
    } catch (error) {
      logger.error('Error loading chats', 'useChatPersistence', error);
    } finally {
      setLoadingChats(false);
    }
  }, [isAuthenticated, user]);

  // Crear nuevo chat
  const createNewChat = useCallback(async (firstMessage?: Message): Promise<string | null> => {
    if (!isAuthenticated || !user) return null;

    try {
      const title = firstMessage 
        ? firstMessage.content.substring(0, 50) + (firstMessage.content.length > 50 ? '...' : '')
        : 'Nueva conversación';

      const { data: chatData, error: chatError } = await supabase
        .from('chats')
        .insert({
          user_id: user.id,
          title
        })
        .select()
        .single();

      if (chatError) throw chatError;

      const newChat: Chat = {
        id: chatData.id,
        title: chatData.title,
        messages: [],
        createdAt: new Date(chatData.created_at),
        updatedAt: new Date(chatData.updated_at),
        userId: chatData.user_id
      };

      setChats(prev => [newChat, ...prev]);
      setCurrentChatId(chatData.id);

      logger.info('New chat created', 'useChatPersistence', { chatId: chatData.id });
      return chatData.id;
    } catch (error) {
      logger.error('Error creating new chat', 'useChatPersistence', error);
      return null;
    }
  }, [isAuthenticated, user]);

  // Guardar mensaje
  const saveMessage = useCallback(async (message: Message, chatId?: string) => {
    if (!isAuthenticated || !user) return;

    setSavingMessage(true);
    try {
      let targetChatId = chatId || currentChatId;

      // Si no hay chat actual, crear uno nuevo
      if (!targetChatId) {
        targetChatId = await createNewChat(message);
        if (!targetChatId) return;
      }

      // Guardar mensaje en la base de datos
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          chat_id: targetChatId,
          content: message.content,
          role: message.role,
          type: message.type || 'text',
          document_name: message.documentName || null
        });

      if (messageError) throw messageError;

      // Actualizar timestamp del chat
      const { error: updateError } = await supabase
        .from('chats')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', targetChatId);

      if (updateError) {
        logger.warn('Error updating chat timestamp', 'useChatPersistence', updateError);
      }

      // Actualizar estado local
      setChats(prev => prev.map(chat => {
        if (chat.id === targetChatId) {
          return {
            ...chat,
            messages: [...chat.messages, message],
            updatedAt: new Date()
          };
        }
        return chat;
      }));

      logger.debug('Message saved successfully', 'useChatPersistence', { 
        chatId: targetChatId, 
        messageId: message.id 
      });
    } catch (error) {
      logger.error('Error saving message', 'useChatPersistence', error);
    } finally {
      setSavingMessage(false);
    }
  }, [isAuthenticated, user, currentChatId, createNewChat]);

  // Eliminar chat
  const deleteChat = useCallback(async (chatId: string) => {
    if (!isAuthenticated || !user) return;

    try {
      // Los mensajes se eliminan automáticamente por CASCADE
      const { error } = await supabase
        .from('chats')
        .delete()
        .eq('id', chatId)
        .eq('user_id', user.id);

      if (error) throw error;

      setChats(prev => prev.filter(chat => chat.id !== chatId));
      
      if (currentChatId === chatId) {
        setCurrentChatId(null);
      }

      logger.info('Chat deleted successfully', 'useChatPersistence', { chatId });
    } catch (error) {
      logger.error('Error deleting chat', 'useChatPersistence', error);
    }
  }, [isAuthenticated, user, currentChatId]);

  // Cargar chat específico
  const loadChat = useCallback((chatId: string): Message[] => {
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
      setCurrentChatId(chatId);
      return chat.messages;
    }
    return [];
  }, [chats]);

  // Obtener chat actual
  const getCurrentChat = useCallback((): Chat | null => {
    if (!currentChatId) return null;
    return chats.find(c => c.id === currentChatId) || null;
  }, [chats, currentChatId]);

  // Actualizar mensajes del chat actual
  const updateCurrentChatMessages = useCallback((messages: Message[]) => {
    if (!currentChatId) return;
    
    setChats(prev => prev.map(chat => {
      if (chat.id === currentChatId) {
        return {
          ...chat,
          messages,
          updatedAt: new Date()
        };
      }
      return chat;
    }));
  }, [currentChatId]);

  // Cargar chats al inicializar
  useEffect(() => {
    if (isAuthenticated) {
      loadChats();
    } else {
      setChats([]);
      setCurrentChatId(null);
    }
  }, [isAuthenticated, loadChats]);

  return {
    chats,
    currentChatId,
    currentChat: getCurrentChat(),
    loadingChats,
    savingMessage,
    createNewChat,
    saveMessage,
    deleteChat,
    loadChat,
    setCurrentChatId,
    updateCurrentChatMessages,
    refreshChats: loadChats
  };
};