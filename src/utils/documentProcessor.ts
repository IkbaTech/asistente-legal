// Procesador de documentos para IkbaTech
import mammoth from 'mammoth';

export interface ProcessedDocument {
  content: string;
  metadata: {
    fileName: string;
    fileType: string;
    fileSize: number;
    pageCount?: number;
    wordCount: number;
    extractedAt: string;
  };
}

export class DocumentProcessor {
  /**
   * Procesa diferentes tipos de archivos y extrae su contenido
   */
  static async processFile(file: File): Promise<ProcessedDocument> {
    const fileType = file.type;
    let content = '';
    let metadata: any = {
      fileName: file.name,
      fileType: fileType,
      fileSize: file.size,
      extractedAt: new Date().toISOString()
    };

    try {
      if (fileType === 'text/plain') {
        content = await this.extractTextFromTxt(file);
      } else if (fileType === 'application/pdf') {
        const result = await this.extractTextFromPdf(file);
        content = result.content;
        metadata.pageCount = result.pageCount;
      } else if (
        fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        fileType === 'application/msword'
      ) {
        content = await this.extractTextFromWord(file);
      } else {
        throw new Error(`Tipo de archivo no soportado: ${fileType}`);
      }

      // Calcular número de palabras
      metadata.wordCount = content.trim().split(/\s+/).length;

      return {
        content: content.trim(),
        metadata
      };
    } catch (error) {
      console.error('Error processing document:', error);
      throw new Error(`Error al procesar el archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /**
   * Extrae texto de archivo TXT
   */
  private static async extractTextFromTxt(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        resolve(text);
      };
      reader.onerror = () => reject(new Error('Error al leer archivo de texto'));
      reader.readAsText(file, 'UTF-8');
    });
  }

  /**
   * Extrae texto de PDF usando pdf-parse
   */
  private static async extractTextFromPdf(file: File): Promise<{ content: string; pageCount: number }> {
    try {
      // Importar pdf-parse dinámicamente
      const pdfParse = (await import('pdf-parse')).default;
      
      const arrayBuffer = await file.arrayBuffer();
      const buffer = new Uint8Array(arrayBuffer);
      
      const pdfData = await pdfParse(buffer);
      
      return {
        content: pdfData.text,
        pageCount: pdfData.numpages
      };
    } catch (error) {
      console.error('Error extracting PDF:', error);
      throw new Error('Error al procesar archivo PDF. Asegúrate de que el archivo no esté corrupto o protegido con contraseña.');
    }
  }

  /**
   * Extrae texto de Word usando mammoth.js
   */
  private static async extractTextFromWord(file: File): Promise<string> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      
      if (result.messages && result.messages.length > 0) {
        console.warn('Word extraction warnings:', result.messages);
      }
      
      return result.value;
    } catch (error) {
      console.error('Error extracting Word document:', error);
      throw new Error('Error al procesar archivo Word. Asegúrate de que el archivo no esté corrupto.');
    }
  }

  /**
   * Valida si el archivo es soportado
   */
  static isSupportedFile(file: File): boolean {
    const supportedTypes = [
      'text/plain',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];
    
    return supportedTypes.includes(file.type);
  }

  /**
   * Obtiene información del tipo de archivo
   */
  static getFileTypeInfo(file: File): { name: string; icon: string; description: string } {
    const fileType = file.type;
    
    if (fileType === 'text/plain') {
      return {
        name: 'Texto',
        icon: '📄',
        description: 'Archivo de texto plano'
      };
    } else if (fileType === 'application/pdf') {
      return {
        name: 'PDF',
        icon: '📕',
        description: 'Documento PDF'
      };
    } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      return {
        name: 'Word (DOCX)',
        icon: '📘',
        description: 'Documento de Microsoft Word'
      };
    } else if (fileType === 'application/msword') {
      return {
        name: 'Word (DOC)',
        icon: '📘',
        description: 'Documento de Microsoft Word (formato antiguo)'
      };
    }
    
    return {
      name: 'Desconocido',
      icon: '📄',
      description: 'Tipo de archivo no reconocido'
    };
  }

  /**
   * Formatea el tamaño del archivo
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Genera un resumen del documento procesado
   */
  static generateDocumentSummary(processed: ProcessedDocument): string {
    const { content, metadata } = processed;
    const fileInfo = this.getFileTypeInfo({ type: metadata.fileType } as File);
    
    let summary = `📄 **Documento "${metadata.fileName}" procesado exitosamente**\n\n`;
    
    summary += `**Información del archivo:**\n`;
    summary += `• Tipo: ${fileInfo.name} ${fileInfo.icon}\n`;
    summary += `• Tamaño: ${this.formatFileSize(metadata.fileSize)}\n`;
    summary += `• Palabras: ${metadata.wordCount.toLocaleString()}\n`;
    
    if (metadata.pageCount) {
      summary += `• Páginas: ${metadata.pageCount}\n`;
    }
    
    summary += `• Procesado: ${new Date(metadata.extractedAt).toLocaleString('es-GT')}\n\n`;
    
    summary += `**🤖 Análisis disponible:**\n`;
    summary += `• Revisión completa del contenido legal\n`;
    summary += `• Identificación de cláusulas importantes\n`;
    summary += `• Análisis de cumplimiento normativo\n`;
    summary += `• Extracción de información específica\n`;
    summary += `• Comparación con otros documentos\n\n`;
    
    // Mostrar preview del contenido
    const preview = content.substring(0, 500);
    summary += `**Vista previa del contenido:**\n\n`;
    summary += `${preview}${content.length > 500 ? '...\n\n[Contenido truncado para vista previa]' : ''}\n\n`;
    
    summary += `**El documento está listo para análisis jurídico profesional.**\n`;
    summary += `¿Qué aspecto específico del documento te gustaría que analice, colega?`;
    
    return summary;
  }
}