const express = require('express');
const { Category, categorySchemaInsertion, categorySchemaUpdate } = require('../models/category');
const logger = require('../utils/logger');

const router = express.Router();

// Add a new category
router.post('/', async (req, res) => {
    logger.info("*************** Category Post Route ***************") 

    logger.info('Add Category API called');
    const { error } = categorySchemaInsertion.validate(req.body);
    if (error) {
        logger.error('Validation error adding category', { error: error.details[0].message });
        return res.status(400).json({ error: error.details[0].message });
    }

    try {
        const category = await Category.add(req.body);
        res.status(201).json({ message: 'Category added successfully', category });
    } catch (err) {
        res.status(500).json({ error: 'Failed to add category' });
    }
});

// Update an existing category
router.put('/', async (req, res) => {

    logger.info("*************** Category Put/Update Route ***************") 

    logger.info('Update Category API called');
    const { error } = categorySchemaUpdate.validate(req.body);
    if (error) {
        logger.error('Validation error updating category', { error: error.details[0].message });
        return res.status(400).json({ error: error.details[0].message });
    }

    try {
        const category = await Category.update(req.body);
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }
        res.status(200).json({ message: 'Category updated successfully', category });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update category' });
    }
});

// Delete a category
router.delete('/:id', async (req, res) => {
    logger.info("*************** Category Delete Route ***************") 

    logger.info('Delete Category API called', { id: req.params.id });
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
        logger.error('Invalid ID for deleting category');
        return res.status(400).json({ error: 'Invalid category ID' });
    }

    try {
        const category = await Category.delete(id);
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }
        res.status(200).json({ message: 'Category deleted successfully', category });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete category' });
    }
});

// Fetch all categories
router.get('/', async (req, res) => {
    logger.info("*************** Category Get All Route ***************") 

    logger.info('Fetch All Categories API called');
    try {
        const categories = await Category.getAll();
        res.status(200).json({ categories });
    } catch (error) {
        logger.error('Error fetching categories', { error: error.message });
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

// Fetch a category by ID
router.get('/:id', async (req, res) => {
    logger.info("*************** Category Get By ID Route ***************") 

    logger.info('Fetch Category by ID API called', { id: req.params.id });
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
        logger.error('Invalid ID for fetching category');
        return res.status(400).json({ error: 'Invalid category ID' });
    }

    try {
        const category = await Category.getById(id);
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }
        res.status(200).json({ category });
    } catch (error) {
        logger.error('Error fetching category by ID', { error: error.message });
        res.status(500).json({ error: 'Failed to fetch category' });
    }
});

module.exports = router;
