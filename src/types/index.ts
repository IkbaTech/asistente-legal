export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  type?: 'text' | 'document' | 'draft';
  documentName?: string;
  documentType?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  plan: 'free' | 'basic' | 'professional' | 'advanced';
  avatar?: string;
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  userId?: string;
}

export interface DocumentUpload {
  file: File;
  type: 'pdf' | 'docx' | 'doc';
  name: string;
  size: number;
}

export interface LegalTemplate {
  id: string;
  name: string;
  type: 'amparo' | 'denuncia' | 'demanda' | 'contrato';
  description: string;
}

// Tipos de Supabase
export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  plan: 'free' | 'basic' | 'professional' | 'advanced';
  created_at: string;
  updated_at: string;
}

export interface ChatRecord {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface MessageRecord {
  id: string;
  chat_id: string;
  content: string;
  role: 'user' | 'assistant';
  type: 'text' | 'document' | 'draft';
  document_name: string | null;
  created_at: string;
}