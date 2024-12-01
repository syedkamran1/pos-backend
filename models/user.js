const Joi = require('joi');
const pool = require('../config/db');
const logger = require('../utils/logger'); // Import the logger
const bcrypt = require('bcrypt');


// Joi schema for validation
const userLoginSchema = Joi.object({
    username: Joi.string().max(255).required(),
    password: Joi.string().max(500).required(), 
});

const userRegistrationSchema = Joi.object({
    first_name: Joi.string().max(255).required(),
    last_name: Joi.string().max(255).required(), 
    username: Joi.string().min(2).max(30).required(), 
    password: Joi.string().min(6).max(255).required(), 
    email: Joi.string().email()
});




const User = {
    // Find a user by username
    findByUsername: async (username) => {
        try {
            logger.info(`Attempting to find user by username: ${username}`);
            const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
            if (result.rows.length === 0) {
                logger.warn(`User not found for username: ${username}`);
                return null;
            }
            logger.info(`User found for username: ${username}`);
            return result.rows[0];
        } catch (error) {
            logger.error(`Error fetching user by username: ${username} - ${error.message}`);
            throw new Error('Error fetching user by username: ' + error.message);
        }
    },
    // Register a new user
    register: async (first_name, last_name, username, password, email) => {
        try {
            logger.info(`Attempting to register user: ${username}`);
            
            // Hash the password
            const hashedPassword = await bcrypt.hash(password, 10);
            logger.info(`Password hashed successfully for user: ${username}`);

            // Insert the new user into the database
            const result = await pool.query(
                'INSERT INTO users (first_name, last_name, username, password, email, role_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
                [first_name, last_name, username, hashedPassword, email, 2]
            );

            logger.info(`User ${username} registered successfully.`);
           // console.log(result)
            return result.rows[0];
        } catch (error) {
            logger.error(`Error registering user ${username}: ${error.message}`);
            throw new Error('Error registering user: ' + error.message);
        }
    },
} 

module.exports = {User, userLoginSchema,userRegistrationSchema};
