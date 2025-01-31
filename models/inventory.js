const Joi = require('joi');
const pool = require('../config/db');
const logger = require('../utils/logger'); // Import the logger

// Joi schema for validation
const inventorySchemaInsertion = Joi.object({
    items: Joi.array().items(
        Joi.object({
            price: Joi.number().positive().precision(2).required(),
            stock: Joi.number().integer().min(0).required(),
            size: Joi.string().max(20).optional(),     // Size as optional
            color: Joi.string().max(30).optional(),    // Color as optional
            sku: Joi.string().max(255).required(),
            productid: Joi.number().integer().min(0).required()
        })
    ).min(1).required() // At least one item is required
});


const inventorySchemaDeletion = Joi.object({
    sku: Joi.string().max(50).required()
});

const inventorySchemaUpdate = Joi.object({
    item_name: Joi.string().max(255).optional(),
    description: Joi.string().max(500).optional(),
    price: Joi.number().positive().precision(2).optional(),
    stock: Joi.number().integer().min(0).optional(),
    design_no: Joi.string().max(50).optional(),
    size: Joi.string().max(20).optional(),
    color: Joi.string().max(30).optional(),
    category_id: Joi.number().optional()
});


const inventorySchemaBulkUpdate = Joi.array().items(
    Joi.object({
        barcode: Joi.string().required(),
        item_name: Joi.string().max(255).optional(),
        description: Joi.string().max(500).optional(),
        price: Joi.number().positive().precision(2).optional(),
        stock: Joi.number().integer().min(0).optional(),
        design_no: Joi.string().max(50).optional(),
        size: Joi.string().max(20).optional(),
        color: Joi.string().max(30).optional(),
        category_id: Joi.number().optional()
    })
);

