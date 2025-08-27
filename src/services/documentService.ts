import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';

export interface DocumentChunk {
  id: string;
  documentId: string;
  title: string;
  content: string;
  chunkIndex: number;
  metadata: {
    fileName: string;
    fileType: string;
    uploadedAt: string;
    chunkSize: number;
  };
}

export interface ProcessedDocument {
  documentId: string;
  fileName: string;
  fileType: string;
  totalChunks: number;
  chunks: DocumentChunk[];
}

class DocumentService {
  private readonly CHUNK_SIZE = 1000; // Caracteres por chunk
  private readonly CHUNK_OVERLAP = 200; // Solapamiento entre chunks

  /**
   * Extrae texto de diferentes tipos de archivo
   */
  async extractTextFromFile(file: File): Promise<string> {
    const fileType = file.type;
    
    try {
      if (fileType === 'text/plain') {
        return await this.extractTextFromTxt(file);
      } else if (fileType === 'application/pdf') {
        return await this.extractTextFromPdf(file);
      } else if (
        fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        fileType === 'application/msword'
      ) {
        return await this.extractTextFromDocx(file);
      } else {
        throw new Error(`Tipo de archivo no soportado: ${fileType}`);
      }
    } catch (error) {
      logger.error('Error extracting text from file', 'DocumentService', { 
        fileName: file.name, 
        fileType, 
        error 
      });
      throw new Error(`Error al procesar el archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /**
   * Extrae texto de archivo TXT
   */
  private async extractTextFromTxt(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        resolve(text);
      };
      reader.onerror = () => reject(new Error('Error al leer archivo de texto'));
      reader.readAsText(file);
    });
  }

  /**
   * Extrae texto de PDF usando PDF.js
   */
  private async extractTextFromPdf(file: File): Promise<string> {
    try {
      // Importar PDF.js dinámicamente
      const pdfjsLib = await import('pdfjs-dist');
      
      // Configurar worker
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let fullText = '';
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n';
      }
      
      return fullText.trim();
    } catch (error) {
      logger.error('Error extracting text from PDF', 'DocumentService', error);
      throw new Error('Error al procesar archivo PDF. Asegúrate de que el archivo no esté corrupto.');
    }
  }

  /**
   * Extrae texto de DOCX usando mammoth.js
   */
  private async extractTextFromDocx(file: File): Promise<string> {
    try {
      // Importar mammoth dinámicamente
      const mammoth = await import('mammoth');
      
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      
      return result.value;
    } catch (error) {
      logger.error('Error extracting text from DOCX', 'DocumentService', error);
      throw new Error('Error al procesar archivo DOCX. Asegúrate de que el archivo no esté corrupto.');
    }
  }

  /**
   * Divide el texto en chunks manejables
   */
  private createTextChunks(text: string, fileName: string): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];
    const documentId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Limpiar y normalizar el texto
    const cleanText = text
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, '\n')
      .trim();

    if (cleanText.length <= this.CHUNK_SIZE) {
      // Si el texto es pequeño, crear un solo chunk
      chunks.push({
        id: `${documentId}_chunk_0`,
        documentId,
        title: fileName,
        content: cleanText,
        chunkIndex: 0,
        metadata: {
          fileName,
          fileType: 'processed',
          uploadedAt: new Date().toISOString(),
          chunkSize: cleanText.length
        }
      });
    } else {
      // Dividir en chunks con solapamiento
      let startIndex = 0;
      let chunkIndex = 0;

      while (startIndex < cleanText.length) {
        const endIndex = Math.min(startIndex + this.CHUNK_SIZE, cleanText.length);
        let chunkText = cleanText.substring(startIndex, endIndex);

        // Intentar cortar en una oración completa si es posible
        if (endIndex < cleanText.length) {
          const lastPeriod = chunkText.lastIndexOf('.');
          const lastNewline = chunkText.lastIndexOf('\n');
          const cutPoint = Math.max(lastPeriod, lastNewline);
          
          if (cutPoint > startIndex + this.CHUNK_SIZE * 0.7) {
            chunkText = chunkText.substring(0, cutPoint + 1);
          }
        }

        chunks.push({
          id: `${documentId}_chunk_${chunkIndex}`,
          documentId,
          title: `${fileName} (Parte ${chunkIndex + 1})`,
          content: chunkText.trim(),
          chunkIndex,
          metadata: {
            fileName,
            fileType: 'processed',
            uploadedAt: new Date().toISOString(),
            chunkSize: chunkText.length
          }
        });

        // Calcular el siguiente punto de inicio con solapamiento
        startIndex = startIndex + chunkText.length - this.CHUNK_OVERLAP;
        chunkIndex++;
      }
    }

    return chunks;
  }

  /**
   * Genera embeddings para un texto usando OpenAI
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Usuario no autenticado');
      }

      // Llamar a una nueva Edge Function para generar embeddings
      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/generate-embeddings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          'apikey': SUPABASE_CONFIG.anonKey,
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error generando embeddings');
      }

      const data = await response.json();
      return data.embedding;
    } catch (error) {
      logger.error('Error generating embedding', 'DocumentService', error);
      throw error;
    }
  }

  /**
   * Guarda los chunks en la base de datos con sus embeddings
   */
  private async saveChunksToDatabase(chunks: DocumentChunk[]): Promise<void> {
    try {
      for (const chunk of chunks) {
        // Generar embedding para el chunk
        const embedding = await this.generateEmbedding(chunk.content);

        // Guardar en la base de datos
        const { error } = await supabase
          .from('legal_documents')
          .insert({
            document_id: chunk.documentId,
            title: chunk.title,
            content: chunk.content,
            embedding: JSON.stringify(embedding),
            metadata: {
              ...chunk.metadata,
              chunkIndex: chunk.chunkIndex
            }
          });

        if (error) {
          throw error;
        }
      }

      logger.info('Chunks saved to database successfully', 'DocumentService', {
        documentId: chunks[0]?.documentId,
        totalChunks: chunks.length
      });
    } catch (error) {
      logger.error('Error saving chunks to database', 'DocumentService', error);
      throw new Error('Error al guardar el documento en la base de datos');
    }
  }

  /**
   * Procesa un archivo completo: extrae texto, crea chunks, genera embeddings y guarda
   */
  async processDocument(file: File): Promise<ProcessedDocument> {
    logger.info('Starting document processing', 'DocumentService', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });

    try {
      // 1. Extraer texto del archivo
      const extractedText = await this.extractTextFromFile(file);
      
      if (!extractedText.trim()) {
        throw new Error('El archivo no contiene texto legible');
      }

      // 2. Crear chunks del texto
      const chunks = this.createTextChunks(extractedText, file.name);

      // 3. Guardar chunks con embeddings en la base de datos
      await this.saveChunksToDatabase(chunks);

      const processedDocument: ProcessedDocument = {
        documentId: chunks[0].documentId,
        fileName: file.name,
        fileType: file.type,
        totalChunks: chunks.length,
        chunks
      };

      logger.info('Document processing completed successfully', 'DocumentService', {
        documentId: processedDocument.documentId,
        totalChunks: processedDocument.totalChunks
      });

      return processedDocument;
    } catch (error) {
      logger.error('Error processing document', 'DocumentService', {
        fileName: file.name,
        error
      });
      throw error;
    }
  }

  /**
   * Busca chunks relevantes para una consulta
   */
  async searchRelevantChunks(query: string, limit: number = 5): Promise<DocumentChunk[]> {
    try {
      // Generar embedding para la consulta
      const queryEmbedding = await this.generateEmbedding(query);

      // Buscar chunks similares usando pgvector
      const { data, error } = await supabase
        .rpc('search_documents', {
          query_embedding: JSON.stringify(queryEmbedding),
          match_threshold: 0.7,
          match_count: limit
        });

      if (error) {
        throw error;
      }

      return data.map((item: any) => ({
        id: item.id,
        documentId: item.document_id,
        title: item.title,
        content: item.content,
        chunkIndex: item.metadata?.chunkIndex || 0,
        metadata: item.metadata
      }));
    } catch (error) {
      logger.error('Error searching relevant chunks', 'DocumentService', error);
      throw new Error('Error al buscar información relevante en los documentos');
    }
  }
}

export const documentService = new DocumentService();