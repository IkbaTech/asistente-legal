import { logger } from './logger';

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

class SecurityManager {
  private rateLimitMap = new Map<string, RateLimitEntry>();
  private readonly maxRequests = 100;
  private readonly windowMs = 30000; // 30 seconds

  validateInput(input: string): boolean {
    if (!input || typeof input !== 'string') {
      return false;
    }

    // Check length
    if (input.length > 50000) {
      logger.warn('Input too long', { length: input.length });
      return false;
    }

    // Check for dangerous patterns only in production
    if (import.meta.env.PROD) {
      const dangerousPatterns = [
        /<script[^>]*>.*?<\/script>/gi,
        /javascript:/gi,
        /data:text\/html/gi,
        /vbscript:/gi
      ];

      for (const pattern of dangerousPatterns) {
        if (pattern.test(input)) {
          logger.warn('Dangerous pattern detected in input');
          return false;
        }
      }
    }

    return true;
  }

  sanitizeInput(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    // Minimal sanitization to preserve functionality
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/data:text\/html/gi, '')
      .replace(/vbscript:/gi, '');
  }

  checkRateLimit(identifier: string): boolean {
    // No rate limiting in development
    if (!import.meta.env.PROD) {
      return true;
    }

    const now = Date.now();
    const entry = this.rateLimitMap.get(identifier);

    if (!entry) {
      this.rateLimitMap.set(identifier, { count: 1, windowStart: now });
      return true;
    }

    // Reset window if expired
    if (now - entry.windowStart > this.windowMs) {
      this.rateLimitMap.set(identifier, { count: 1, windowStart: now });
      return true;
    }

    // Check if limit exceeded
    if (entry.count >= this.maxRequests) {
      logger.warn('Rate limit exceeded', { identifier, count: entry.count });
      return false;
    }

    // Increment counter
    entry.count++;
    return true;
  }

  clearSensitiveData(): void {
    try {
      // Clear localStorage
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.includes('supabase') ||
          key.includes('token') ||
          key.includes('session') ||
          key.includes('auth')
        )) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));

      // Clear sessionStorage
      const sessionKeysToRemove = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && (
          key.includes('supabase') ||
          key.includes('token') ||
          key.includes('session') ||
          key.includes('auth')
        )) {
          sessionKeysToRemove.push(key);
        }
      }
      sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key));

      // Reset rate limits
      this.rateLimitMap.clear();

      logger.info('Sensitive data cleared successfully');
    } catch (error) {
      logger.error('Error clearing sensitive data:', error);
    }
  }

  validateFileType(file: File): boolean {
    const allowedTypes = [
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp'
    ];

    const allowedExtensions = [
      '.pdf', '.txt', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.gif', '.webp'
    ];

    const hasValidType = allowedTypes.includes(file.type);
    const hasValidExtension = allowedExtensions.some(ext => 
      file.name.toLowerCase().endsWith(ext)
    );

    if (!hasValidType || !hasValidExtension) {
      logger.warn('Invalid file type', { 
        fileName: file.name, 
        fileType: file.type 
      });
      return false;
    }

    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      logger.warn('File too large', { 
        fileName: file.name, 
        fileSize: file.size 
      });
      return false;
    }

    return true;
  }

  setupSecurityHeaders(): void {
    // Only apply in production with HTTPS
    if (!import.meta.env.PROD || !window.location.protocol.includes('https')) {
      return;
    }

    try {
      // Set security headers via meta tags
      const securityHeaders = [
        { name: 'X-Content-Type-Options', content: 'nosniff' },
        { name: 'X-Frame-Options', content: 'DENY' },
        { name: 'X-XSS-Protection', content: '1; mode=block' },
        { name: 'Referrer-Policy', content: 'strict-origin-when-cross-origin' }
      ];

      securityHeaders.forEach(header => {
        const existingMeta = document.querySelector(`meta[http-equiv="${header.name}"]`);
        if (!existingMeta) {
          const meta = document.createElement('meta');
          meta.setAttribute('http-equiv', header.name);
          meta.setAttribute('content', header.content);
          document.head.appendChild(meta);
        }
      });

      logger.info('Security headers configured');
    } catch (error) {
      logger.error('Error setting up security headers:', error);
    }
  }
}

export const securityManager = new SecurityManager();