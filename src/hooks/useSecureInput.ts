import { useState, useCallback } from 'react';
import { securityManager } from '../utils/security';

export interface UseSecureInputOptions {
  maxLength?: number;
  required?: boolean;
  pattern?: RegExp;
  sanitize?: boolean;
}

export interface UseSecureInputReturn {
  value: string;
  setValue: (value: string) => void;
  error: string | null;
  isValid: boolean;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  validate: () => boolean;
  clear: () => void;
}

export function useSecureInput(
  initialValue: string = '',
  options: UseSecureInputOptions = {}
): UseSecureInputReturn {
  const {
    maxLength = 1000,
    required = false,
    pattern,
    sanitize = true
  } = options;

  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);

  const validate = useCallback((): boolean => {
    try {
      // Check if required field is empty
      if (required && !value.trim()) {
        setError('Este campo es requerido');
        return false;
      }

      // Validate using security manager
      const validation = securityManager.validateInput(value, maxLength);
      if (!validation.isValid) {
        setError(validation.error || 'Entrada inválida');
        return false;
      }

      // Check pattern if provided
      if (pattern && value && !pattern.test(value)) {
        setError('Formato inválido');
        return false;
      }

      setError(null);
      return true;
    } catch (err) {
      setError('Error de validación');
      return false;
    }
  }, [value, maxLength, required, pattern]);

  const handleChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    let newValue = e.target.value;
    
    // Sanitize input if enabled
    if (sanitize) {
      newValue = securityManager.sanitizeInput(newValue);
    }
    
    setValue(newValue);
    
    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
  }, [sanitize, error]);

  const clear = useCallback(() => {
    setValue('');
    setError(null);
  }, []);

  const isValid = !error && (required ? value.trim().length > 0 : true);

  return {
    value,
    setValue,
    error,
    isValid,
    handleChange,
    validate,
    clear
  };
}