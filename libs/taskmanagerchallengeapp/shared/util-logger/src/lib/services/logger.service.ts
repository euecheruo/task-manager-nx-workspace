import { Injectable, isDevMode } from '@angular/core';
import { LogLevel, LogEntry } from '../models/log.model';

@Injectable({
  providedIn: 'root',
})
export class LoggerService {
  private readonly isProduction = !isDevMode();
  private readonly MAX_LOG_HISTORY = 50;
  private logHistory: LogEntry[] = [];

  constructor() {
    this.log('INFO', 'LoggerService initialized. Production mode: ' + this.isProduction);
  }

  /**
   * Logs a message with a specific level.
   */
  private internalLog(level: LogLevel, message: string, ...optionalParams: unknown[]): void {
    const timestamp = new Date().toISOString();

    const logEntry: LogEntry = {
      timestamp,
      level,
      message,
      optionalParams,
    };

    this.logHistory.push(logEntry);
    if (this.logHistory.length > this.MAX_LOG_HISTORY) {
      this.logHistory.shift();
    }

    if (this.isProduction && (level === 'DEBUG' || level === 'INFO')) {
      return;
    }

    const consoleMethod = this.getConsoleMethod(level);
    console[consoleMethod](`[${level}][${timestamp}] ${message}`, ...optionalParams);
  }

  private getConsoleMethod(level: LogLevel): 'log' | 'info' | 'warn' | 'error' | 'debug' {
    switch (level) {
      case 'INFO':
        return 'info';
      case 'WARN':
        return 'warn';
      case 'ERROR':
        return 'error';
      case 'DEBUG':
        return 'debug';
      default:
        return 'log';
    }
  }

  debug(message: string, ...optionalParams: unknown[]): void {
    this.internalLog('DEBUG', message, ...optionalParams);
  }
  info(message: string, ...optionalParams: unknown[]): void {
    this.internalLog('INFO', message, ...optionalParams);
  }
  log(message: string, ...optionalParams: unknown[]): void {
    this.internalLog('LOG', message, ...optionalParams);
  }
  warn(message: string, ...optionalParams: unknown[]): void {
    this.internalLog('WARN', message, ...optionalParams);
  }
  error(message: string, ...optionalParams: unknown[]): void {
    this.internalLog('ERROR', message, ...optionalParams);
  }
}
