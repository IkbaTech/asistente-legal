import React, { useState } from 'react';
import { X, Mail, Lock, User, Brain, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import SecureForm from './SecureForm';
import { useSecureInput } from '../hooks/useSecureInput';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, isDarkMode }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const { signUp, signIn, resetPassword, error, clearError } = useAuth();

  // Inputs seguros
  const emailInput = useSecureInput({ 
    type: 'email', 
    maxLength: 100
  });
  
  const passwordInput = useSecureInput({ 
    type: 'general', 
    maxLength: 100
  });
  
  const nameInput = useSecureInput({ 
    type: 'name', 
    maxLength: 100
  });
  
  const confirmPasswordInput = useSecureInput({ 
    type: 'general', 
    maxLength: 100
  });
  
  const validateForm = () => {
    const errors: Record<string, string> = {};

    // Validación de email solo al enviar
    if (!emailInput.value.trim()) {
      errors.email = 'El email es requerido';
    } else {
      const email = emailInput.value.trim();
      // Validación básica de email solo al enviar
      if (!email.includes('@') || !email.includes('.') || email.length < 5) {
        errors.email = 'El email debe tener un formato válido (ejemplo@dominio.com)';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.email = 'El email no es válido';
      }
    }

    if (!showForgotPassword) {
      if (!passwordInput.value.trim()) {
        errors.password = 'La contraseña es requerida';
      } else if (passwordInput.value.trim().length < 6) {
        errors.password = 'La contraseña debe tener al menos 6 caracteres';
      }

      if (isRegistering) {
        if (!nameInput.value.trim()) {
          errors.fullName = 'El nombre es requerido';
        } else if (nameInput.value.trim().length < 2) {
          errors.fullName = 'El nombre debe tener al menos 2 caracteres';
        }

        if (passwordInput.value.trim() !== confirmPasswordInput.value.trim()) {
          errors.confirmPassword = 'Las contraseñas no coinciden';
        }
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    clearError();
    setSuccessMessage('');

    try {
      if (showForgotPassword) {
        await resetPassword(emailInput.value.trim());
        setSuccessMessage('Se ha enviado un email de recuperación a tu correo.');
      } else if (isRegistering) {
        await signUp(emailInput.value.trim(), passwordInput.value.trim(), nameInput.value.trim());
        setSuccessMessage('Cuenta creada exitosamente.');
      } else {
        const result = await signIn(emailInput.value.trim(), passwordInput.value.trim());
        if (result) {
          console.log('Login successful, closing modal');
          onClose();
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      // El error ya se maneja en useAuth, no necesitamos hacer nada aquí
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    emailInput.clear();
    passwordInput.clear();
    nameInput.clear();
    confirmPasswordInput.clear();
    setFormErrors({});
    setSuccessMessage('');
    clearError();
  };

  const switchMode = (mode: 'login' | 'register' | 'forgot') => {
    resetForm();
    setIsRegistering(mode === 'register');
    setShowForgotPassword(mode === 'forgot');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className={`max-w-md w-full max-h-[95vh] overflow-y-auto rounded-lg shadow-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="max-w-md w-full rounded-lg shadow-xl bg-black border border-white">
          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <h2 className="text-base sm:text-lg font-semibold text-white">
                  {showForgotPassword 
                    ? 'Recuperar Contraseña'
                    : isRegistering 
                    ? 'Crear Cuenta' 
                    : 'Iniciar Sesión'
                  }
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg transition-colors hover:bg-white hover:text-black text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-900/20 border border-red-800">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <p className="text-sm text-red-400">
                    {typeof error === 'string' ? error : 'Ha ocurrido un error. Por favor intenta nuevamente.'}
                  </p>
                </div>
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="mb-4 p-3 rounded-lg bg-green-900/20 border border-green-800">
                <p className="text-sm text-green-400">
                  {successMessage}
                </p>
              </div>
            )}

            <SecureForm onSubmit={handleSubmit} className="space-y-4" maxAttempts={3}>
              {/* Full Name - Solo para registro */}
              {isRegistering && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-white">
                    Nombre Completo
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={nameInput.value}
                      onChange={nameInput.handleChange}
                      className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-white ${
                        formErrors.fullName || nameInput.error ? 'border-red-500' : ''
                      } bg-black border-white text-white placeholder-gray-400`}
                      placeholder="Ingresa tu nombre completo"
                      disabled={isSubmitting}
                    />
                  </div>
                  {(formErrors.fullName || nameInput.error) && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.fullName || nameInput.error}</p>
                  )}
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block text-sm font-medium mb-2 text-white">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    value={emailInput.value}
                    onChange={emailInput.handleChange}
                    className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-white ${
                      formErrors.email || emailInput.error ? 'border-red-500' : ''
                    } bg-black border-white text-white placeholder-gray-400`}
                    placeholder="nombre@ejemplo.com"
                    disabled={isSubmitting}
                    required
                  />
                </div>
                {(formErrors.email || emailInput.error) && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.email || emailInput.error}</p>
                )}
              </div>

              {/* Password - No mostrar en forgot password */}
              {!showForgotPassword && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-white">
                    Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type="password"
                      value={passwordInput.value}
                      onChange={passwordInput.handleChange}
                      className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-white ${
                        formErrors.password || passwordInput.error ? 'border-red-500' : ''
                      } bg-black border-white text-white placeholder-gray-400`}
                      placeholder="Ingresa tu contraseña"
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                  {(formErrors.password || passwordInput.error) && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.password || passwordInput.error}</p>
                  )}
                </div>
              )}

              {/* Confirm Password - Solo para registro */}
              {isRegistering && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-white">
                    Confirmar Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type="password"
                      value={confirmPasswordInput.value}
                      onChange={confirmPasswordInput.handleChange}
                      className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-white ${
                        formErrors.confirmPassword || confirmPasswordInput.error ? 'border-red-500' : ''
                      } bg-black border-white text-white placeholder-gray-400`}
                      placeholder="Confirma tu contraseña"
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                  {(formErrors.confirmPassword || confirmPasswordInput.error) && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.confirmPassword || confirmPasswordInput.error}</p>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-white text-black py-3 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center space-x-2 text-base"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>
                  {isSubmitting 
                    ? 'Procesando...' 
                    : showForgotPassword 
                    ? 'Enviar Email de Recuperación'
                    : isRegistering 
                    ? 'Crear Cuenta' 
                    : 'Iniciar Sesión'
                  }
                </span>
              </button>
            </SecureForm>

            {/* Navigation Links */}
            <div className="mt-4 text-center space-y-3">
              {!showForgotPassword && (
                <button
                  onClick={() => switchMode(isRegistering ? 'login' : 'register')}
                  className="text-sm text-gray-400 hover:text-white block w-full py-2"
                >
                  {isRegistering ? '¿Ya tienes cuenta? Iniciar sesión' : '¿No tienes cuenta? Registrarse'}
                </button>
              )}
              
              {!isRegistering && (
                <div>
                  <button
                    onClick={() => switchMode(showForgotPassword ? 'login' : 'forgot')}
                    className="text-sm text-gray-400 hover:text-white block w-full py-2"
                  >
                    {showForgotPassword ? 'Volver al acceso' : '¿Olvidaste tu contraseña?'}
                  </button>
                </div>
              )}
            </div>

            <div className="mt-4 p-3 rounded-lg bg-gray-900 border border-gray-700">
              <p className="text-xs text-gray-400">
                {isRegistering 
                  ? 'Tu cuenta se activará inmediatamente.' 
                  : 'Accede a tu cuenta.'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;