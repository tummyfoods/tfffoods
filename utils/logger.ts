type LogLevel = "info" | "warn" | "error" | "debug";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
  path?: string;
  userId?: string;
  error?: {
    message: string;
    stack?: string;
    code?: string;
    name?: string;
  };
}

class Logger {
  private static instance: Logger;
  private logs: LogEntry[] = [];
  private isDevelopment: boolean;

  private constructor() {
    this.isDevelopment = process.env.NODE_ENV === "development";
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private formatError(error: any) {
    if (error instanceof Error) {
      return {
        message: error.message,
        stack: error.stack,
        code: (error as any).code,
        name: error.name,
      };
    }
    return {
      message: String(error),
    };
  }

  private formatMessage(
    level: LogLevel,
    message: string,
    data?: any,
    path?: string,
    userId?: string
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      path,
      userId,
    };

    // Handle error objects specially
    if (data instanceof Error || (data && data.stack)) {
      entry.error = this.formatError(data);
      entry.data = { ...data };
      delete entry.data.stack; // Remove stack from data to avoid duplication
    } else {
      entry.data = data;
    }

    return entry;
  }

  info(message: string, data?: any, path?: string, userId?: string) {
    const entry = this.formatMessage("info", message, data, path, userId);
    this.logs.push(entry);
    if (this.isDevelopment) {
      console.log(`[INFO] ${message}`, entry.data || "");
    }
  }

  warn(message: string, data?: any, path?: string, userId?: string) {
    const entry = this.formatMessage("warn", message, data, path, userId);
    this.logs.push(entry);
    if (this.isDevelopment) {
      console.warn(`[WARN] ${message}`, entry.data || "");
    }
  }

  error(message: string, data?: any, path?: string, userId?: string) {
    const entry = this.formatMessage("error", message, data, path, userId);
    this.logs.push(entry);
    if (this.isDevelopment) {
      console.error(`[ERROR] ${message}`, {
        data: entry.data || "",
        error: entry.error,
      });
    }
  }

  debug(message: string, data?: any, path?: string, userId?: string) {
    const entry = this.formatMessage("debug", message, data, path, userId);
    this.logs.push(entry);
    if (this.isDevelopment) {
      console.debug(`[DEBUG] ${message}`, entry.data || "");
    }
  }

  getLogs(): LogEntry[] {
    return this.logs;
  }

  clearLogs() {
    this.logs = [];
  }

  // Helper method to log API requests
  logApiRequest(path: string, method: string, userId?: string, data?: any) {
    this.info(`API Request: ${method} ${path}`, data, path, userId);
  }

  // Helper method to log API responses
  logApiResponse(
    path: string,
    method: string,
    status: number,
    userId?: string,
    data?: any
  ) {
    if (status >= 500) {
      this.error(
        `API Response: ${method} ${path} - ${status} (Server Error)`,
        data,
        path,
        userId
      );
    } else if (status >= 400) {
      this.warn(
        `API Response: ${method} ${path} - ${status} (Client Error)`,
        data,
        path,
        userId
      );
    } else {
      this.info(
        `API Response: ${method} ${path} - ${status}`,
        data,
        path,
        userId
      );
    }
  }

  // Helper method to log database operations
  logDbOperation(
    operation: string,
    collection: string,
    userId?: string,
    data?: any
  ) {
    this.debug(
      `DB Operation: ${operation} on ${collection}`,
      data,
      undefined,
      userId
    );
  }

  // Helper method to log database errors
  logDbError(
    operation: string,
    collection: string,
    error: any,
    userId?: string
  ) {
    this.error(
      `DB Error: ${operation} on ${collection} failed`,
      error,
      undefined,
      userId
    );
  }
}

export const logger = Logger.getInstance();
