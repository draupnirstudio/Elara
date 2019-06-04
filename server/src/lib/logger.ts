import {createLogger, format, transports} from 'winston';

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    format.errors({stack: true}),
    // TODO: Create Custom Message by print meta
    format.simple(),
  ),
  defaultMeta: {service: 'elara-server'},
  exitOnError: false,
  transports: [
    new transports.Console({
      handleExceptions: true,
    }),
    new transports.File({
      filename: 'log/error.log',
      level: 'error',
      handleExceptions: true,
      maxsize: 5242880,
      maxFiles: 10,
    }),
    new transports.File({
      filename: 'log/combined.log',
      
    }),
  ],
});

export default logger;
