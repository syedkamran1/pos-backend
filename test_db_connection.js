const pool = require('./config/db');

(async () => {
    try {
        // Test the connection by querying the database
        const result = await pool.query('SELECT NOW() AS current_time');
        console.log('Database connection successful!');
        console.log('Current Database Time:', result.rows[0].current_time);
    } catch (error) {
        console.error('Database connection failed:', error.message);
    } finally {
        // Close the pool
        await pool.end();
    }
})();
