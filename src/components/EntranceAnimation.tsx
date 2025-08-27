import React, { useState, useEffect } from 'react';
import { Brain } from 'lucide-react';

interface EntranceAnimationProps {
  onAnimationComplete: () => void;
  isDarkMode: boolean;
}

const EntranceAnimation: React.FC<EntranceAnimationProps> = ({ onAnimationComplete, isDarkMode }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [animationPhase, setAnimationPhase] = useState<'initial' | 'logo' | 'text' | 'fadeOut'>('initial');

  useEffect(() => {
    const timer1 = setTimeout(() => setAnimationPhase('logo'), 300);
    const timer2 = setTimeout(() => setAnimationPhase('text'), 800);
    const timer3 = setTimeout(() => setAnimationPhase('fadeOut'), 2500);
    const timer4 = setTimeout(() => {
      setIsVisible(false);
      onAnimationComplete();
    }, 3200);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [onAnimationComplete]);

  if (!isVisible) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-1000 ${
      animationPhase === 'fadeOut' ? 'opacity-0' : 'opacity-100'
    } bg-black`}>
      
      <div className="text-center">
        {/* Logo animado */}
        <div className={`mb-6 transform transition-all duration-1000 ${
          animationPhase === 'initial' 
            ? 'scale-0 opacity-0 translate-y-10' 
            : animationPhase === 'logo' || animationPhase === 'text'
            ? 'scale-1 rotate-0 opacity-100 translate-y-0'
            : 'scale-1 opacity-0 translate-y-0'
        }`}>
          <div className="inline-flex items-center justify-center w-20 h-20 bg-black border-2 border-white rounded-full shadow-lg">
            <Brain className="h-10 w-10 text-white" />
          </div>
        </div>

        {/* Texto animado */}
        <div className={`transform transition-all duration-1000 delay-300 ${
          animationPhase === 'initial' || animationPhase === 'logo'
            ? 'translate-y-8 opacity-0'
            : animationPhase === 'text'
            ? 'translate-y-0 opacity-100'
            : 'translate-y-0 opacity-0'
        }`}>
          <h1 className="text-4xl font-bold mb-2 text-white">
            IkbaTech
          </h1>
          <p className="text-lg text-gray-300 mb-4">
            Asistente Legal Inteligente
          </p>
          
          {/* Barra de progreso simple */}
          <div className={`mt-6 w-64 h-1 mx-auto bg-gray-800 rounded-full overflow-hidden`}>
            <div className={`h-full bg-white rounded-full transition-all duration-3000 ${
              animationPhase === 'text' ? 'w-full' : 'w-0'
            }`} />
          </div>
          
          {/* Texto de carga */}
          <div className="mt-3">
            <p className="text-gray-400 text-sm">
              Cargando...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EntranceAnimation;