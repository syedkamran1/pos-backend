const jwt = require('jsonwebtoken');
const pool = require('../config/db');

module.exports = (requiredRole = null) => {
    return async (req, res, next) => {
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ message: 'Unauthorized' });

        const token = authHeader.split(' ')[1];

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
           
            req.user = decoded;
            
           
            // If a role is required, validate the user's role
            if (requiredRole) {
                const roleResult = await pool.query('SELECT name FROM roles WHERE id = $1', [req.user.role_id]);
                const roleName = roleResult.rows[0]?.name;
            
                if (roleName !== requiredRole) {
                    return res.status(403).json({ message: 'Forbidden' });
                }
            }

            next();
        } catch (error) {
            res.status(401).json({ message: 'Invalid tokennn' });
        }
    };
};
