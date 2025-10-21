import * as TSLOG from 'tslog'

/**
 * LogLevel
 *
 * Enumeration of supported log levels following tslog's numeric mapping.
 * Higher numbers indicate more severe log levels.
 */
export enum LogLevel {
  SILLY = 0,
  TRACE = 1,
  DEBUG = 2,
  INFO = 3,
  WARN = 4,
  ERROR = 5,
  FATAL = 6,
}

/**
 * Logger
 *
 * A high-performance singleton logger manager built on top of tslog. It provides
 * centralized logging with configurable levels, pretty formatting, and an
 * internal buffer for exporting logs.
 */
export class Logger extends TSLOG.Logger<unknown> {
  /**
   * The singleton instance of `Logger` used across the application.
   */
  private static _instance: Logger | null = null
  /**
   * In-memory buffer holding formatted log lines for later export.
   */
  private _logBuffer: string[] = []

  /**
   * Create a new Logger instance.
   *
   * Configures pretty log templates and attaches a transport that collects
   * formatted messages into the internal `_logBuffer` for later download.
   */
  private constructor() {
    super({
      name: 'Logger',
      type: 'pretty',
      minLevel: 0, // 0 = debug, 1 = info, 2 = warn, 3 = error, 4 = fatal,
      prettyLogTemplate:
        '{{yyyy}}.{{mm}}.{{dd}} {{hh}}:{{MM}}:{{ss}}:{{ms}}\t{{logLevelName}}\t',
      prettyErrorTemplate:
        '\n{{errorName}} {{errorMessage}}\nerror stack:\n{{errorStack}}',
      prettyErrorStackTemplate:
        '  • {{fileName}}\t{{method}}\n\t{{filePathWithLine}}',
      prettyErrorParentNamesSeparator: ':',
      prettyErrorLoggerNameDelimiter: '\t',
      stylePrettyLogs: true,
      prettyLogStyles: {
        logLevelName: {
          '*': ['bold', 'black', 'bgWhiteBright', 'dim'],
          TRACE: ['bold', 'whiteBright'],
          DEBUG: ['bold', 'green'],
          INFO: ['bold', 'blue'],
          WARN: ['bold', 'yellow'],
          ERROR: ['bold', 'red'],
        },
        dateIsoStr: 'white',
        filePathWithLine: 'white',
        name: ['white', 'bold'],
        nameWithDelimiterPrefix: ['white', 'bold'],
        nameWithDelimiterSuffix: ['white', 'bold'],
        errorName: ['bold', 'bgRedBright', 'whiteBright'],
        fileName: ['yellow'],
      },
    })

    this.attachTransport(logObj => {
      const dateStr = logObj._meta?.date || new Date().toISOString()
      const date = new Date(dateStr)
      const formattedDate =
        date.getFullYear() +
        '-' +
        String(date.getMonth() + 1).padStart(2, '0') +
        '-' +
        String(date.getDate()).padStart(2, '0') +
        ' ' +
        String(date.getHours()).padStart(2, '0') +
        ':' +
        String(date.getMinutes()).padStart(2, '0') +
        ':' +
        String(date.getSeconds()).padStart(2, '0') +
        '.' +
        String(date.getMilliseconds()).padStart(3, '0')

      const logLevel = logObj._meta?.logLevelName || 'UNKNOWN'
      const message = logObj[0] || 'No message'

      this._logBuffer.push(`${formattedDate} ${logLevel} ${message}`)
    })
  }

  /**
   * Get the singleton instance.
   *
   * @returns The Logger singleton instance.
   */
  public static getInstance(): Logger {
    if (!Logger._instance) {
      Logger._instance = new Logger()
    }
    return Logger._instance
  }

  /**
   * Set the log level.
   *
   * @param level Log level.
   */
  /**
   * Set the minimum log level to output.
   *
   * @param level LogLevel. The minimum level to be emitted (e.g., LogLevel.ERROR).
   */
  public setLogLevel(level: LogLevel): void {
    this.settings.minLevel = level
  }

  /**
   * Log an info message.
   *
   * @param message string. The message to log at info level.
   */
  public static log(message: string): void {
    const instance = Logger.getInstance()
    instance.info(message)
  }

  /**
   * Log a warning message.
   *
   * @param message string. The warning message to log.
   */
  public static warn(message: string): void {
    const instance = Logger.getInstance()
    instance.warn(message)
  }

  /**
   * Log an error message.
   *
   * @param message string. The error message to log.
   */
  public static error(message: string): void {
    const instance = Logger.getInstance()
    instance.error(message)
    try {
      if (typeof window !== 'undefined') {
        import('../../../utils/errorBus')
          .then(({ errorBus }) => {
            errorBus.emit('error', { message, severity: 'error', durationMs: 5000 })
          })
          .catch(() => {
            console.error('Error importing errorBus')
          })
      }
    } catch {
      /* ignore */
    }
  }

  /**
   * Log a debug message.
   *
   * @param message string. The debug message to log.
   */
  public static debug(message: string): void {
    const instance = Logger.getInstance()
    instance.debug(message)
  }

  /**
   * Flush logs to a downloadable file.
   *
   * Downloads all buffered logs as a text file to the user's device.
   * The buffer is cleared after the download is triggered.
   */
  public static flushLogs(): void {
    const instance = Logger.getInstance()

    const blob = new Blob([instance._logBuffer.join('\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = `logs-${new Date().toISOString()}.txt`
    a.click()

    URL.revokeObjectURL(url)
    instance._logBuffer = []
  }
}
