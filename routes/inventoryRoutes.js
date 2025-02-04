const express = require('express');
const logger = require('../utils/logger'); // Import the logger
const pool = require('../config/db');
const { Inventory, inventorySchemaInsertion, inventorySchemaDeletion, inventorySchemaUpdate, inventorySchemaBulkUpdate} = require('../models/inventory');
const generateBarcodeText = require('../utils/generateBarcodeText')

const router = express.Router();

// Get all inventory items
router.get('/', async (req, res) => {
    logger.info("*************** Inventory Get All Route ***************") 
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

// Add or Update inventory item
router.post('/', async (req, res) => {
    logger.info("*************** Inventory Post Route ***************");

    logger.info('In Add Inventory Route, going to validate schema...');
    const { error } = inventorySchemaInsertion.validate(req.body);

    if (error) {
        logger.error(`Validation failed for adding inventory: ${error.message}`);
        return res.status(400).json({ error: error.details[0].message });
    }

    try {
        logger.info('Schema validated successfully!');
        
        const items = req.body.items; // Expecting an array of items in the request
        logger.info(`Received ${items.length} items for inventory addition or update.`);

        // Check if SKU exists for each item and generate barcode only for new SKUs
        for (const item of items) {
            const skuExists = await Inventory.checkSKUExists(item.sku); 
            if (skuExists) {
                logger.info(`SKU ${item.sku} already exists, skipping barcode generation.`);
            } else {
                item.barcode = generateBarcodeText(item.sku);
                logger.info(`Generated barcode successfully for SKU ${item.sku}: ${item.barcode}`);
            }
        }

        await Inventory.addOrUpdateMultiple(items); // Call the new function to add or update
        logger.info('All inventory items processed successfully (added/updated)!');
        res.status(201).json({ message: 'All inventory items processed successfully (added/updated)!' });
    } catch (error) {
        logger.error(`Error while processing inventory: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
});



router.delete('/', async (req, res) => {
    logger.info("*************** Inventory Delete Route ***************") 

    logger.info(`In Delete Inventory Route, going to validate schema....`);
    const { error } = inventorySchemaDeletion.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    try {
        logger.info(`Schema Validated`);
        const rowCount = await Inventory.delete(req.body.sku);
        if (rowCount == 0)
           {
            logger.info(`No variant found with sku = ` + req.body.sku);
            message = "No variant found with sku " + req.body.sku;
            return res.status(404).json({ message: message }); 
            }
        else
            {
            logger.info(`variant with sku = ` + req.body.sku + ` deleted successfully!`);
            message = 'variant deleted successfully!'
            }

        res.status(200).json({ message: message });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }


});

router.get('/:productid', async (req, res) => {
    logger.info("*************** Inventory Get by productid Route ***************")
    const { productid } = req.params;

    logger.info(`GET /:productid request received for productid: ${productid}`);

    try {
        const product = await Inventory.getByProductID(productid);
        if (!product) {
            logger.warn(`Product not found for productid: ${productid}`);
            return res.status(404).json({ error: 'Product not found.' });
        }
       // console.log(product);
        

        logger.info(`Inventory fetched successfully for productid: ${productid}`, product);
        res.json(product);
    } catch (error) {
        logger.error(`Error fetching product for productid: ${productid}`, { error: error.message });
        res.status(500).json({ error: error.message }); 
    }
});


router.get('/GetPrice/:Barcode', async (req, res) => {
    logger.info("*************** Inventory Get by Barcode Route ***************")
    const { Barcode } = req.params;

    logger.info(`GET /:Barcode request received for Barcode: ${Barcode}`);

    try {
        const product = await Inventory.getByBarcode(Barcode);
        if (!product) {
            logger.warn(`Product not found for Barcode: ${Barcode}`);
            return res.status(404).json({ error: 'Product not found.' });
        }
       // console.log(product);
        

        logger.info(`Inventory fetched successfully for Barcode: ${Barcode}`, product);
        res.json(product);
    } catch (error) {
        logger.error(`Error fetching product for Barcode: ${Barcode}`, { error: error.message });
        res.status(500).json({ error: error.message }); 
    }
});


router.put('/:barcode', async (req, res) => {
    logger.info("*************** Inventory update by Barcode Route ***************")
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
