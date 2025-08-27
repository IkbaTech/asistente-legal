import React, { useState } from 'react';
import { Copy, Download, User, Brain, Check, FileText } from 'lucide-react';
import { Message as MessageType } from '../types';

interface MessageProps {
  message: MessageType;
  isDarkMode: boolean;
}

const Message: React.FC<MessageProps> = ({ message, isDarkMode }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error al copiar:', err);
    }
  };

  const exportAsDoc = (content: string, title: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const isUser = message.role === 'user';
  const isDocument = message.type === 'document';
  const isDraft = message.type === 'draft';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6 animate-fadeInUp`}>
      <div className={`flex max-w-4xl ${isUser ? 'flex-row-reverse' : 'flex-row'} space-x-3`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 ${isUser ? 'ml-3' : 'mr-3'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center hover-glow transition-all duration-300 ${
            isUser 
              ? 'gradient-primary neon-blue' 
              : 'bg-black border border-white'
          }`}>
            {isUser ? (
              <User className="h-4 w-4 text-white" />
            ) : (
              <Brain className="h-4 w-4 text-white" />
            )}
          </div>
        </div>

        {/* Message Content */}
        <div className={`flex-1 ${isUser ? 'text-right' : 'text-left'}`}>
          <div className={`message-bubble inline-block max-w-full rounded-2xl px-4 py-3 ${
            isUser
              ? 'bg-white text-black border border-white'
              : 'bg-black border border-white text-white'
          }`}>
            {/* Document indicator */}
            {isDocument && (
              <div className="flex items-center space-x-2 mb-2 opacity-75 animate-scaleIn">
                <FileText className="h-4 w-4" />
                <span className="text-sm">Documento: {message.documentName}</span>
              </div>
            )}

            {/* Draft indicator */}
            {isDraft && (
              <div className="inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs mb-2 glass animate-scaleIn">
                <FileText className="h-3 w-3" />
                <span className="text-blue-300">Borrador Legal</span>
              </div>
            )}

            {/* Message text */}
            <div className={`${isDraft ? 'font-mono text-sm' : ''} animate-fadeInUp`}>
              {message.content.split('\n').map((line, index) => {
                // Detectar y formatear citas legales
                const formattedLine = line.replace(
                  /(Art\.\s*\d+[A-Za-z]*\s*(?:del?\s*)?[A-Z]{2,}|según\s+(?:el\s+)?Art\.\s*\d+|conforme\s+al\s+Art\.\s*\d+)/gi,
                  '<strong class="text-yellow-400 font-bold">$1</strong>'
                );
                
                return (
                  <div 
                    key={index} 
                    className={line.startsWith('#') ? 'font-bold text-lg mb-2' : ''}
                    dangerouslySetInnerHTML={{ __html: formattedLine }}
                  />
                );
              })}
            </div>

            {/* Timestamp */}
            <div className="text-xs mt-2 opacity-60 text-blue-200">
              {message.timestamp.toLocaleTimeString('es-GT', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
          </div>

          {/* Action buttons for assistant messages */}
          {!isUser && (
            <div className="flex items-center space-x-2 mt-2 animate-fadeInUp">
              <button
                onClick={() => copyToClipboard(message.content)}
                className="flex items-center space-x-1 px-3 py-1 rounded-full text-xs border border-white hover:bg-white hover:text-black transition-all duration-300 text-white micro-bounce"
                title="Copiar respuesta"
              >
                {copied ? (
                  <Check className="h-3 w-3 text-green-400" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
                <span>{copied ? 'Copiado' : 'Copiar'}</span>
              </button>

              {(isDraft || message.content.length > 200) && (
                <button
                  onClick={() => exportAsDoc(message.content, `IkbaTech_${message.id}`)}
                  className="flex items-center space-x-1 px-3 py-1 rounded-full text-xs border border-white hover:bg-white hover:text-black transition-all duration-300 text-white micro-bounce"
                  title="Exportar documento"
                >
                  <Download className="h-3 w-3" />
                  <span>Exportar</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Message;