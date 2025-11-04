/**
 * Centralized Logging Utility for Gym Management System
 * 
 * Provides structured logging with different log levels, context tracking,
 * and formatted output for better debugging and monitoring.
 * 
 * Log Levels:
 * - DEBUG: Detailed information for debugging
 * - INFO: General informational messages
 * - WARN: Warning messages for potentially harmful situations
 * - ERROR: Error messages for serious issues
 * 
 * Usage:
 * import { logger } from '@/utils/logger';
 * 
 * logger.info('User logged in', { userId: '123', email: 'user@example.com' });
 * logger.error('Failed to fetch data', error, { context: 'memberService' });
 */

import { getEnvironment } from './env';

export const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 4,
} as const;

export type LogLevel = typeof LogLevel[keyof typeof LogLevel];

export interface LogContext {
  userId?: string;
  userEmail?: string;
  userRole?: string;
  component?: string;
  service?: string;
  action?: string;
  duration?: number;
  [key: string]: unknown;
}

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class Logger {
  private logLevel: LogLevel;
  private enableConsole: boolean;
  private logHistory: LogEntry[] = [];
  private maxHistorySize: number = 1000;

  constructor() {
    // Set log level based on environment
    // Production: INFO and above, Development: DEBUG and above
    const env = getEnvironment();
    this.logLevel = env.isProd ? LogLevel.INFO : LogLevel.DEBUG;
    this.enableConsole = true;
  }

  /**
   * Set the minimum log level
   */
  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  /**
   * Enable or disable console output
   */
  setConsoleEnabled(enabled: boolean): void {
    this.enableConsole = enabled;
  }

  /**
   * Get log history
   */
  getHistory(limit?: number): LogEntry[] {
    return limit ? this.logHistory.slice(-limit) : [...this.logHistory];
  }

  /**
   * Clear log history
   */
  clearHistory(): void {
    this.logHistory = [];
  }

  /**
   * Export logs as JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.logHistory, null, 2);
  }

  /**
   * Add log entry to history
   */
  private addToHistory(entry: LogEntry): void {
    this.logHistory.push(entry);
    
    // Maintain max history size
    if (this.logHistory.length > this.maxHistorySize) {
      this.logHistory.shift();
    }
  }

  /**
   * Format error object for logging
   */
  private formatError(error: unknown): { name: string; message: string; stack?: string } {
    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }
    
    return {
      name: 'Unknown Error',
      message: String(error),
    };
  }

  /**
   * Create log entry
   */
  private createLogEntry(
    level: string,
    message: string,
    context?: LogContext,
    error?: unknown
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
    };

    if (context && Object.keys(context).length > 0) {
      entry.context = context;
    }

    if (error) {
      entry.error = this.formatError(error);
    }

    return entry;
  }

  /**
   * Log to console with formatting
   */
  private logToConsole(entry: LogEntry): void {
    if (!this.enableConsole) return;

    const styles = {
      DEBUG: 'color: #6B7280; font-weight: normal',
      INFO: 'color: #3B82F6; font-weight: bold',
      WARN: 'color: #F59E0B; font-weight: bold',
      ERROR: 'color: #EF4444; font-weight: bold',
    };

    const style = styles[entry.level as keyof typeof styles] || '';
    
    console.group(`%c[${entry.level}] ${entry.message}`, style);
    console.log('🕐 Time:', entry.timestamp);
    
    if (entry.context) {
      console.log('📋 Context:', entry.context);
    }
    
    if (entry.error) {
      console.error('❌ Error:', entry.error.message);
      if (entry.error.stack) {
        console.error('📚 Stack:', entry.error.stack);
      }
    }
    
    console.groupEnd();
  }

  /**
   * Core logging method
   */
  private log(
    level: LogLevel,
    levelName: string,
    message: string,
    contextOrError?: LogContext | unknown,
    contextOrError2?: unknown
  ): void {
    // Check if logging is enabled for this level
    if (level < this.logLevel) return;

    let context: LogContext | undefined;
    let errorToLog: unknown | undefined;

    // Handle flexible parameters
    // Case 1: First param is Error and second param exists (could be context)
    if (contextOrError instanceof Error) {
      errorToLog = contextOrError;
      if (contextOrError2 && typeof contextOrError2 === 'object') {
        context = contextOrError2 as LogContext;
      }
    } 
    // Case 2: First param is context and second is error
    else if (contextOrError && typeof contextOrError === 'object' && contextOrError2) {
      context = contextOrError as LogContext;
      errorToLog = contextOrError2;
    }
    // Case 3: First param is context only
    else if (contextOrError && typeof contextOrError === 'object') {
      context = contextOrError as LogContext;
    }

    const entry = this.createLogEntry(levelName, message, context, errorToLog);
    this.addToHistory(entry);
    this.logToConsole(entry);
  }

  /**
   * DEBUG level logging
   */
  debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, 'DEBUG', message, context);
  }

  /**
   * INFO level logging
   */
  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, 'INFO', message, context);
  }

  /**
   * WARN level logging
   */
  warn(message: string, context?: LogContext): void;
  warn(message: string, error: unknown, context?: LogContext): void;
  warn(message: string, contextOrError?: LogContext | unknown, error?: unknown): void {
    this.log(LogLevel.WARN, 'WARN', message, contextOrError, error);
  }

  /**
   * ERROR level logging
   */
  error(message: string, error: unknown, context?: LogContext): void {
    this.log(LogLevel.ERROR, 'ERROR', message, error, context);
  }

  /**
   * Performance measurement helper
   */
  async measure<T>(
    operation: string,
    fn: () => Promise<T>,
    context?: LogContext
  ): Promise<T> {
    const startTime = performance.now();
    
    this.debug(`Starting: ${operation}`, context);
    
    try {
      const result = await fn();
      const duration = Math.round(performance.now() - startTime);
      
      this.info(`Completed: ${operation}`, {
        ...context,
        duration,
        status: 'success',
      });
      
      return result;
    } catch (error) {
      const duration = Math.round(performance.now() - startTime);
      
      this.error(`Failed: ${operation}`, error, {
        ...context,
        duration,
        status: 'failed',
      });
      
      throw error;
    }
  }

  /**
   * Log user action
   */
  logAction(
    action: string,
    userId?: string,
    context?: LogContext
  ): void {
    this.info(`User Action: ${action}`, {
      userId,
      action,
      ...context,
    });
  }

  /**
   * Log API request
   */
  logApiRequest(
    method: string,
    endpoint: string,
    context?: LogContext
  ): void {
    this.debug(`API Request: ${method} ${endpoint}`, {
      method,
      endpoint,
      ...context,
    });
  }

  /**
   * Log API response
   */
  logApiResponse(
    method: string,
    endpoint: string,
    status: number,
    duration: number,
    context?: LogContext
  ): void {
    const level = status >= 400 ? 'warn' : 'info';
    this[level](`API Response: ${method} ${endpoint} - ${status}`, {
      method,
      endpoint,
      status,
      duration,
      ...context,
    });
  }

  /**
   * Log Firebase operation
   */
  logFirebaseOperation(
    operation: string,
    collection: string,
    context?: LogContext
  ): void {
    this.debug(`Firebase: ${operation} on ${collection}`, {
      operation,
      collection,
      ...context,
    });
  }

  /**
   * Log authentication event
   */
  logAuth(
    event: 'login' | 'logout' | 'register' | 'failed',
    userId?: string,
    context?: LogContext
  ): void {
    this.info(`Auth Event: ${event}`, {
      userId,
      event,
      ...context,
    });
  }
}

// Export singleton instance
export const logger = new Logger();

// Export convenience methods for common patterns
export const logService = {
  /**
   * Log service initialization
   */
  init(serviceName: string): void {
    logger.info(`Initializing ${serviceName}`, { service: serviceName });
  },

  /**
   * Log service operation
   */
  operation(serviceName: string, operation: string, context?: LogContext): void {
    logger.debug(`${serviceName}: ${operation}`, {
      service: serviceName,
      operation,
      ...context,
    });
  },

  /**
   * Log service error
   */
  error(serviceName: string, operation: string, error: unknown, context?: LogContext): void {
    logger.error(`${serviceName}: ${operation} failed`, error, {
      service: serviceName,
      operation,
      ...context,
    });
  },
};

export default logger;
