-- Fix para agregar trigger faltante a tabla payments existente
-- Ejecutar en Supabase Dashboard SQL Editor

-- Solo crear el trigger si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'handle_updated_at' 
    AND tgrelid = 'payments'::regclass
  ) THEN
    CREATE TRIGGER handle_updated_at BEFORE UPDATE ON payments
      FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    
    RAISE NOTICE 'Trigger handle_updated_at creado para tabla payments';
  ELSE
    RAISE NOTICE 'Trigger handle_updated_at ya existe para tabla payments';
  END IF;
END $$;

-- Verificar que el trigger se creó correctamente
SELECT 
  tgname as trigger_name,
  tgrelid::regclass as table_name
FROM pg_trigger 
WHERE tgname = 'handle_updated_at' 
AND tgrelid = 'payments'::regclass;