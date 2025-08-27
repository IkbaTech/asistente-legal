import React from 'react';
import { FileText, Shield, AlertTriangle, FileCheck } from 'lucide-react';
import { usePlanLimits } from '../hooks/usePlanLimits';

interface QuickActionsProps {
  onActionClick: (action: string) => void;
  isDarkMode: boolean;
}

const QuickActions: React.FC<QuickActionsProps> = ({ onActionClick, isDarkMode }) => {
  const quickActions = [
    {
      id: 'estudiar-caso',
      title: 'Estudiar Caso Jurídico',
      description: 'Análisis detallado de casos para estudio',
      icon: Shield,
      prompt: 'Ayúdame a estudiar un caso jurídico. Explícame paso a paso cómo analizar un caso legal, qué elementos debo identificar y cómo estructurar mi análisis para mis estudios de derecho.'
    },
    {
      id: 'explicar-ley',
      title: 'Explicar Leyes y Artículos',
      description: 'Explicación clara de normativa legal',
      icon: AlertTriangle,
      prompt: 'Necesito que me expliques una ley o artículo legal de manera clara y comprensible. ¿Podrías ayudarme a entender conceptos jurídicos complejos con ejemplos prácticos?'
    },
    {
      id: 'redactar-documento',
      title: 'Redactar Documento Legal',
      description: 'Asistencia en redacción jurídica',
      icon: FileText,
      prompt: 'Necesito ayuda para redactar un documento legal. ¿Podrías guiarme en la estructura, elementos esenciales y mejores prácticas para la redacción jurídica profesional?'
    },
    {
      id: 'resolver-dudas',
      title: 'Resolver Dudas Jurídicas',
      description: 'Respuestas a consultas legales específicas',
      icon: FileCheck,
      prompt: 'Tengo algunas dudas sobre temas jurídicos específicos. ¿Podrías ayudarme a resolver preguntas sobre derecho, procedimientos legales o conceptos que no tengo claros?'
    }
  ];

  const handleActionClick = (action: typeof quickActions[0]) => {
    // Enviar el prompt predefinido al chat
    onActionClick(action.prompt);
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {quickActions.map((action, index) => {
        const IconComponent = action.icon;
        
        return (
          <button
            key={action.id}
            onClick={() => handleActionClick(action)}
            className={`grid-item p-4 rounded-2xl text-left border transition-all duration-300 group relative ${
              'bg-black border-white text-white hover:bg-white hover:text-black'
            }`}
            style={{ animationDelay: `${0.7 + index * 0.1}s` }}
            title={`Hacer clic para: ${action.description}`}
          >
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2 rounded-xl border border-white transition-all duration-300 group-hover:bg-black group-hover:border-white">
                <IconComponent className="h-4 w-4 text-white group-hover:text-white" />
              </div>
              <div className="flex-1">
                <span className="text-sm font-medium">{action.title}</span>
              </div>
            </div>
            <p className="text-xs opacity-75 transition-all duration-300 text-gray-300 group-hover:text-gray-600 group-hover:opacity-100">
              {action.description}
            </p>
          </button>
        );
      })}
    </div>
  );
};

export default QuickActions;