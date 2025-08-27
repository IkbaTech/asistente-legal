import React, { useState, useEffect } from 'react';
import { Settings, Key, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { aiService } from '../services/aiService';

interface AIConfigurationProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
}

const AIConfiguration: React.FC<AIConfigurationProps> = ({ isOpen, onClose, isDarkMode }) => {
  const [provider, setProvider] = useState('openai');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('gpt-4');
  const [isConfigured, setIsConfigured] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  useEffect(() => {
    // La IA está configurada a través del backend Node.js
    setIsConfigured(true);
    setProvider('openai');
    setModel('gpt-4');
    setApiKey('***CONFIGURADO EN BACKEND NODE.JS - MÁXIMA VELOCIDAD***');
  }, []);

  const handleSave = async () => {
    alert('✅ La configuración está optimizada para máxima velocidad. La API key está protegida en el backend Node.js.');
  };

  const testConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      // Probar conexión con el backend
      const backendUrl = process.env.NODE_ENV === 'production' 
        ? 'https://asistente-legal.onrender.com'
        : 'http://localhost:3001';
      
      const response = await fetch(`${backendUrl}/health`);
      
      if (!response.ok) {
        throw new Error('Backend no disponible');
      }
      
      const healthData = await response.json();
      
      if (!healthData.openai_configured) {
        throw new Error('OpenAI no configurado en el backend');
      }
      
      // Probar una llamada real a la IA
      await aiService.sendMessage([
        { role: 'user', content: 'Hola, esto es una prueba de conexión.' }
      ]);

      console.log('✅ Backend en Render y OpenAI funcionando correctamente');
      setTestResult('success');
    } catch (error) {
      console.error('Test failed:', error);
      setTestResult('error');
    } finally {
      setIsTesting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className={`max-w-lg w-full rounded-lg shadow-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Settings className="h-6 w-6 text-blue-600" />
              <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Configuración de IA
              </h2>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${
                isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
              }`}
            >
              ×
            </button>
          </div>

          {!isConfigured && (
            <div className={`mb-4 p-3 rounded-lg ${isDarkMode ? 'bg-yellow-900/20 border border-yellow-800' : 'bg-yellow-50 border border-yellow-200'}`}>
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <p className={`text-sm ${isDarkMode ? 'text-yellow-400' : 'text-yellow-800'}`}>
                  La IA se configura de forma segura via Edge Functions de Supabase
                </p>
              </div>
            </div>
          )}

          {isConfigured && (
            <div className={`mb-4 p-3 rounded-lg ${isDarkMode ? 'bg-green-900/20 border border-green-800' : 'bg-green-50 border border-green-200'}`}>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <p className={`text-sm ${isDarkMode ? 'text-green-400' : 'text-green-800'}`}>
                  ✅ IA configurada de forma segura via backend Node.js
                </p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Proveedor de IA
              </label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="openai">OpenAI (GPT-4, GPT-3.5)</option>
                <option value="anthropic">Anthropic (Claude)</option>
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Modelo
              </label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                {provider === 'openai' ? (
                  <>
                    <option value="gpt-4">GPT-4 (Recomendado)</option>
                    <option value="gpt-4-turbo">GPT-4 Turbo</option>
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                  </>
                ) : (
                  <>
                    <option value="claude-3-sonnet-20240229">Claude 3 Sonnet</option>
                    <option value="claude-3-opus-20240229">Claude 3 Opus</option>
                    <option value="claude-3-haiku-20240307">Claude 3 Haiku</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                API Key
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Configurado en backend Node.js (seguro)"
                  disabled={true}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  } opacity-50 cursor-not-allowed`}
                />
              </div>
              <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                API key configurada de forma segura en el backend Node.js
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={testConnection}
                disabled={isTesting || !isConfigured}
                className={`flex-1 px-4 py-2 border rounded-lg transition-colors ${
                  isDarkMode
                    ? 'border-gray-600 hover:bg-gray-700 text-gray-300'
                    : 'border-gray-300 hover:bg-gray-50 text-gray-700'
                } disabled:opacity-50`}
              >
                {isTesting ? 'Probando...' : 'Probar Conexión'}
              </button>

              <button
                onClick={handleSave}
                disabled={true}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>Configurado Seguro</span>
              </button>
            </div>

            {testResult && (
              <div className={`p-3 rounded-lg ${
                testResult === 'success' 
                  ? isDarkMode ? 'bg-green-900/20 border border-green-800' : 'bg-green-50 border border-green-200'
                  : isDarkMode ? 'bg-red-900/20 border border-red-800' : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-center space-x-2">
                  {testResult === 'success' ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                  <p className={`text-sm ${
                    testResult === 'success' 
                      ? isDarkMode ? 'text-green-400' : 'text-green-800'
                      : isDarkMode ? 'text-red-400' : 'text-red-800'
                  }`}>
                    {testResult === 'success' 
                      ? '¡Conexión exitosa! La IA está lista para usar.'
                      : 'Error de conexión. Verifica tu API key.'
                    }
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className={`mt-6 p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <h3 className={`font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Estado de la configuración:
            </h3>
            <div className={`text-sm space-y-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              <p>🔒 <strong>Seguridad:</strong> La API key de OpenAI está protegida en el backend Node.js.</p>
              <p>📡 <strong>Servidor:</strong> Todas las llamadas pasan por tu servidor Node.js local.</p>
              <p>✅ <strong>Estado:</strong> Sistema listo para usar.</p>
              <p>🔧 <strong>Configuración:</strong> Administrada en el archivo .env del backend.</p>
              <p>🚀 <strong>Velocidad:</strong> Optimizada para mínima latencia.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIConfiguration;