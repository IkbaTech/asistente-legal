import React, { useEffect, useState } from 'react';
import { CheckCircle, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { logger } from '../utils/logger';

interface PaymentSuccessProps {
  isDarkMode: boolean;
}

const PaymentSuccess: React.FC<PaymentSuccessProps> = ({ isDarkMode }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const { user, profile } = useAuth();

  useEffect(() => {
    // Simular éxito del pago - en una implementación real, 
    // aquí verificarías el estado del pago con PayPal
    const urlParams = new URLSearchParams(window.location.search);
    const paymentId = urlParams.get('payment_id');
    const payerId = urlParams.get('PayerID');
    
    if (paymentId && payerId) {
      setPaymentDetails({
        paymentId,
        payerId,
        status: 'COMPLETED'
      });
      logger.info('Payment success page loaded', 'PaymentSuccess', { paymentId, payerId });
    } else {
      setError('No se encontró información de pago válida');
    }
  }, []);

  const handleContinue = () => {
    // Redirigir a la aplicación principal
    window.location.href = '/';
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${
      'bg-black'
    }`}>
      <div className="max-w-md w-full rounded-lg shadow-xl p-8 text-center bg-black border border-white">
        {isProcessing ? (
          <>
            <div className="flex justify-center mb-6">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold mb-3 text-white">
              Procesando tu pago...
            </h2>
            <p className="text-sm text-gray-400">
              Por favor espera mientras confirmamos tu pago con PayPal.
            </p>
          </>
        ) : error ? (
          <>
            <div className="flex justify-center mb-6">
              <AlertCircle className="h-12 w-12 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold mb-3 text-white">
              Error en el pago
            </h2>
            <p className="text-sm mb-6 text-gray-400">
              {error}
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className="bg-white text-black px-6 py-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Volver a la aplicación
            </button>
          </>
        ) : (
          <>
            <div className="flex justify-center mb-6">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold mb-3 text-white">
              ¡Pago exitoso!
            </h2>
            <p className="text-sm mb-6 text-gray-400">
              Tu pago ha sido procesado exitosamente. Tu suscripción está ahora activa.
            </p>

            {paymentDetails && (
              <div className="mb-6 p-4 rounded-lg bg-gray-900 border border-gray-700">
                <div className="text-left space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-400">
                      ID de Pago:
                    </span>
                    <span className="text-sm font-mono text-white">
                      {paymentDetails.paymentId}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-400">
                      Estado:
                    </span>
                    <span className="text-sm font-medium text-green-600">
                      Completado
                    </span>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleContinue}
              className="bg-white text-black px-6 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2 mx-auto"
            >
              <span>Continuar a IkbaTech</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccess;