import fs from 'fs';
import path from 'path';

type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

interface LogEntry {
    timestamp: string;
    level: LogLevel;
    module: string;
    message: string;
    data?: any;
    stack?: string;
}

class Logger {
    private logDir = path.join(process.cwd(), 'logs');

    constructor() {
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    private formatLog(entry: LogEntry): string {
        return JSON.stringify(entry);
    }

    private writeToFile(entry: LogEntry): void {
        const filename = path.join(this.logDir, `${new Date().toISOString().split('T')[0]}.log`);
        fs.appendFileSync(filename, this.formatLog(entry) + '\n');
    }

    private log(level: LogLevel, module: string, message: string, data?: any, stack?: string): void {
        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            module,
            message,
            data,
            stack
        };

        const color = {
            DEBUG: '\x1b[36m',
            INFO: '\x1b[32m',
            WARN: '\x1b[33m',
            ERROR: '\x1b[31m'
        }[level];

        const reset = '\x1b[0m';
        console.log(`${color}[${entry.timestamp}] [${level}] [${module}]${reset} ${message}`, data || '');

        this.writeToFile(entry);
    }

    debug(module: string, message: string, data?: any): void {
        this.log('DEBUG', module, message, data);
    }

    info(module: string, message: string, data?: any): void {
        this.log('INFO', module, message, data);
    }

    warn(module: string, message: string, data?: any): void {
        this.log('WARN', module, message, data);
    }

    error(module: string, message: string, error?: Error | any): void {
        this.log('ERROR', module, message, error?.message, error?.stack);
    }
}

export const logger = new Logger();