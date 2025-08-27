import React, { useState } from 'react';
import { GitCompare, FileText, X, Upload } from 'lucide-react';

interface ComparativeAnalysisFormProps {
  onSubmit: (entity1: string, entity2: string, type: 'document' | 'scenario', entity1Name?: string, entity2Name?: string) => void;
  onCancel: () => void;
  isDarkMode: boolean;
}

const ComparativeAnalysisForm: React.FC<ComparativeAnalysisFormProps> = ({ 
  onSubmit, 
  onCancel, 
  isDarkMode 
}) => {
  const [analysisType, setAnalysisType] = useState<'document' | 'scenario'>('scenario');
  const [entity1, setEntity1] = useState('');
  const [entity2, setEntity2] = useState('');
  const [entity1Name, setEntity1Name] = useState('');
  const [entity2Name, setEntity2Name] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (entity1.trim() && entity2.trim()) {
      onSubmit(
        entity1.trim(), 
        entity2.trim(), 
        analysisType,
        entity1Name.trim() || undefined,
        entity2Name.trim() || undefined
      );
    }
  };

  const handleFileUpload = (file: File, entityNumber: 1 | 2) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (entityNumber === 1) {
        setEntity1(content);
        setEntity1Name(file.name);
      } else {
        setEntity2(content);
        setEntity2Name(file.name);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className={`mb-4 p-4 rounded-lg border ${
      isDarkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-white'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <GitCompare className="h-5 w-5 text-blue-600" />
          <h3 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Análisis Comparativo
          </h3>
        </div>
        <button
          onClick={onCancel}
          className={`p-1 rounded hover:bg-gray-200 transition-colors ${
            isDarkMode ? 'text-gray-400 hover:bg-gray-600' : 'text-gray-500'
          }`}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Tipo de análisis */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Tipo de Análisis
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="scenario"
                checked={analysisType === 'scenario'}
                onChange={(e) => setAnalysisType(e.target.value as 'scenario')}
                className="mr-2"
              />
              <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Escenarios Jurídicos
              </span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="document"
                checked={analysisType === 'document'}
                onChange={(e) => setAnalysisType(e.target.value as 'document')}
                className="mr-2"
              />
              <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Documentos Legales
              </span>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Entidad 1 */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {analysisType === 'document' ? 'Documento 1' : 'Escenario 1'}
            </label>
            
            {analysisType === 'document' && (
              <div className="mb-2">
                <input
                  type="text"
                  value={entity1Name}
                  onChange={(e) => setEntity1Name(e.target.value)}
                  placeholder="Nombre del documento (opcional)"
                  className={`w-full px-3 py-2 text-sm rounded border ${
                    isDarkMode
                      ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                />
              </div>
            )}

            <div className="relative">
              <textarea
                value={entity1}
                onChange={(e) => setEntity1(e.target.value)}
                placeholder={analysisType === 'document' 
                  ? 'Contenido del documento o descripción...' 
                  : 'Describe el primer escenario jurídico...'
                }
                className={`w-full px-3 py-2 rounded border resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isDarkMode
                    ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
                rows={4}
                required
              />
              
              {analysisType === 'document' && (
                <div className="absolute bottom-2 right-2">
                  <label className={`cursor-pointer p-1 rounded hover:bg-gray-200 transition-colors ${
                    isDarkMode ? 'text-gray-400 hover:bg-gray-500' : 'text-gray-500'
                  }`}>
                    <Upload className="h-4 w-4" />
                    <input
                      type="file"
                      accept=".txt,.pdf,.doc,.docx"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, 1);
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Entidad 2 */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {analysisType === 'document' ? 'Documento 2' : 'Escenario 2'}
            </label>
            
            {analysisType === 'document' && (
              <div className="mb-2">
                <input
                  type="text"
                  value={entity2Name}
                  onChange={(e) => setEntity2Name(e.target.value)}
                  placeholder="Nombre del documento (opcional)"
                  className={`w-full px-3 py-2 text-sm rounded border ${
                    isDarkMode
                      ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                />
              </div>
            )}

            <div className="relative">
              <textarea
                value={entity2}
                onChange={(e) => setEntity2(e.target.value)}
                placeholder={analysisType === 'document' 
                  ? 'Contenido del documento o descripción...' 
                  : 'Describe el segundo escenario jurídico...'
                }
                className={`w-full px-3 py-2 rounded border resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isDarkMode
                    ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
                rows={4}
                required
              />
              
              {analysisType === 'document' && (
                <div className="absolute bottom-2 right-2">
                  <label className={`cursor-pointer p-1 rounded hover:bg-gray-200 transition-colors ${
                    isDarkMode ? 'text-gray-400 hover:bg-gray-500' : 'text-gray-500'
                  }`}>
                    <Upload className="h-4 w-4" />
                    <input
                      type="file"
                      accept=".txt,.pdf,.doc,.docx"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, 2);
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className={`px-4 py-2 rounded-lg transition-colors ${
              isDarkMode
                ? 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!entity1.trim() || !entity2.trim()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            <GitCompare className="h-4 w-4" />
            <span>Comparar</span>
          </button>
        </div>
      </form>

      {/* Información adicional */}
      <div className={`mt-4 p-3 rounded-lg ${isDarkMode ? 'bg-gray-600' : 'bg-gray-50'}`}>
        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          💡 <strong>Consejo:</strong> Para obtener mejores resultados, proporciona contexto específico y detalles relevantes 
          en cada {analysisType === 'document' ? 'documento' : 'escenario'}. La IA analizará similitudes, diferencias 
          y proporcionará recomendaciones profesionales.
        </p>
      </div>
    </div>
  );
};

export default ComparativeAnalysisForm;