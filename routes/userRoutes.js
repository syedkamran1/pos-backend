const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');
const {User, userLoginSchema, userRegistrationSchema} = require('../models/user');
const logger = require('../utils/logger'); // Import the logger

const router = express.Router();

// Register a new user (Admin only)
router.post('/register', authMiddleware('admin'), async (req, res) => {
    logger.info("*************** User Post Admin Only Route ***************") 
    const { first_name, last_name, username, password, email } = req.body;

    logger.info('Register API called by Admin.');

      // Validate request body
    logger.info(`Going to validate incoming fields..`);
    const { error } = userRegistrationSchema.validate(req.body);

    if (error) {
          logger.error(`Validation failed: ${error.details[0].message}`);
          return res.status(400).json({ error: error.details[0].message });
      }

    try { 
        logger.info(`Validated fields.`);
        const newUser = await User.register(first_name, last_name, username, password, email);
        logger.info(`User ${username} registered successfully by Admin.`);
        res.status(201).json({ message: 'User created successfully', user: newUser });
    } catch (error) {
        logger.error(`Failed to register user: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
});


// Authenticate user and issue JWT

router.post('/login', async (req, res) => {
    logger.info("*************** User Post login Route ***************") 
    const { username, password } = req.body;
    logger.info(`Login attempt for user: ${username}`); // Log login attempt

    logger.info(`Going to validate incoming fields..`);
    const { error } = userLoginSchema.validate(req.body);
    if (error) 
        {
            logger.error(`Error Validating user: ${error.message}`);
            return res.status(400).json({ error: error.details[0].message });
        }
    
    try {
        logger.info(`Validated fields.`);
        // Fetch user from the database
        const user = await User.findByUsername(username);

        if (!user) {
            logger.warn(`Login failed for user: ${username} - User not found`);
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Validate password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            logger.warn(`Login failed for user: ${username} - Invalid password`);
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate JWT
        const token = jwt.sign({ id: user.id, role_id: user.role_id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        logger.info(`Login successful for user: ${username}`);

        res.json({ message: 'Login successful', token });
    } catch (error) {
        logger.error(`Error during login for user: ${username} - ${error.message}`);
        res.status(500).json({ error: error.message });
    }
});
module.exports = router;
