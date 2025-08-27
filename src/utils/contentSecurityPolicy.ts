// Configuración de seguridad optimizada para producción desplegada
export const setupCSP = () => {
  // Detectar si estamos en producción desplegada
  const isProduction = import.meta.env.PROD || window.location.protocol === 'https:';
  const currentDomain = window.location.origin;
  
  console.log('🔧 Setting up CSP for production deployment');

  if (!isProduction) {
    console.log('🔧 Development mode: Using permissive CSP');
    return;
  }

  // CSP optimizado para producción con Edge Functions
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co https://www.paypal.com https://js.paypal.com ${currentDomain}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https: blob: https://*.pexels.com https://*.paypal.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.openai.com https://www.paypal.com https://api.paypal.com https://api-m.paypal.com https://api-m.sandbox.paypal.com ${currentDomain}`,
    "media-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    `form-action 'self' https://www.paypal.com ${currentDomain}`,
    "frame-ancestors 'none'",
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
  // Headers de seguridad básicos para producción
  const isProduction = import.meta.env.PROD || window.location.protocol === 'https:';
  
  if (isProduction) {
    // Configurar headers de seguridad adicionales via meta tags
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
  }
};