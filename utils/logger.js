const { createLogger, format, transports } = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');

// Define a date pattern for the filenames
const datePattern = 'DD_MM_YYYY'; // e.g., 25_11_2024

// Define the logger format
const logFormat = format.printf(({ timestamp, level, message, ...metadata }) => {
    let logMessage = `${timestamp} [${level.toUpperCase()}]: ${message}`;

    // Check if metadata exists, and log it as a JSON string
    if (Object.keys(metadata).length) {
        logMessage += ` ${JSON.stringify(metadata)}`;
    }

    return logMessage;
});

const logger = createLogger({
    level: 'info', // Default log level
    format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        logFormat // Use the custom log format with metadata
    ),
    transports: [
        new DailyRotateFile({
            filename: `logs/combined_%DATE%.log`, // Pattern for combined logs
            datePattern: datePattern,
            level: 'info', // Log level
            maxFiles: '30d', // Retain logs for 30 days
            auditFile: 'logs/audit/combined-audit.json'
        }),
        new DailyRotateFile({
            filename: `logs/error_%DATE%.log`, // Pattern for error logs
            datePattern: datePattern,
            level: 'error', // Only errors
            maxFiles: '30d',
            auditFile: 'logs/audit/error-audit.json'
        }),
    ],
});

// Handle unhandled exceptions with daily rotation
logger.exceptions.handle(
    new DailyRotateFile({
        filename: `logs/exceptions_%DATE%.log`, // Pattern for exception logs
        datePattern: datePattern,
        maxFiles: '30d',
        auditFile: 'logs/audit/exceptions-audit.json'
    })
);

module.exports = logger;

