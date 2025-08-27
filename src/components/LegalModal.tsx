import React from 'react';
import { X, Brain, Shield, FileText } from 'lucide-react';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  type: 'terms' | 'privacy' | 'disclaimer';
  onTypeChange: (type: 'terms' | 'privacy' | 'disclaimer') => void;
}

const LegalModal: React.FC<LegalModalProps> = ({ isOpen, onClose, isDarkMode, type, onTypeChange }) => {
  if (!isOpen) return null;

  const getContent = () => {
    switch (type) {
      case 'terms':
        return {
          title: 'Términos de Servicio',
          icon: <Brain className="h-6 w-6 text-blue-600" />,
          content: (
            <div className="space-y-6">
              <section>
                <h3 className="text-lg font-semibold mb-3">1. Aceptación de los Términos</h3>
                <p className="text-sm leading-relaxed">
                  Al acceder y utilizar IkbaTech, usted acepta estar sujeto a estos Términos de Servicio. 
                  Si no está de acuerdo con alguna parte de estos términos, no debe utilizar nuestro servicio.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3">2. Descripción del Servicio</h3>
                <p className="text-sm leading-relaxed">
                  IkbaTech es una herramienta profesional de inteligencia artificial diseñada exclusivamente 
                  para abogados colegiados. Proporciona análisis jurídico, investigación jurisprudencial y 
                  asistencia en redacción de documentos legales. <strong>Es una herramienta de apoyo profesional.</strong>
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3">3. Limitaciones del Servicio</h3>
                <ul className="text-sm space-y-2 list-disc list-inside">
                  <li>Es una herramienta de apoyo que requiere criterio jurídico profesional</li>
                  <li>La responsabilidad legal final corresponde al abogado usuario</li>
                  <li>Los resultados requieren verificación y análisis profesional</li>
                  <li>La jurisprudencia debe ser validada con fuentes oficiales actualizadas</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3">4. Responsabilidades del Usuario</h3>
                <ul className="text-sm space-y-2 list-disc list-inside">
                  <li>Ejercer criterio jurídico profesional en el uso de la herramienta</li>
                  <li>Verificar jurisprudencia y normativa con fuentes oficiales</li>
                  <li>Mantener estándares éticos de la profesión legal</li>
                  <li>Mantener la confidencialidad de sus credenciales de acceso</li>
                  <li>Proteger la confidencialidad de información de clientes</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3">5. Limitación de Responsabilidad</h3>
                <p className="text-sm leading-relaxed">
                  IkbaTech no será responsable por daños directos, indirectos, incidentales o consecuentes 
                  que resulten del uso de nuestro servicio. El usuario asume toda la responsabilidad 
                  por las decisiones tomadas basándose en la información proporcionada.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3">6. Modificaciones</h3>
                <p className="text-sm leading-relaxed">
                  Nos reservamos el derecho de modificar estos términos en cualquier momento. 
                  Los cambios serán efectivos inmediatamente después de su publicación en la plataforma.
                </p>
              </section>
            </div>
          )
        };

      case 'privacy':
        return {
          title: 'Política de Privacidad',
          icon: <Brain className="h-6 w-6 text-blue-600" />,
          content: (
            <div className="space-y-6">
              <section>
                <h3 className="text-lg font-semibold mb-3">1. Información que Recopilamos</h3>
                <ul className="text-sm space-y-2 list-disc list-inside">
                  <li><strong>Información de cuenta:</strong> Email, nombre, preferencias de usuario</li>
                  <li><strong>Conversaciones:</strong> Mensajes intercambiados con la IA para mejorar el servicio</li>
                  <li><strong>Documentos:</strong> Archivos subidos para análisis (procesados y no almacenados permanentemente)</li>
                  <li><strong>Datos técnicos:</strong> Dirección IP, tipo de navegador, tiempo de uso</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3">2. Cómo Utilizamos su Información</h3>
                <ul className="text-sm space-y-2 list-disc list-inside">
                  <li>Proporcionar y mejorar nuestros servicios de IA legal</li>
                  <li>Personalizar la experiencia del usuario</li>
                  <li>Comunicarnos sobre actualizaciones del servicio</li>
                  <li>Cumplir con obligaciones legales</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3">3. Compartir Información</h3>
                <p className="text-sm leading-relaxed">
                  <strong>No vendemos ni compartimos</strong> su información personal con terceros, excepto:
                </p>
                <ul className="text-sm space-y-2 list-disc list-inside mt-2">
                  <li>Cuando sea requerido por ley</li>
                  <li>Para proteger nuestros derechos legales</li>
                  <li>Con proveedores de servicios bajo estrictos acuerdos de confidencialidad</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3">4. Seguridad de Datos</h3>
                <p className="text-sm leading-relaxed">
                  Implementamos medidas de seguridad técnicas y organizativas para proteger su información 
                  contra acceso no autorizado, alteración, divulgación o destrucción.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3">5. Sus Derechos</h3>
                <ul className="text-sm space-y-2 list-disc list-inside">
                  <li>Acceder a su información personal</li>
                  <li>Corregir datos inexactos</li>
                  <li>Solicitar la eliminación de sus datos</li>
                  <li>Retirar el consentimiento en cualquier momento</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3">6. Contacto</h3>
                <p className="text-sm leading-relaxed">
                  Para ejercer sus derechos o hacer consultas sobre privacidad, contáctenos en: 
                  <strong> ikbatech@gmail.com</strong>
                </p>
              </section>
            </div>
          )
        };

      case 'disclaimer':
        return {
          title: 'Aviso Legal y Descargo de Responsabilidad',
          icon: <Brain className="h-6 w-6 text-blue-600" />,
          content: (
            <div className="space-y-6">
              <div className={`rounded-lg p-4 mb-6 ${isDarkMode ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'}`}>
                <div className="flex items-center space-x-2 mb-2">
                  <Brain className="h-5 w-5 text-blue-600" />
                  <h4 className={`font-semibold ${isDarkMode ? 'text-blue-400' : 'text-blue-800'}`}>HERRAMIENTA PROFESIONAL</h4>
                </div>
                <p className={`text-sm ${isDarkMode ? 'text-blue-300' : 'text-blue-800'}`}>
                  IkbaTech es una herramienta de IA diseñada específicamente para abogados profesionales. 
                  Proporciona análisis jurídico, investigación y asistencia en redacción legal.
                </p>
              </div>

              <section>
                <h3 className="text-lg font-semibold mb-3">1. Naturaleza del Servicio</h3>
                <p className="text-sm leading-relaxed">
                  IkbaTech es una herramienta profesional de IA legal que:
                </p>
                <ul className="text-sm space-y-2 list-disc list-inside mt-2">
                  <li>Proporciona análisis jurídico especializado</li>
                  <li>Genera borradores profesionales de documentos legales</li>
                  <li>Analiza casos y documentos con criterio jurídico</li>
                  <li>Asiste en investigación jurisprudencial y normativa</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3">2. Limitaciones de la IA</h3>
                <ul className="text-sm space-y-2 list-disc list-inside">
                  <li>Requiere verificación de jurisprudencia actualizada</li>
                  <li>Los análisis deben complementarse con investigación adicional</li>
                  <li>Es una herramienta de apoyo al criterio jurídico profesional</li>
                  <li>La responsabilidad profesional corresponde al abogado usuario</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3">3. Recomendaciones de Uso</h3>
                <ul className="text-sm space-y-2 list-disc list-inside">
                  <li><strong>Herramienta de apoyo:</strong> Para análisis jurídico y redacción</li>
                  <li><strong>Verificación profesional:</strong> Contraste con fuentes oficiales actualizadas</li>
                  <li><strong>Criterio jurídico:</strong> Aplique su experiencia profesional</li>
                  <li><strong>Responsabilidad profesional:</strong> Mantenga estándares éticos de la profesión</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3">4. Áreas de Aplicación Profesional</h3>
                <ul className="text-sm space-y-2 list-disc list-inside">
                  <li>Análisis de procesos judiciales</li>
                  <li>Redacción de contratos y documentos legales</li>
                  <li>Estrategia procesal penal y civil</li>
                  <li>Investigación jurisprudencial</li>
                  <li>Análisis de cumplimiento normativo</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3">5. Responsabilidad Profesional</h3>
                <p className="text-sm leading-relaxed">
                  Al utilizar IkbaTech, usted reconoce y acepta que:
                </p>
                <ul className="text-sm space-y-2 list-disc list-inside mt-2">
                  <li>Mantiene la responsabilidad profesional de sus decisiones jurídicas</li>
                  <li>Verifica la información con fuentes oficiales actualizadas</li>
                  <li>Aplica su criterio jurídico profesional en todos los casos</li>
                  <li>Cumple con los estándares éticos de la profesión legal</li>
                </ul>
              </section>
            </div>
          )
        };

      default:
        return { title: '', icon: null, content: null };
    }
  };

  const { title, icon, content } = getContent();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className={`max-w-4xl w-full max-h-[90vh] rounded-lg shadow-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {title}
              </h2>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${
                isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
              }`}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {content}
              
              {/* Enlaces rápidos a otros documentos legales */}
              {type !== 'terms' && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h4 className="font-medium mb-3">Documentos Relacionados:</h4>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => onTypeChange('terms')}
                      className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                        isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      Términos de Servicio
                    </button>
                    <button
                      onClick={() => onTypeChange('privacy')}
                      className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                        isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      Política de Privacidad
                    </button>
                  </div>
                </div>
              )}
              
              {type !== 'privacy' && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h4 className="font-medium mb-3">Documentos Relacionados:</h4>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => onTypeChange('terms')}
                      className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                        isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      Términos de Servicio
                    </button>
                    <button
                      onClick={() => onTypeChange('disclaimer')}
                      className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                        isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      Aviso Legal
                    </button>
                  </div>
                </div>
              )}
              
              {type !== 'disclaimer' && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h4 className="font-medium mb-3">Documentos Relacionados:</h4>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => onTypeChange('privacy')}
                      className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                        isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      Política de Privacidad
                    </button>
                    <button
                      onClick={() => onTypeChange('disclaimer')}
                      className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                        isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      Aviso Legal
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className={`p-6 border-t ${isDarkMode ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'}`}>
            <div className="flex justify-between items-center">
              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Última actualización: {new Date().toLocaleDateString('es-ES')} | Contacto: ikbatech@gmail.com
              </p>
              <button
                onClick={onClose}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LegalModal;