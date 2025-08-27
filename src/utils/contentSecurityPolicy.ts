// Configuración de seguridad optimizada
export const setupCSP = () => {
  // Detectar si estamos en StackBlitz/WebContainer o desarrollo local
  const isStackBlitz = window.location.hostname.includes('webcontainer-api.io') || 
                      window.location.hostname.includes('stackblitz.io') ||
                      window.location.hostname.includes('webcontainer.io');
  
  const isLocalDev = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1';
  
  const isDevelopment = isStackBlitz || isLocalDev || import.meta.env.DEV;
  
  console.log('🔧 CSP Setup - Development mode:', isDevelopment);
  console.log('🔧 CSP Setup - Hostname:', window.location.hostname);

  if (isDevelopment) {
    console.log('🔧 Development mode: CSP completely disabled for easier development');
    return;
  }

  // Solo aplicar CSP en producción real con HTTPS y dominio propio
  const isRealProduction = window.location.protocol === 'https:' && 
                          !window.location.hostname.includes('localhost') &&
                          !isStackBlitz;
  
  if (!isRealProduction) {
    console.log('🔧 Not real production: CSP disabled');
    return;
  }

  // CSP solo para producción real
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co https://www.paypal.com https://js.paypal.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https: blob: https://*.pexels.com https://*.paypal.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.openai.com https://www.paypal.com https://api.paypal.com https://api-m.paypal.com https://api-m.sandbox.paypal.com https://asistente-legal.onrender.com",
    "media-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self' https://www.paypal.com",
    "frame-src https://www.paypal.com https://js.paypal.com",
    "worker-src 'self' blob:"
  ].join('; ');

  // Solo aplicar CSP si no existe ya
  if (!document.querySelector('meta[http-equiv="Content-Security-Policy"]')) {
    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    meta.content = csp;
    document.head.appendChild(meta);
    console.log('✅ Production CSP applied');
  }
};

export const setupSecurityHeaders = () => {
  // Detectar entorno de desarrollo
  const isDevelopment = window.location.hostname.includes('webcontainer-api.io') || 
                       window.location.hostname.includes('stackblitz.io') ||
                       window.location.hostname.includes('webcontainer.io') ||
                       window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1' ||
                       import.meta.env.DEV;
  
  if (isDevelopment) {
    console.log('🔧 Development mode: Security headers disabled');
    return;
  }

  // Solo aplicar headers de seguridad en producción real
  const isRealProduction = window.location.protocol === 'https:' && 
                          !window.location.hostname.includes('localhost');
  
  if (!isRealProduction) {
    console.log('🔧 Not real production: Security headers disabled');
    return;
  }

  // Headers de seguridad básicos para producción
  const securityMetas = [
    { name: 'referrer', content: 'strict-origin-when-cross-origin' },
    { httpEquiv: 'X-Content-Type-Options', content: 'nosniff' },
    { httpEquiv: 'X-Frame-Options', content: 'DENY' },
    { httpEquiv: 'X-XSS-Protection', content: '1; mode=block' }
  ];

  securityMetas.forEach(({ name, httpEquiv, content }) => {
    if (!document.querySelector(`meta[${name ? 'name' : 'http-equiv'}="${name || httpEquiv}"]`)) {
      const meta = document.createElement('meta');
      if (name) meta.name = name;
      if (httpEquiv) meta.httpEquiv = httpEquiv;
      meta.content = content;
      document.head.appendChild(meta);
    }
  });

  console.log('🔒 Production security headers configured');
};
