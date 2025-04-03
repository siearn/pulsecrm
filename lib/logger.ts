type LogLevel = "debug" | "info" | "warn" | "error"

interface LogMessage {
  message: string
  [key: string]: any
}

class Logger {
  private isDevelopment = process.env.NODE_ENV !== "production"

  debug(data: LogMessage) {
    this.log("debug", data)
  }

  info(data: LogMessage) {
    this.log("info", data)
  }

  warn(data: LogMessage) {
    this.log("warn", data)
  }

  error(data: LogMessage) {
    this.log("error", data)
  }

  private log(level: LogLevel, data: LogMessage) {
    // In development, pretty print to console
    if (this.isDevelopment) {
      const color = this.getConsoleColor(level)
      console[level === "debug" ? "log" : level](
        `%c${level.toUpperCase()}%c ${new Date().toISOString()}`,
        `background: ${color}; color: white; padding: 2px 4px; border-radius: 2px; font-weight: bold;`,
        "color: gray;",
        data,
      )
      return
    }

    // In production, structured logging for cloud services
    const logData = {
      level,
      timestamp: new Date().toISOString(),
      ...data,
    }

    // For production, you might want to send logs to a service like Datadog, Sentry, etc.
    // For now, we'll just use console.log with structured JSON
    console[level === "debug" ? "log" : level](JSON.stringify(logData))
  }

  private getConsoleColor(level: LogLevel): string {
    switch (level) {
      case "debug":
        return "#6c757d"
      case "info":
        return "#0d6efd"
      case "warn":
        return "#ffc107"
      case "error":
        return "#dc3545"
    }
  }
}

export const logger = new Logger()

