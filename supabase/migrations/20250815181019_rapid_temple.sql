-- EJECUTA ESTE SQL EN TU SUPABASE DASHBOARD
-- Ve a: https://supabase.com/dashboard/project/aqkmryhlejbyezcuztwp/sql

-- 1. Primero habilitar la extensión pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Crear tabla de pagos (si no existe)
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  paypal_order_id text UNIQUE NOT NULL,
  amount decimal(10,2) NOT NULL,
  currency text DEFAULT 'USD' NOT NULL,
  status text NOT NULL CHECK (status IN ('CREATED', 'APPROVED', 'COMPLETED', 'CANCELLED', 'FAILED')),
  plan_type text NOT NULL CHECK (plan_type IN ('basic', 'professional', 'advanced')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Habilitar RLS para payments
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- 4. Políticas para payments
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'payments' AND policyname = 'Users can read own payments'
  ) THEN
    CREATE POLICY "Users can read own payments"
      ON payments
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'payments' AND policyname = 'Users can create own payments'
  ) THEN
    CREATE POLICY "Users can create own payments"
      ON payments
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'payments' AND policyname = 'Users can update own payments'
  ) THEN
    CREATE POLICY "Users can update own payments"
      ON payments
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- 5. Crear tabla de documentos legales (si no existe)
CREATE TABLE IF NOT EXISTS legal_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL,
  title text,
  content text NOT NULL,
  embedding vector(1536) NOT NULL,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- 6. Habilitar RLS para legal_documents
ALTER TABLE legal_documents ENABLE ROW LEVEL SECURITY;

-- 7. Política para legal_documents
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'legal_documents' AND policyname = 'Users can read legal documents'
  ) THEN
    CREATE POLICY "Users can read legal documents"
      ON legal_documents
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

-- 8. Crear índices
CREATE INDEX IF NOT EXISTS legal_documents_embedding_idx 
ON legal_documents 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

CREATE INDEX IF NOT EXISTS legal_documents_document_id_idx 
ON legal_documents (document_id);

-- 9. Trigger para updated_at en payments (si no existe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'handle_updated_at' AND tgrelid = 'payments'::regclass
  ) THEN
    CREATE TRIGGER handle_updated_at BEFORE UPDATE ON payments
      FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END $$;

-- Verificar que todo se creó correctamente
SELECT 'payments table created' as status WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments');
SELECT 'legal_documents table created' as status WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'legal_documents');
SELECT 'vector extension enabled' as status WHERE EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector');