const express = require('express');
const logger = require('../utils/logger'); // Import the logger
const pool = require('../config/db');
const { Product, productSchemaInsertion, productSchemaDeletion, productSchemaUpdate, productSchemaBulkUpdate} = require('../models/product');
const router = express.Router();

// Get all products
router.get('/', async (req, res) => {
    logger.info("*************** Product Get Route ***************") 
    try {
        logger.info('Going to fetch Product data');
        const items = await Product.getAll();
        logger.info('Fetched products data successfully');
        res.json({ products: items });
        
    } catch (error) {
        logger.error(`Error fetching inventory: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
});

// Add a new product
router.post('/', async (req, res) => {
    logger.info("*************** Product Post Route ***************") 

    logger.info('In Add Product Route, going to validate schema...');
    const { error } = productSchemaInsertion.validate(req.body);

    if (error) {
        logger.error(`Validation failed for adding product: ${error.message}`);
        return res.status(400).json({ error: error.details[0].message });
    }

    try {
        logger.info('Schema validated successfully!');

        await Product.add(req.body);
        logger.info('Product added successfully!');
        res.status(201).json({ message: 'Product added successfully!' });
    } catch (error) {
        logger.error(`Error while adding Product: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
});


router.delete('/', async (req, res) => {
    logger.info("*************** Product Delete Route ***************") 

    logger.info(`In Delete Product Route, going to validate schema....`);
    const { error } = productSchemaDeletion.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    try {
        logger.info(`Schema Validated`);
        const rowCount = await Product.delete(req.body.id);
        if (rowCount == 0)
           {
            logger.info(`No product found with ID = ` + req.body.id);
            message = "No product found with ID " + req.body.id;
            return res.status(404).json({ message: message }); 
            }
        else
            {
            logger.info(`Product with ID = ` + req.body.id + ` deleted successfully!`);
            message = 'Product deleted successfully!'
            }

        res.status(200).json({ message: message });
    } catch (error) {
        logger.info(error.message);
        res.status(500).json({ error: error.message });
    }


});

router.put('/:id', async (req, res) => {
    logger.info("*************** Product update by id Route ***************")
    const { id } = req.params;
    const updatedFields = req.body;

    logger.info(`In Update Product Route for id: ${id}, validating schema...`);

    // Validate the request body
    const { error } = productSchemaUpdate.validate(updatedFields);
    if (error) {
        logger.error(`Validation failed for updating product: ${error.message}`);
        return res.status(400).json({ error: error.details[0].message });
    }

    try {
        logger.info('Schema validated successfully. Proceeding with update...');

        // Check if there are any fields to update
        if (Object.keys(updatedFields).length === 0) {
            logger.warn('No fields provided to update.');
            return res.status(400).json({ error: 'No fields provided to update.' });
        }

        // Update the inventory
        const updatedCount = await Product.update(id, updatedFields);

        if (updatedCount === 0) {
            logger.warn(`No product found with id: ${id}`);
            return res.status(404).json({ error: 'product not found.' });
        }

        logger.info(`product with id: ${id} updated successfully.`);
        res.status(200).json({ message: 'product updated successfully!' });
    } catch (error) {
        logger.error(`Error while updating product: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
});

//Bulk Update
router.put('/', async (req, res) => {
    logger.info("*************** Inventory Bulk update Route ***************")
    const updates = req.body;

    logger.info('In Bulk Update Inventory Route, validating schema...');

    // Validate the request body using Joi
    const { error } = inventorySchemaBulkUpdate.validate(updates);
    if (error) {
        logger.error(`Validation failed for bulk update: ${error.message}`);
        return res.status(400).json({ error: error.details[0].message });
    }

    try {
        logger.info('Schema validated successfully. Proceeding with bulk update...');

        // Begin transaction
        await pool.query('BEGIN');

        for (const update of updates) {
            const { barcode, ...fieldsToUpdate } = update;

            // Check if there are any fields to update
            if (Object.keys(fieldsToUpdate).length === 0) {
                logger.warn(`No fields provided to update for barcode: ${barcode}`);
                continue; // Skip this entry
            }

            logger.info(`Updating product with barcode: ${barcode}`);
            const updatedCount = await Inventory.update(barcode, fieldsToUpdate);

            if (updatedCount === 0) {
                logger.warn(`No inventory item found with barcode: ${barcode}`);
            } else {
                logger.info(`Inventory item with barcode: ${barcode} updated successfully.`);
            }
        }

        // Commit transaction
        await pool.query('COMMIT');
        logger.info('Bulk update completed successfully.');
        res.status(200).json({ message: 'Bulk update completed successfully!' });
    } catch (error) {
        // Rollback transaction in case of an error
        await pool.query('ROLLBACK');
        logger.error(`Error while performing bulk update: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
});


router.get('/categoryid/:category_id', async (req, res) => {
    logger.info("*************** Inventory Get by Category ID Route ***************")
    const { category_id } = req.params;

    logger.info(`GET /categoryid/:category_id request received for category_id: ${category_id}`);

    try {
        const products = await Inventory.getByCategoryId(category_id);
        if (!products || products.length === 0) {
            logger.warn(`No products found for category_id: ${category_id}`);
            return res.status(404).json({ error: 'No products found for this category.' });
        }

        logger.info(`Products fetched successfully for category_id: ${category_id}`);
        res.json({ products });
    } catch (error) {
        logger.error(`Error fetching products for category_id: ${category_id}`, { error: error.message });
        res.status(500).json({ error: error.message });
    }
});



module.exports = router;
