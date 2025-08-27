# 🚀 Guía de Despliegue en Render - IkbaTech Backend

## 📋 Pasos para Desplegar tu Backend en Render

### 1. Preparar el Repositorio
- Asegúrate de que tu carpeta `backend` esté en tu repositorio Git
- Haz commit y push de todos los cambios recientes

### 2. Conectar con GitHub y Crear Servicio
1. Ve a [render.com](https://render.com) e inicia sesión
2. Haz clic en "New +" → "Web Service"
3. Conecta tu repositorio de GitHub (si no está conectado ya)
4. Selecciona tu repositorio del proyecto
5. Configura el servicio:
   - **Name**: `ikbatech-backend`
   - **Region**: Elige la más cercana a tus usuarios
   - **Branch**: `main` (o tu rama principal)
   - **Root Directory**: `backend` (si tu backend está en una subcarpeta)
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (para empezar)

### 3. Configurar Variables de Entorno en Render
En la sección "Environment Variables" de tu servicio, agrega:

```
OPENAI_API_KEY=sk-proj-TU_CLAVE_REAL_DE_OPENAI_AQUI
NODE_ENV=production
CORS_ORIGIN=https://localhost:5173,https://tu-dominio-frontend.com
```

**IMPORTANTE**: 
- Reemplaza `tu_clave_real_de_openai_aqui` con tu API key real de OpenAI
- Actualiza las URLs en CORS_ORIGIN con tus dominios reales

### 4. Desplegar
- Render desplegará automáticamente tu servicio
- Una vez completado, obtendrás una URL como: `https://ikbatech-backend-abc123.onrender.com`

### 5. Actualizar el Frontend
1. Copia la URL de tu backend desplegado en Render
2. Abre `src/services/aiService.ts` 
3. En la función `getBackendUrl()`, reemplaza `https://tu-backend-render.onrender.com` con tu URL real de Render
4. Haz commit y push de este cambio

### 6. Probar la Conexión
- Ejecuta tu frontend: `npm run dev`
- Prueba que la IA funcione correctamente
- Verifica en la consola del navegador que las llamadas vayan a tu backend desplegado en Render

## 🔧 Comandos Útiles

### Para desarrollo local:
```bash
cd backend
npm run dev
```

### Para probar la conexión:
```bash
curl https://tu-backend-render.onrender.com/health
```

## 🚨 Solución de Problemas

### Error de CORS
- Verifica que `CORS_ORIGIN` incluya el dominio de tu frontend
- Asegúrate de que no haya espacios extra en la variable de entorno

### Error de OpenAI API Key
- Verifica que `OPENAI_API_KEY` esté configurada correctamente en Render
- La clave debe empezar con `sk-`

### Backend no responde
- Revisa los logs en el dashboard de Render
- Verifica que el comando de inicio sea `npm start`
- Asegúrate de que `package.json` tenga todas las dependencias

## 📝 Notas Importantes

1. **Primer despliegue**: Render puede tardar unos minutos en el primer despliegue
2. **Plan gratuito**: Render tiene un plan gratuito con algunas limitaciones
3. **Actualizaciones**: Cada push a tu rama principal activará un nuevo despliegue
4. **Logs**: Usa el dashboard de Render para monitorear logs y rendimiento

## ✅ Verificación Final

Tu backend estará listo cuando:
- [ ] El servicio esté "Live" en Render
- [ ] `https://tu-backend-render.onrender.com/health` responda con status "healthy"
- [ ] Tu frontend local pueda comunicarse con el backend en Render
- [ ] La IA responda correctamente a través del backend desplegado