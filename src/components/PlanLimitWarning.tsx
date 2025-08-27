import React from 'react';
import { AlertTriangle, Crown, Zap, CreditCard } from 'lucide-react';
import { getPlanName } from '../utils/planLimits';

interface PlanLimitWarningProps {
  feature: string;
  currentPlan: string;
  message: string;
  onUpgrade: () => void;
  onClose: () => void;
  isDarkMode?: boolean;
}

const PlanLimitWarning: React.FC<PlanLimitWarningProps> = ({
  feature,
  currentPlan,
  message,
  onUpgrade,
  onClose,
  isDarkMode = false
}) => {
  const getFeatureIcon = () => {
    switch (feature) {
      case 'messages':
        return <Zap className="h-5 w-5 text-yellow-500" />;
      case 'documents':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      default:
        return <Crown className="h-5 w-5 text-purple-500" />;
    }
  };

  const getRecommendedPlan = () => {
    if (currentPlan === 'free') return 'basic';
    if (currentPlan === 'basic') return 'professional';
    return 'advanced';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="max-w-md w-full rounded-lg shadow-xl bg-black border border-white">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              {getFeatureIcon()}
              <h3 className="text-lg font-semibold text-white">
                Límite Alcanzado
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-white hover:text-black transition-colors text-white"
            >
              ×
            </button>
          </div>

          {/* Current Plan */}
          <div className="mb-4 p-3 rounded-lg bg-gray-900 border border-gray-700">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Plan Actual:</span>
              <span className="text-sm font-medium text-white">
                {getPlanName(currentPlan)}
              </span>
            </div>
          </div>

          {/* Message */}
          <div className="mb-6">
            <p className="text-sm text-gray-300 leading-relaxed">
              {message}
            </p>
          </div>

          {/* Recommended Plan */}
          <div className="mb-6 p-4 rounded-lg bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-800">
            <div className="flex items-center space-x-2 mb-2">
              <Crown className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium text-white">
                Plan Recomendado: {getPlanName(getRecommendedPlan())}
              </span>
            </div>
            <p className="text-xs text-blue-300">
              Desbloquea todas las funciones y aumenta tus límites.
            </p>
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-600 text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
            >
              Continuar con {getPlanName(currentPlan)}
            </button>
            <button
              onClick={onUpgrade}
              className="flex-1 bg-white text-black px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
            >
              <CreditCard className="h-4 w-4" />
              <span>Actualizar Plan</span>
            </button>
          </div>

          {/* Footer */}
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-400">
              Actualiza tu plan en cualquier momento desde tu perfil
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanLimitWarning;