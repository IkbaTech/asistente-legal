import React from 'react';
import { XCircle, ArrowLeft } from 'lucide-react';

interface PaymentCancelProps {
  isDarkMode: boolean;
}

const PaymentCancel: React.FC<PaymentCancelProps> = ({ isDarkMode }) => {
  const handleGoBack = () => {
    window.location.href = '/';
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${
      'bg-black'
    }`}>
      <div className="max-w-md w-full rounded-lg shadow-xl p-8 text-center bg-black border border-white">
        <div className="flex justify-center mb-6">
          <XCircle className="h-12 w-12 text-orange-600" />
        </div>
        
        <h2 className="text-xl font-semibold mb-3 text-white">
          Pago cancelado
        </h2>
        
        <p className="text-sm mb-6 text-gray-400">
          Has cancelado el proceso de pago. No se ha realizado ningún cargo a tu cuenta.
          Puedes intentar nuevamente cuando estés listo.
        </p>

        <button
          onClick={handleGoBack}
          className="bg-white text-black px-6 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2 mx-auto"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Volver a IkbaTech</span>
        </button>
      </div>
    </div>
  );
};

export default PaymentCancel;