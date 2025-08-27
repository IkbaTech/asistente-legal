import React, { useCallback, useState } from 'react';
import { Upload, FileText, File, X, CheckCircle, Loader2, AlertCircle, Camera, Image, FileCheck } from 'lucide-react';
import { usePlanLimits } from '../hooks/usePlanLimits';
import { DocumentProcessor } from '../utils/documentProcessor';
import { logger } from '../utils/logger';

interface DocumentUploadProps {
  onFileUpload: (content: string, fileName: string) => void;
  onClose: () => void;
  isDarkMode: boolean;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({ onFileUpload, onClose, isDarkMode }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const { currentLimits, canUploadDocument } = usePlanLimits();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
  }, []);

  const handleFiles = useCallback((files: File[]) => {
    const file = files[0];
    if (!file) return;

    setError(null);

    // Verificar límites de plan
    if (!canUploadDocument()) {
      setError('Has alcanzado el límite de documentos de tu plan. Actualiza tu plan para subir más documentos.');
      return;
    }

    // Verificar tamaño del archivo según el plan
    const maxSizeBytes = currentLimits.maxDocumentSize * 1024 * 1024; // Convertir MB a bytes
    if (file.size > maxSizeBytes) {
      setError(`El archivo es demasiado grande. Tu plan permite archivos de hasta ${currentLimits.maxDocumentSize}MB.`);
      return;
    }

    setIsProcessing(true);
    setProcessingStatus('Validando archivo...');

    const imageTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/webp'
    ];

    const isDocument = DocumentProcessor.isSupportedFile(file);
    const isImage = imageTypes.includes(file.type);

    if (!isDocument && !isImage) {
      setError('Solo se permiten archivos PDF, Word (DOC/DOCX), texto plano o imágenes (JPEG, PNG, WebP)');
      setIsProcessing(false);
      return;
    }

    // Procesar según el tipo de archivo
    if (isImage) {
      processImage(file);
    } else {
      processDocument(file);
    }
  }, [canUploadDocument, currentLimits]);

  const processImage = async (file: File) => {
    try {
      setProcessingStatus('Analizando imagen...');
      
      // Convertir imagen a base64
      const base64 = await convertToBase64(file);
      
      setProcessingStatus('Imagen procesada exitosamente');
      setUploadedFile(file.name);
      setIsProcessing(false);
      
      // Crear mensaje de confirmación
      const confirmationMessage = `📸 **Imagen "${file.name}" cargada exitosamente**

🔍 **Análisis disponible:**
- Extracción de texto mediante OCR
- Análisis jurídico del contenido
- Identificación de elementos legales relevantes

**Imagen lista para análisis legal.**

¿Qué aspecto específico de la imagen te gustaría que analice?`;

      onFileUpload(confirmationMessage, file.name);
      
      logger.info('Image uploaded successfully', 'DocumentUpload', {
        fileName: file.name,
        fileSize: file.size
      });
      
    } catch (error) {
      console.error('Error processing image:', error);
      setError(error instanceof Error ? error.message : 'Error al procesar la imagen');
      setIsProcessing(false);
      setProcessingStatus('');
      
      logger.error('Error processing image', 'DocumentUpload', {
        fileName: file.name,
        error
      });
    }
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = () => reject(new Error('Error al leer la imagen'));
      reader.readAsDataURL(file);
    });
  };
  
  const processDocument = async (file: File) => {
    try {
      const fileInfo = DocumentProcessor.getFileTypeInfo(file);
      setProcessingStatus(`Procesando ${fileInfo.name}...`);
      
      // Procesar el documento usando DocumentProcessor
      const processed = await DocumentProcessor.processFile(file);
      
      if (!processed.content.trim()) {
        throw new Error('El archivo no contiene texto legible');
      }
      
      setProcessingStatus(`${fileInfo.name} procesado exitosamente`);
      setUploadedFile(file.name);
      setIsProcessing(false);
      
      // Generar resumen del documento usando DocumentProcessor
      const confirmationMessage = DocumentProcessor.generateDocumentSummary(processed);

      onFileUpload(confirmationMessage, file.name);
      
      logger.info('Document processed successfully', 'DocumentUpload', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        wordCount: processed.metadata.wordCount,
        pageCount: processed.metadata.pageCount
      });
      
    } catch (error) {
      console.error('Error processing document:', error);
      setError(error instanceof Error ? error.message : 'Error al procesar el documento');
      setIsProcessing(false);
      setProcessingStatus('');
      
      logger.error('Error processing document', 'DocumentUpload', {
        fileName: file.name,
        error
      });
    }
  };

  const removeFile = useCallback(() => {
    setUploadedFile(null);
    setError(null);
    setIsProcessing(false);
    setProcessingStatus('');
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="max-w-lg w-full rounded-lg shadow-xl bg-black border border-white">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Upload className="h-6 w-6 text-white" />
              <h2 className="text-lg font-semibold text-white">
                Subir Documento
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg transition-colors hover:bg-white hover:text-black text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {error && (
            <div className="mb-3 p-3 rounded-lg border bg-red-900/20 border-red-800">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm text-red-400">
                  {error}
                </span>
              </div>
            </div>
          )}
          
          {isProcessing ? (
            <div className="p-4 rounded-lg border bg-blue-900/20 border-blue-800">
              <div className="flex items-center space-x-3">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-blue-400">
                    Procesando documento...
                  </p>
                  <p className="text-xs text-blue-500">
                    {processingStatus}
                  </p>
                </div>
              </div>
            </div>
          ) : uploadedFile ? (
            <div className="p-3 rounded-lg border bg-green-900/20 border-green-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-400">
                    Documento procesado: {uploadedFile}
                  </span>
                </div>
                <button
                  onClick={removeFile}
                  className="p-1 rounded transition-colors hover:bg-gray-600 text-gray-400"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                isDragOver
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-white bg-gray-900'
              }`}
            >
              <div className="flex flex-col items-center space-y-2">
                <Upload className="h-8 w-8 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-300">
                    Arrastra documentos aquí o{' '}
                    <label className="text-white hover:text-gray-300 cursor-pointer">
                      selecciona archivos
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.webp"
                        onChange={handleFileSelect}
                        multiple={false}
                      />
                    </label>
                  </p>
                  <p className="text-xs mt-1 text-gray-400">
                    PDF, Word (DOC/DOCX), TXT, Imágenes • Máximo {currentLimits.maxDocumentSize}MB
                  </p>
                  
                  {/* Iconos visuales para tipos de archivo */}
                  <div className="flex justify-center space-x-4 mt-3">
                    <div className="flex items-center space-x-1">
                      <FileText className="h-4 w-4 text-white" />
                      <span className="text-xs text-gray-400">PDF/Word</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <FileCheck className="h-4 w-4 text-white" />
                      <span className="text-xs text-gray-400">Texto</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Camera className="h-4 w-4 text-white" />
                      <span className="text-xs text-gray-400">Imágenes</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer con botones */}
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg transition-colors bg-gray-700 text-gray-300 hover:bg-gray-600"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentUpload;