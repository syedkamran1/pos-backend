const Joi = require('joi');
const pool = require('../config/db');
const logger = require('../utils/logger');

// Joi schema for validations
const categorySchemaInsertion = Joi.object({
    name: Joi.string().max(255).required(),
    description: Joi.string().optional(),
});

const categorySchemaUpdate = Joi.object({
    id: Joi.number().integer().required(),
    name: Joi.string().max(255).optional(),
    description: Joi.string().optional(),
});

// Category operations
const Category = {
    // Add a new category
    add: async (data) => {
        logger.info('Adding a new category', { data });
        const { name, description } = data;
        try {
            const result = await pool.query(
                'INSERT INTO categories (name, description, created_at, updated_at) VALUES ($1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING *',
                [name, description]
            );
            logger.info('Category added successfully', { category: result.rows[0] });
            return result.rows[0];
        } catch (error) {
            logger.error('Error adding category', { error: error.message });
            throw error;
        }
    },

    // Update a category
    update: async (data) => {
        logger.info('Updating category', { data });
        const { id, name, description } = data;
        try {
            const result = await pool.query(
                'UPDATE categories SET name = COALESCE($2, name), description = COALESCE($3, description), updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
                [id, name, description]
            );
            if (result.rowCount === 0) {
                logger.warn('Category not found for update', { id });
                return null;
            }
            logger.info('Category updated successfully', { category: result.rows[0] });
            return result.rows[0];
        } catch (error) {
            logger.error('Error updating category', { error: error.message });
            throw error;
        }
    },

    // Delete a category
    delete: async (id) => {
        logger.info('Deleting category', { id });
        try {
            const result = await pool.query('DELETE FROM categories WHERE id = $1 RETURNING *', [id]);
            if (result.rowCount === 0) {
                logger.warn('Category not found for deletion', { id });
                return null;
            }
            logger.info('Category deleted successfully', { category: result.rows[0] });
            return result.rows[0];
        } catch (error) {
            logger.error('Error deleting category', { error: error.message });
            throw error;
        }
    },

     // Fetch all categories
     getAll: async () => {
        logger.info('Fetching all categories');
        try {
            const result = await pool.query('SELECT * FROM categories ORDER BY id');
            logger.info('Fetched categories successfully', { count: result.rowCount });
            return result.rows;
        } catch (error) {
            logger.error('Error fetching categories', { error: error.message });
            throw error;
        }
    },

    // Fetch a single category by ID
    getById: async (id) => {
        logger.info('Fetching category by ID', { id });
        try {
            const result = await pool.query('SELECT * FROM categories WHERE id = $1', [id]);
            if (result.rowCount === 0) {
                logger.warn('Category not found', { id });
                return null;
            }
            logger.info('Fetched category successfully', { category: result.rows[0] });
            return result.rows[0];
        } catch (error) {
            logger.error('Error fetching category by ID', { error: error.message });
            throw error;
        }
    },
};

module.exports = { Category, categorySchemaInsertion, categorySchemaUpdate };
