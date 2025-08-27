// Sistema de logging para IkbaTech
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  context?: string;
  data?: any;
  userId?: string;
  sessionId: string;
}

class Logger {
  private logs: LogEntry[] = [];
  private sessionId: string;
  private currentLogLevel: LogLevel = LogLevel.INFO;
  private maxLogs: number = 1000;

  constructor() {
    this.sessionId = this.generateSessionId();
    
    // En desarrollo, mostrar todos los logs
    if (import.meta.env.DEV) {
      this.currentLogLevel = LogLevel.DEBUG;
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private createLogEntry(level: LogLevel, message: string, context?: string, data?: any): LogEntry {
    return {
      timestamp: new Date(),
      level,
      message,
      context,
      data,
      sessionId: this.sessionId,
      userId: this.getCurrentUserId()
    };
  }

  private getCurrentUserId(): string | undefined {
    // Obtener ID del usuario actual (implementar según sistema de auth)
    const userData = localStorage.getItem('ikbatech_user');
    if (userData) {
      try {
        return JSON.parse(userData).id;
      } catch {
        return undefined;
      }
    }
    return undefined;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.currentLogLevel;
  }

  private addLog(entry: LogEntry) {
    this.logs.push(entry);
    
    // Mantener solo los últimos N logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // En desarrollo, mostrar en consola
    if (import.meta.env.DEV) {
      const levelNames = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
      const levelColors = ['#6B7280', '#3B82F6', '#F59E0B', '#EF4444'];
      
      console.log(
        `%c[${levelNames[entry.level]}] %c${entry.context || 'APP'} %c${entry.message}`,
        `color: ${levelColors[entry.level]}; font-weight: bold`,
        'color: #8B5CF6; font-weight: bold',
        'color: inherit',
        entry.data || ''
      );
    }
  }

  debug(message: string, context?: string, data?: any) {
    if (this.shouldLog(LogLevel.DEBUG)) {
      this.addLog(this.createLogEntry(LogLevel.DEBUG, message, context, data));
    }
  }

  info(message: string, context?: string, data?: any) {
    if (this.shouldLog(LogLevel.INFO)) {
      this.addLog(this.createLogEntry(LogLevel.INFO, message, context, data));
    }
  }

  warn(message: string, context?: string, data?: any) {
    if (this.shouldLog(LogLevel.WARN)) {
      this.addLog(this.createLogEntry(LogLevel.WARN, message, context, data));
    }
  }

  error(message: string, context?: string, data?: any) {
    if (this.shouldLog(LogLevel.ERROR)) {
      this.addLog(this.createLogEntry(LogLevel.ERROR, message, context, data));
    }
  }

  // Obtener logs para debugging o envío a servidor
  getLogs(level?: LogLevel): LogEntry[] {
    if (level !== undefined) {
      return this.logs.filter(log => log.level >= level);
    }
    return [...this.logs];
  }

  // Limpiar logs
  clearLogs() {
    this.logs = [];
  }

  // Exportar logs como JSON para debugging
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  // Obtener estadísticas de logs
  getLogStats() {
    const stats = {
      total: this.logs.length,
      debug: 0,
      info: 0,
      warn: 0,
      error: 0,
      sessionId: this.sessionId
    };

    this.logs.forEach(log => {
      switch (log.level) {
        case LogLevel.DEBUG: stats.debug++; break;
        case LogLevel.INFO: stats.info++; break;
        case LogLevel.WARN: stats.warn++; break;
        case LogLevel.ERROR: stats.error++; break;
      }
    });

    return stats;
  }
}

export const logger = new Logger();