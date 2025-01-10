import { createLogger, format, transports, Logger } from 'winston';

const logger: Logger = createLogger({
  level: 'info', 
  format: format.combine(
    format.timestamp(), 
    format.printf(({ level, message, timestamp }) => {
      return `${timestamp} [${level.toUpperCase()}]: ${message}`;
    })
  ),
  transports: [
    new transports.Console(), 
    new transports.File({ filename: 'app.log' })
  ],
});

// Export the logger instance
export default logger;
