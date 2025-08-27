@@ .. @@
 -- 2. Crear tabla de pagos (si no existe)
+-- Primero crear la función handle_updated_at si no existe
+CREATE OR REPLACE FUNCTION public.handle_updated_at()
+RETURNS TRIGGER AS $$
+BEGIN
+  NEW.updated_at = now();
+  RETURN NEW;
+END;
+$$ language 'plpgsql';
+
+-- 3. Crear tabla de pagos (si no existe)
 CREATE TABLE IF NOT EXISTS payments (