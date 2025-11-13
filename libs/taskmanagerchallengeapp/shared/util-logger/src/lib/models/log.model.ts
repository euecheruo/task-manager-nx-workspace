// /workspace-root/libs/app/shared/util-logger/lib/models/log.model.ts

export type LogLevel = 'DEBUG' | 'INFO' | 'LOG' | 'WARN' | 'ERROR';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  optionalParams: unknown[];
}