// Inventory operations
const Inventory = {
    // Fetch all inventory items
    getAll: async () => {
        logger.info("Running SQL Query to fetch all inventory items");
        const result = await pool.query(`SELECT pv.id as variantID, pv.product_id, pv.size, pv.color, 
            pv.price, pv.sku, pv.shopify_variant_id, pv.barcode, i.id as inventoryID, i.stock, 
            i.shopify_inventory_item_id, p.item_name, p.description, p.design_no, p.category_id, 
            p.shopify_product_id, p.is_published_to_shopify, c.name as CategoryName
            FROM productvariants pv
            INNER JOIN inventory i on pv.id = i.product_variant_id
            INNER JOIN product p on pv.product_id = p.id
            INNER JOIN categories c on c.id = p.category_id
`);
        logger.info("Returning all inventory items");
        return result.rows;
    },

// Check if SKU exists in the productvariants table
    checkSKUExists: async (sku) => {
    try {
        const result = await pool.query(
            `SELECT id FROM productvariants WHERE sku = $1`,
            [sku]
        );
        return result.rows.length > 0;
    } catch (error) {
        logger.error(`Error checking SKU existence for SKU = ${sku}: ${error.message}`);
        throw error;
    }
},

// Add or update multiple inventory items
    addOrUpdateMultiple: async (items) => {
    logger.info(`Starting transaction to add or update multiple Product Variants and Inventory items.`);

    const client = await pool.connect(); // Get a client for the transaction

    try {
        // Start transaction
        await client.query('BEGIN');

        for (const item of items) {
            const { productid, price, stock, size, color, sku, barcode } = item;

            logger.info(`Running UPSERT query for Product Variant with the following values:
                            product_id = ${productid} 
                            price = ${price}
                            size = ${size}
                            color = ${color}
                            barcode = ${barcode || 'SKIPPING'} 
                            sku = ${sku}`);
            
            // UPSERT for ProductVariants table (insert if doesn't exist, update if it exists)
            const variantResult = await client.query(
                `INSERT INTO productvariants 
                    (product_id, price, size, color, sku, barcode) 
                 VALUES ($1, $2, $3, $4, $5, $6) 
                 ON CONFLICT (sku) 
                 DO UPDATE SET 
                    price = EXCLUDED.price, 
                    size = EXCLUDED.size, 
                    color = EXCLUDED.color 
                 RETURNING id`,
                [productid, price, size, color, sku, barcode] // Barcode only used for new inserts, not updates
            );

            const variantId = variantResult.rows[0].id;
            logger.info(`Product Variant (ID = ${variantId}) added/updated successfully for SKU = ${sku}.`);

            // Check if an inventory record exists for this variant
            const inventoryResult = await client.query(
                `SELECT id FROM inventory WHERE product_variant_id = $1`,
                [variantId]
            );

            if (inventoryResult.rows.length > 0) {
                // If inventory exists, update the stock
                logger.info(`Inventory exists for Product Variant ID = ${variantId}. Running UPDATE query for stock.`);
                
                await client.query(
                    `UPDATE inventory 
                     SET stock = $1 
                     WHERE product_variant_id = $2`,
                    [stock, variantId]
                );
                
                logger.info(`Inventory stock updated successfully for Product Variant ID = ${variantId}.`);
            } else {
                // If no inventory exists, insert a new record
                logger.info(`No inventory record exists for Product Variant ID = ${variantId}. Running INSERT query.`);

                await client.query(
                    `INSERT INTO inventory 
                        (product_variant_id, stock, reserved_stock, incoming_stock) 
                     VALUES ($1, $2, $3, $4)`,
                    [variantId, stock, 0, 0] // stock from the item, reserved_stock = 0, incoming_stock = 0
                );

                logger.info(`Inventory inserted successfully for Product Variant ID = ${variantId} with stock = ${stock}.`);
            }
        }

        // Commit the transaction if all inserts/updates succeed
        await client.query('COMMIT');

        logger.info(`Transaction committed successfully for all items.`);
    } catch (error) {
        // Roll back the transaction in case of an error
        await client.query('ROLLBACK');
        logger.error(`Transaction rolled back due to error: ${error.message}`);
        throw error;
    } finally {
        // Release the client back to the pool
        client.release();
    }
}
,
    // Update inventory
    update: async (barcode, updatedFields) => {
        logger.info(`Preparing to update inventory for barcode: ${barcode}`);

        // Build dynamic SET clause based on provided fields
        const setClause = Object.keys(updatedFields)
            .map((key, index) => `${key} = $${index + 1}`)
            .join(', ');

        const values = Object.values(updatedFields);

        logger.info(
            `Running UPDATE query with SET clause: ${setClause} and values: ${JSON.stringify(values)}`
        );

        const result = await pool.query(
            `UPDATE product SET ${setClause} WHERE barcode = $${values.length + 1}`,
            [...values, barcode]
        );

        logger.info(`Rows updated: ${result.rowCount}`);
        return result.rowCount; // Return the number of rows updated
    },

    // Update inventory stock
    updateStock: async (barcode, newStock) => {
            await pool.query(`
                                UPDATE inventory 
                                SET stock = $1 
                                FROM productvariants 
                                WHERE inventory.product_variant_id = productvariants.id 
                                AND productvariants.barcode = $2
                            `, [newStock, barcode]);
    },

    // Fetch a single inventory item by name
    getByName: async (item_name) => {
        logger.info(`Running SELECT query to fetch item by name: ${item_name}`);
        const result = await pool.query('SELECT * FROM product WHERE item_name = $1', [item_name]);
        return result.rows[0];
    },

    getByProductID: async (productid) => {
        logger.info(`Running SELECT query to fetch inventory by productid: ${productid}`);
        const result = await pool.query(
            `SELECT 
             pv.id as variantID, pv.product_id, pv.size, pv.color, pv.price, pv.sku, pv.shopify_variant_id, 
             pv.barcode, i.id as inventoryID , i.stock, i.shopify_inventory_item_id 
             FROM productvariants pv 
             INNER JOIN inventory i on pv.id = i.product_variant_id 
             where product_id = $1`,
            [productid]
        );
       // console.log(result.rows);
        
        return result.rows; 
    },

    delete: async (sku) => {
        logger.info(`Running DELETE query to delete variant by sku: ${sku}`);
        const result = await pool.query('DELETE FROM productvariants WHERE sku = $1', [sku]);
        return result.rowCount;
    },

    getByCategoryId: async (category_id) => {
        logger.info(`Running SELECT query to fetch items by category_id: ${category_id}`);
        const result = await pool.query(
            'SELECT p.id, p.item_name, p.design_no, p.category_id, c.name as CategoryName FROM product p INNER JOIN categories c on p.category_id = c.id WHERE p.category_id = $1 ORDER BY p.id DESC',
            [category_id]
        );
        return result.rows;
    },

    // Fetch product variant and inventory stock by barcode
    getByBarcodeWithStock: async (barcode) => {
        logger.info(`Fetching product variant and inventory stock for barcode: ${barcode}`);
        try {
            const result = await pool.query(
                `SELECT pv.id as variantID, pv.product_id, pv.size, pv.color, pv.price, pv.sku, pv.barcode, 
                        i.id as inventoryID, i.stock 
                 FROM productvariants pv
                 INNER JOIN inventory i ON pv.id = i.product_variant_id
                 WHERE pv.barcode = $1`,
                [barcode]
            );
            return result.rows[0]; // Return the first matching row
        } catch (error) {
            logger.error(`Error fetching product variant and inventory stock for barcode ${barcode}: ${error.message}`);
            throw error;
        }
    },
};

module.exports = { Inventory, inventorySchemaInsertion, inventorySchemaDeletion, inventorySchemaUpdate, inventorySchemaBulkUpdate};
