const express = require('express');
const logger = require('../utils/logger'); // Import the logger
const pool = require('../config/db');
const { Inventory, inventorySchemaInsertion, inventorySchemaDeletion, inventorySchemaUpdate, inventorySchemaBulkUpdate} = require('../models/inventory');
const generateBarcodeText = require('../utils/generateBarcodeText')

const router = express.Router();

// Get all inventory items
router.get('/', async (req, res) => {
    try {
        logger.info('Going to fetch inventory data');
        const items = await Inventory.getAll();
        logger.info('Fetched inventory data successfully');
        res.json({ inventory: items });
        
    } catch (error) {
        logger.error(`Error fetching inventory: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
});

// Add a new inventory item
router.post('/', async (req, res) => {
    logger.info('In Add Inventory Route, going to validate schema...');
    const { error } = inventorySchemaInsertion.validate(req.body);

    if (error) {
        logger.error(`Validation failed for adding inventory: ${error.message}`);
        return res.status(400).json({ error: error.details[0].message });
    }

    try {
        logger.info('Schema validated successfully!');
        logger.info(`Going to generate barcode for item name: ${req.body.item_name}`);

        const barcode = generateBarcodeText(req.body.item_name);
        logger.info(`Generated barcode successfully: ${barcode}`);

        await Inventory.add(req.body, barcode);
        logger.info('Inventory item added successfully!');
        res.status(201).json({ message: 'Inventory item added successfully!' });
    } catch (error) {
        logger.error(`Error while adding inventory: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
});


router.delete('/', async (req, res) => {
    
    logger.info(`In Delete Inventory Route, going to validate schema....`);
    const { error } = inventorySchemaDeletion.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    try {
        logger.info(`Schema Validated`);
        const rowCount = await Inventory.delete(req.body.barcode);
        if (rowCount == 0)
           {
            logger.info(`No product found with barcode = ` + req.body.barcode);
            message = "No product found with barcode " + req.body.barcode;
            return res.status(404).json({ message: message }); 
            }
        else
            {
            logger.info(`Inventory item with barcode = ` + req.body.barcode + ` deleted successfully!`);
            message = 'Inventory item deleted successfully!'
            }

        res.status(200).json({ message: message });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }


});

router.get('/:barcode', async (req, res) => {
    const { barcode } = req.params;

    logger.info(`GET /:barcode request received for barcode: ${barcode}`);

    try {
        const product = await Inventory.getByBarcode(barcode);
        if (!product) {
            logger.warn(`Product not found for barcode: ${barcode}`);
            return res.status(404).json({ error: 'Product not found.' });
        }
       // console.log(product);
        

        logger.info(`Product fetched successfully for barcode: ${barcode}`, product);
        res.json(product);
    } catch (error) {
        logger.error(`Error fetching product for barcode: ${barcode}`, { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

router.put('/:barcode', async (req, res) => {
    const { barcode } = req.params;
    const updatedFields = req.body;

    logger.info(`In Update Inventory Route for barcode: ${barcode}, validating schema...`);

    // Validate the request body
    const { error } = inventorySchemaUpdate.validate(updatedFields);
    if (error) {
        logger.error(`Validation failed for updating inventory: ${error.message}`);
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
        const updatedCount = await Inventory.update(barcode, updatedFields);

        if (updatedCount === 0) {
            logger.warn(`No inventory item found with barcode: ${barcode}`);
            return res.status(404).json({ error: 'Inventory item not found.' });
        }

        logger.info(`Inventory item with barcode: ${barcode} updated successfully.`);
        res.status(200).json({ message: 'Inventory item updated successfully!' });
    } catch (error) {
        logger.error(`Error while updating inventory: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
});

//Bulk Update
router.put('/', async (req, res) => {
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


module.exports = router;
