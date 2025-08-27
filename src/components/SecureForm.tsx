import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle } from 'lucide-react';
import { securityManager } from '../utils/security';
import { useAuth } from '../hooks/useAuth';

interface SecureFormProps {
  children: React.ReactNode;
  onSubmit: (e: React.FormEvent) => void;
  className?: string;
  maxAttempts?: number;
  cooldownMs?: number;
}

const SecureForm: React.FC<SecureFormProps> = ({ 
  children, 
  onSubmit, 
  className = '',
  maxAttempts = 5,
  cooldownMs = 60000 // 1 minuto
}) => {
  const [attemptCount, setAttemptCount] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [cooldownEnd, setCooldownEnd] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const { user } = useAuth();

  // Countdown timer
  useEffect(() => {
    if (cooldownEnd) {
      const timer = setInterval(() => {
        const remaining = Math.max(0, cooldownEnd - Date.now());
        setTimeLeft(Math.ceil(remaining / 1000));
        
        if (remaining <= 0) {
          setIsBlocked(false);
          setCooldownEnd(null);
          setAttemptCount(0);
          clearInterval(timer);
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [cooldownEnd]);

  const handleSecureSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Verificar si está bloqueado
    if (isBlocked) {
      return;
    }

    // Verificar rate limiting solo para usuarios autenticados
    if (user) {
      if (!securityManager.checkRateLimit(user.id, 'form_submit', 10, 60000)) {
        setIsBlocked(true);
        setCooldownEnd(Date.now() + cooldownMs);
        return;
      }
    }

    // Incrementar contador de intentos
    const newAttemptCount = attemptCount + 1;
    setAttemptCount(newAttemptCount);

    // Verificar límite de intentos
    if (newAttemptCount > maxAttempts) {
      setIsBlocked(true);
      setCooldownEnd(Date.now() + cooldownMs);
      return;
    }

    // Proceder con el submit
    onSubmit(e);
  };

  return (
    <form onSubmit={handleSecureSubmit} className={`relative ${className}`}>
      {isBlocked && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10 rounded-lg">
          <div className="bg-white p-4 rounded-lg text-center">
            <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900 mb-1">
              Formulario bloqueado temporalmente
            </p>
            <p className="text-xs text-gray-600">
              Espera {timeLeft} segundos antes de intentar nuevamente
            </p>
          </div>
        </div>
      )}
      
      <div className={isBlocked ? 'pointer-events-none opacity-50' : ''}>
        {children}
      </div>
      
      {attemptCount > 2 && !isBlocked && (
        <div className="mt-2 flex items-center space-x-2 text-yellow-600">
          <Shield className="h-4 w-4" />
          <span className="text-xs">
            Intentos: {attemptCount}/{maxAttempts}
          </span>
        </div>
      )}
    </form>
  );
};

export default SecureForm;