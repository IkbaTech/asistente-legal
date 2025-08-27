# IkbaTech - IA Legal para Estudiantes y Abogados

## 🔒 Configuración de Seguridad (IMPORTANTE)

### Variables de Entorno para Edge Functions

Para que la IA funcione correctamente, necesitas configurar las siguientes variables de entorno en Supabase:

1. Ve a tu [Dashboard de Supabase](https://supabase.com/dashboard)
2. Selecciona tu proyecto
3. Ve a **Settings** → **Edge Functions** → **Environment Variables**
4. Agrega las siguientes variables:

```env
OPENAI_API_KEY=tu_api_key_de_openai_aqui
```

**¿Dónde obtener la API key de OpenAI?**
- Ve a [OpenAI Platform](https://platform.openai.com/api-keys)
- Crea una nueva API key o usa una existente
- Copia la key (empieza con `sk-`)
- Pégala en la variable de entorno de Supabase

### ✅ Beneficios de esta Configuración

- **🔒 Seguridad**: Tu API key está protegida en el servidor, no en el frontend
- **💰 Control de costos**: Mejor control sobre el uso de la API
- **📊 Monitoreo**: Logs centralizados de todas las llamadas a IA
- **🚀 Escalabilidad**: Preparado para implementar límites por usuario

## Configuración de Supabase

Para que la autenticación funcione correctamente, necesitas configurar Supabase:

### 1. Crear Proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta
2. Crea un nuevo proyecto
3. Espera a que se complete la configuración

### 2. Configurar Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto con:

```env
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
```

Puedes encontrar estos valores en:
- Supabase Dashboard → Settings → API

### 3. Configurar Base de Datos

Ejecuta las siguientes consultas SQL en el editor SQL de Supabase:

```sql
-- Crear tabla de perfiles
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'basic', 'professional', 'advanced')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Crear tabla de chats
CREATE TABLE chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de mensajes
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID REFERENCES chats ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  type TEXT DEFAULT 'text' CHECK (type IN ('text', 'document', 'draft')),
  document_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad para profiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Políticas de seguridad para chats
CREATE POLICY "Users can view own chats" ON chats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own chats" ON chats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chats" ON chats
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own chats" ON chats
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas de seguridad para messages
CREATE POLICY "Users can view messages from own chats" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chats 
      WHERE chats.id = messages.chat_id 
      AND chats.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in own chats" ON messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM chats 
      WHERE chats.id = messages.chat_id 
      AND chats.user_id = auth.uid()
    )
  );

-- Función para crear perfil automáticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear perfil automáticamente
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON chats
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
```

### 4. Configurar Autenticación

En Supabase Dashboard → Authentication → Settings:

1. **Site URL**: `http://localhost:5173` (para desarrollo)
2. **Redirect URLs**: `http://localhost:5173/**`
3. Habilita **Email confirmations** si lo deseas
4. Configura **Email templates** según tus necesidades

### 5. Instalar Dependencias

```bash
npm install
```

### 6. Ejecutar la Aplicación

**Backend:**
```bash
cd backend
npm install
npm start
```

**Frontend:**
```bash
npm install
npm run dev
```

La aplicación estará disponible en `http://localhost:5173` y se comunicará con el backend en `http://localhost:3001`.

## Funcionalidades Implementadas

### ✅ Para Estudiantes de Derecho
- Explicación clara de conceptos jurídicos
- Análisis de casos de estudio
- Ayuda con tareas y ensayos legales
- Definición de términos técnicos
- Ejemplos prácticos y casos relevantes
- Apoyo en investigación jurídica

### ✅ Para Abogados Profesionales
- Análisis técnico de documentos legales
- Redacción de documentos profesionales
- Investigación jurisprudencial avanzada
- Análisis comparativo de casos
- Plantillas legales personalizables

### ✅ Funcionalidades Generales
- Registro de usuarios
- Inicio de sesión
- Recuperación de contraseña
- Gestión de perfiles
- Cierre de sesión

### ✅ IA Segura
- API key de OpenAI protegida en el backend Node.js
- Todas las llamadas a IA pasan por el servidor backend seguro
- Autenticación requerida para usar la IA
- Manejo de errores robusto

### ✅ Seguridad
- Row Level Security (RLS)
- Políticas de acceso por usuario
- Validación de formularios
- Manejo de errores robusto

### ✅ Persistencia de Chats
- Historial de estudios y consultas
- Organización por temas y materias
- Funcionalidad de crear, seleccionar y eliminar chats
- Sincronización automática entre dispositivos

### ✅ Base de Datos
- Perfiles de usuario
- Sistema de chats educativos y profesionales
- Base de conocimiento jurídico (RAG)
- Sistema de pagos integrado

## Próximos Pasos

1. **Contenido Educativo**: Ampliar base de conocimiento para estudiantes
2. **Casos de Estudio**: Biblioteca de casos jurídicos guatemaltecos
3. **Simuladores**: Herramientas de práctica para estudiantes
4. **Certificaciones**: Sistema de logros y progreso académico
5. **Colaboración**: Funciones para grupos de estudio
6. **Recursos**: Biblioteca de leyes y jurisprudencia actualizada

## Soporte

**Estudiantes**: Soporte educativo y ayuda con estudios
**Profesionales**: Soporte técnico especializado
**Contacto**: ikbatech@gmail.com