/*
  # Create legal_documents table for RAG implementation

  1. New Tables
    - `legal_documents`
      - `id` (uuid, primary key)
      - `document_id` (uuid, for grouping fragments from same document)
      - `title` (text, document title)
      - `content` (text, document fragment)
      - `embedding` (vector, for similarity search)
      - `metadata` (jsonb, additional document info)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `legal_documents` table
    - Add policy for authenticated users to read legal documents
*/

CREATE TABLE IF NOT EXISTS legal_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL,
  title text,
  content text NOT NULL,
  embedding vector(1536) NOT NULL,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE legal_documents ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad para legal_documents
CREATE POLICY "Users can read legal documents"
  ON legal_documents
  FOR SELECT
  TO authenticated
  USING (true);

-- Índice para búsquedas de similitud vectorial
CREATE INDEX IF NOT EXISTS legal_documents_embedding_idx 
ON legal_documents 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Índice para búsquedas por document_id
CREATE INDEX IF NOT EXISTS legal_documents_document_id_idx 
ON legal_documents (document_id);