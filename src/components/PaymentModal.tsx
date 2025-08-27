import React, { useState } from 'react';
import { X, CreditCard, Check, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { logger } from '../utils/logger';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, isDarkMode }) => {
  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'professional' | 'advanced' | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const { user, profile, session, isAuthenticated } = useAuth();
  
  // Información de los planes
  const plansInfo = {
    basic: {
      name: 'Plan Estudiante',
      price: 44.80,
      features: [
        'Hasta 100 consultas por mes',
        'Análisis de casos y documentos',
        'Explicación de leyes y artículos',
        'Ayuda con tareas y ensayos',
        'Historial de estudio (30 días)',
        'Soporte estudiantil por email'
      ]
    },
    professional: {
      name: 'Plan Abogado',
      price: 78.40,
      features: [
        'Hasta 400 consultas por mes',
        'Análisis completo de documentos',
        'Redacción de documentos legales',
        'Análisis comparativo',
        'Jurisprudencia actualizada',
        'Historial de chats (6 meses)',
        'Soporte profesional prioritario'
      ]
    },
    advanced: {
      name: 'Plan Bufete',
      price: 134.40,
      features: [
        'Consultas ilimitadas',
        'Análisis ilimitado de documentos',
        'Plantillas legales personalizables',
        'Análisis comparativo avanzado',
        'IA especializada en casos complejos',
        'Historial ilimitado',
        'Soporte 24/7 para bufetes',
        'API para integración con sistemas'
      ]
    }
  };

  const handlePlanSelect = (planType: 'basic' | 'professional' | 'advanced') => {
    setSelectedPlan(planType);
    setError(null);
  };

  // Cargar script de PayPal cuando se abre el modal
  React.useEffect(() => {
    if (isOpen && !document.getElementById('paypal-sdk')) {
      console.log('🔄 Cargando SDK de PayPal...');
      const script = document.createElement('script');
      script.id = 'paypal-sdk';
      script.src = 'https://www.paypal.com/sdk/js?client-id=BAAzklRmj4zhXryauLbwgyHY9Qvs374MMGM76kW1_cG0VRF984Uamk0aS-gG9384WeE7LHZ5meV1YxY42o&components=hosted-buttons&disable-funding=venmo&currency=USD';
      script.async = true;
      script.onload = () => {
        // Script cargado, ahora podemos renderizar los botones
        console.log('✅ PayPal SDK cargado exitosamente');
      };
      script.onerror = () => {
        console.error('❌ Error cargando PayPal SDK');
      };
      document.head.appendChild(script);
    } else if (isOpen && document.getElementById('paypal-sdk')) {
      console.log('✅ PayPal SDK ya está cargado');
    }
  }, [isOpen]);

  // Renderizar botón de PayPal cuando se selecciona el plan básico
  React.useEffect(() => {
    if (selectedPlan === 'basic' && isAuthenticated && window.paypal) {
      console.log('🔄 Renderizando botón PayPal para plan básico...');
      const container = document.getElementById('paypal-container-V66M9RLFRVSL8');
      if (container && !container.hasChildNodes()) {
        try {
          window.paypal.HostedButtons({
            hostedButtonId: "V66M9RLFRVSL8",
          }).render("#paypal-container-V66M9RLFRVSL8").then(() => {
            console.log('✅ Botón PayPal básico renderizado');
          }).catch((error: any) => {
            console.error('❌ Error renderizando botón PayPal básico:', error);
          });
        } catch (error) {
          console.error('❌ Error al crear botón PayPal básico:', error);
        }
      } else if (container && container.hasChildNodes()) {
        console.log('✅ Botón PayPal básico ya renderizado');
      }
    } else if (selectedPlan === 'basic' && isAuthenticated && !window.paypal) {
      console.log('⏳ Esperando que PayPal SDK se cargue...');
    }
  }, [selectedPlan, isAuthenticated]);

  // Renderizar botón de PayPal cuando se selecciona el plan profesional
  React.useEffect(() => {
    if (selectedPlan === 'professional' && isAuthenticated && window.paypal) {
      console.log('🔄 Renderizando botón PayPal para plan profesional...');
      const container = document.getElementById('paypal-container-JJ2HNECTLMWTG');
      if (container && !container.hasChildNodes()) {
        try {
          window.paypal.HostedButtons({
            hostedButtonId: "JJ2HNECTLMWTG",
          }).render("#paypal-container-JJ2HNECTLMWTG").then(() => {
            console.log('✅ Botón PayPal profesional renderizado');
          }).catch((error: any) => {
            console.error('❌ Error renderizando botón PayPal profesional:', error);
          });
        } catch (error) {
          console.error('❌ Error al crear botón PayPal profesional:', error);
        }
      }
    }
  }, [selectedPlan, isAuthenticated]);

  // Renderizar botón de PayPal cuando se selecciona el plan avanzado
  React.useEffect(() => {
    if (selectedPlan === 'advanced' && isAuthenticated && window.paypal) {
      console.log('🔄 Renderizando botón PayPal para plan avanzado...');
      const container = document.getElementById('paypal-container-MMAP4CWJNDYDA');
      if (container && !container.hasChildNodes()) {
        try {
          window.paypal.HostedButtons({
            hostedButtonId: "MMAP4CWJNDYDA",
          }).render("#paypal-container-MMAP4CWJNDYDA").then(() => {
            console.log('✅ Botón PayPal avanzado renderizado');
          }).catch((error: any) => {
            console.error('❌ Error renderizando botón PayPal avanzado:', error);
          });
        } catch (error) {
          console.error('❌ Error al crear botón PayPal avanzado:', error);
        }
      }
    }
  }, [selectedPlan, isAuthenticated]);

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case 'professional':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'advanced':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'basic':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className={`max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto rounded-lg shadow-xl ${
        'bg-black border border-white'
      }`}>
        <div className="p-4 sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div className="flex items-center space-x-3">
              <CreditCard className="h-6 w-6 text-blue-600" />
              <h2 className="text-lg sm:text-xl font-semibold text-white">
                Actualizar Plan de Suscripción
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg transition-colors hover:bg-white hover:text-black text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Current Plan */}
          {profile && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-lg bg-gray-900 border border-gray-700">
              <p className="text-sm text-gray-400 mb-2">
                Plan Actual
              </p>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-base sm:text-lg font-medium text-white">
                      {profile.plan === 'free' ? 'Plan Gratuito' : plansInfo[profile.plan as keyof typeof plansInfo]?.name}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full border ${getPlanBadgeColor(profile.plan)}`}>
                      {profile.plan}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Authentication Warning */}
          {!isAuthenticated && (
            <div className="mb-4 p-3 rounded-lg bg-yellow-900/20 border border-yellow-800">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <p className="text-sm text-yellow-400">
                  Debes iniciar sesión para realizar un pago
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-900/20 border border-red-800">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <p className="text-sm text-red-400">
                  {error}
                </p>
              </div>
            </div>
          )}

          {/* Plans Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
            {Object.entries(plansInfo).map(([planKey, planInfo]) => {
              const isSelected = selectedPlan === planKey;
              const isCurrent = profile?.plan === planKey;
              
              return (
                <div
                  key={planKey}
                  className={`relative p-4 sm:p-6 rounded-lg border-2 cursor-pointer transition-all mb-2 group card-premium ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-white bg-black hover:border-gray-300'
                  } ${isCurrent ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => !isCurrent && handlePlanSelect(planKey as any)}
                >
                  {isCurrent && (
                    <div className="absolute top-3 right-3">
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                        Actual
                      </span>
                    </div>
                  )}
                  
                  <div className="text-center mb-4">
                    <h3 className="text-base sm:text-lg font-semibold mb-2 text-white">
                      {planInfo.name}
                    </h3>
                    <div className="text-2xl sm:text-3xl font-bold text-blue-600 mb-1">
                      ${planInfo.price}
                    </div>
                    <p className="text-sm text-gray-400">
                      por mes
                    </p>
                  </div>

                  <ul className="space-y-1 sm:space-y-2 mb-4">
                    {planInfo.features.map((feature, index) => (
                      <li key={index} className="flex items-center space-x-2">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="text-xs sm:text-sm text-gray-300">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* PayPal Button Container - Solo para plan básico */}
                  {isSelected && !isCurrent && isAuthenticated && planKey === 'basic' && (
                    <div className="mt-4 min-h-[50px]">
                      <div id="paypal-container-V66M9RLFRVSL8"></div>
                    </div>
                  )}

                  {/* PayPal Button Container - Solo para plan profesional */}
                  {isSelected && !isCurrent && isAuthenticated && planKey === 'professional' && (
                    <div className="mt-4 min-h-[50px]">
                      <div id="paypal-container-JJ2HNECTLMWTG"></div>
                    </div>
                  )}

                  {/* PayPal Button Container - Solo para plan avanzado */}
                  {isSelected && !isCurrent && isAuthenticated && planKey === 'advanced' && (
                    <div className="mt-4 min-h-[50px]">
                      <div id="paypal-container-MMAP4CWJNDYDA"></div>
                    </div>
                  )}

                  {isSelected && !isCurrent && (
                    <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none">
                      <div className="absolute top-3 right-3">
                        <div className="bg-blue-500 text-white rounded-full p-1">
                          <Check className="h-3 w-3" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Payment Button */}
          <div className="flex flex-col sm:flex-row justify-between items-center mt-4 sm:mt-6 space-y-2 sm:space-y-0">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-2 rounded-lg transition-colors bg-gray-700 text-gray-300 hover:bg-gray-600"
            >
              Cancelar
            </button>
          </div>

          {/* PayPal Info */}
          <div className="mt-4 sm:mt-6 p-3 sm:p-4 rounded-lg bg-gray-900 border border-gray-700">
            <p className="text-xs text-gray-400">
              🔒 Pago seguro procesado por PayPal. Selecciona cualquier plan para proceder con el pago.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Declarar PayPal en el objeto window para TypeScript
declare global {
  interface Window {
    paypal: any;
  }
}

export default PaymentModal;