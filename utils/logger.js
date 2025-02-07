const { createLogger, format, transports } = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// Define a date pattern for the filenames
const datePattern = 'DD_MM_YYYY'; // e.g., 25_11_2024

// Custom format to capture filename and line number
const customFormat = format((info) => {
    // Create an Error object to capture the stack trace
    const stackTrace = new Error().stack;

    // Log the full stack trace for debugging
    //console.log('Full Stack Trace:\n', stackTrace);

    // Split the stack trace into lines
    const stackLines = stackTrace.split('\n');

    // Iterate through the stack trace lines to find the first valid caller line
    for (let i = 0; i < stackLines.length; i++) {
        //console.log("---------------------------------")
        const line = stackLines[i];
        //console.log('Stack Line:', line);

        // Skip lines that include Winston, Node.js internals, or the logger module
        if (
            !line.includes('node:internal') && // Skip Node.js internals
            !line.includes('winston') && // Skip Winston internals
            !line.includes('logger.js') && // Skip the logger module
            !line.includes('logform') && // Skip Winston's logform module
            !line.includes('readable-stream') && // Skip readable-stream (used by Winston)
            line.includes('at') // Ensure it's a stack trace line
        ) {
            // Extract filename and line number from the caller line
            const match = line.match(/at\s+(?:.+?\s+)?\(?(.+):(\d+):\d+\)?/); // Match filename and line number
            //console.log('Match:', match);
            if (match) {
                info.filename = path.basename(match[1]); // Get the filename
                info.lineNumber = match[2]; // Get the line number
                //console.log('Filename:', info.filename);
                //console.log('Line Number:', info.lineNumber);
                break; // Stop after finding the first valid caller line
            }
        }
    }

    // If no valid caller line was found, set default values
    if (!info.filename || !info.lineNumber) {
        info.filename = 'unknown';
        info.lineNumber = 'unknown';
    }

    return info;
});

// Define the logger format
const logFormat = format.printf(({ timestamp, level, message, filename, lineNumber, ...metadata }) => {
    let logMessage = `${timestamp} [${level.toUpperCase()}] ${filename}:${lineNumber}: ${message}`;

    // Check if metadata exists, and log it as a JSON string
    if (Object.keys(metadata).length) {
        logMessage += ` ${JSON.stringify(metadata)}`;
    }

    return logMessage;
});

const logger = createLogger({
    level: 'info', // Default log level
    format: format.combine(
        customFormat(), // Use the custom format to capture filename and line number
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