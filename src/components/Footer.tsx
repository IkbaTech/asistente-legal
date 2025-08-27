import React, { useState } from 'react';
import { Brain, Shield, FileText, Mail, ExternalLink } from 'lucide-react';
import LegalModal from './LegalModal';

interface FooterProps {
  isDarkMode: boolean;
}

const Footer: React.FC<FooterProps> = ({ isDarkMode }) => {
  const [legalModal, setLegalModal] = useState<'terms' | 'privacy' | 'disclaimer' | null>(null);

  return (
    <>
      <footer className={`border-t ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} mt-auto animate-slideInFromRight`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Información principal */}
          <div className="text-center mb-6">
            <h3 className={`text-lg font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              IkbaTech
            </h3>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Asistente de IA legal para estudiantes de derecho y abogados. Herramienta educativa y de apoyo profesional.
            </p>
          </div>

          {/* Enlaces legales y contacto - Compacto */}
          <div className="text-center space-y-2">
            {/* Línea 1: Enlaces legales */}
            <div className="flex flex-wrap justify-center items-center space-x-6">
              <button
                onClick={() => setLegalModal('terms')}
                className={`text-sm transition-colors ${
                  isDarkMode 
                    ? 'text-gray-400 hover:text-gray-300' 
                    : 'text-gray-600 hover:text-gray-500'
                }`}
              >
                Términos de Servicio
              </button>
              <span className={`text-sm ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}>•</span>
              <button
                onClick={() => setLegalModal('privacy')}
                className={`text-sm transition-colors ${
                  isDarkMode 
                    ? 'text-gray-400 hover:text-gray-300' 
                    : 'text-gray-600 hover:text-gray-500'
                }`}
              >
                Política de Privacidad
              </button>
              <span className={`text-sm ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}>•</span>
              <button
                onClick={() => setLegalModal('disclaimer')}
                className={`text-sm transition-colors ${
                  isDarkMode 
                    ? 'text-gray-400 hover:text-gray-300' 
                    : 'text-gray-600 hover:text-gray-500'
                }`}
              >
                Aviso Legal
              </button>
            </div>

            {/* Línea 2: Contacto */}
            <div className="flex justify-center items-center space-x-4">
              <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Contacto:
              </span>
              <a
                href="mailto:ikbatech@gmail.com"
                className={`text-sm transition-colors ${
                  isDarkMode 
                    ? 'text-gray-400 hover:text-gray-300' 
                    : 'text-gray-600 hover:text-gray-500'
                }`}
              >
                ikbatech@gmail.com
              </a>
            </div>
          </div>

          {/* Aviso importante */}
          <div className={`mt-6 pt-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className={`p-3 rounded-lg text-center ${isDarkMode ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
              <p className={`text-xs ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                Herramienta educativa y de apoyo. Para casos específicos, consulta siempre con un abogado profesional.
              </p>
            </div>
          </div>

          {/* Copyright */}
          <div className={`mt-4 pt-4 text-center`}>
            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              © {new Date().getFullYear()} IkbaTech. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>

      {/* Modal legal */}
      {legalModal && (
        <LegalModal
          isOpen={true}
          onClose={() => setLegalModal(null)}
          isDarkMode={isDarkMode}
          type={legalModal}
          onTypeChange={setLegalModal}
        />
      )}
    </>
  );
};

export default Footer;