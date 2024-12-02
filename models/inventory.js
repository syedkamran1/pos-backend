const Joi = require('joi');
const pool = require('../config/db');
const logger = require('../utils/logger'); // Import the logger

// Joi schema for validation
const inventorySchemaInsertion = Joi.object({
    item_name: Joi.string().max(255).required(),
    description: Joi.string().max(500).required(),
    price: Joi.number().positive().precision(2).required(),
    stock: Joi.number().integer().min(0).required(),
    design_no: Joi.string().max(50).optional(), // Design number as optional
    size: Joi.string().max(20).optional(),     // Size as optional
    color: Joi.string().max(30).optional(),    // Color as optional
});

const inventorySchemaDeletion = Joi.object({
    barcode: Joi.string().max(50).required()
});

const inventorySchemaUpdate = Joi.object({
    item_name: Joi.string().max(255).optional(),
    description: Joi.string().max(500).optional(),
    price: Joi.number().positive().precision(2).optional(),
    stock: Joi.number().integer().min(0).optional(),
    design_no: Joi.string().max(50).optional(),
    size: Joi.string().max(20).optional(),
    color: Joi.string().max(30).optional(),
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
    })
);

// Inventory operations
const Inventory = {
    // Fetch all inventory items
    getAll: async () => {
        logger.info("Running SQL Query to fetch all inventory items");
        const result = await pool.query('SELECT * FROM product ORDER BY ID DESC');
        logger.info("Returning all inventory items");
        return result.rows;
    },

    // Add a new inventory item
    add: async (item, barcode) => {
        const { item_name, description, price, stock, design_no, size, color } = item;

        logger.info(`Running INSERT query with the following values: 
                     item_name = ${item_name}
                     description = ${description}
                     price = ${price}
                     stock = ${stock}
                     design_no = ${design_no}
                     size = ${size}
                     color = ${color}
                     barcode = ${barcode}`);

        await pool.query(
            'INSERT INTO product (item_name, description, price, stock, design_no, size, color, barcode) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
            [item_name, description, price, stock, design_no, size, color, barcode]
        );
        logger.info(`INSERT query executed successfully.`);
    },

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
            await pool.query('UPDATE product SET stock = $1 WHERE barcode = $2', [newStock, barcode]);
    },

    // Fetch a single inventory item by name
    getByName: async (item_name) => {
        logger.info(`Running SELECT query to fetch item by name: ${item_name}`);
        const result = await pool.query('SELECT * FROM product WHERE item_name = $1', [item_name]);
        return result.rows[0];
    },

    getByBarcode: async (barcode) => {
        logger.info(`Running SELECT query to fetch item by barcode: ${barcode}`);
        const result = await pool.query(
            'SELECT item_name, price, stock, design_no, size, color, barcode, id FROM product WHERE barcode = $1',
            [barcode]
        );
        return result.rows[0];
    },

    delete: async (barcode) => {
        logger.info(`Running DELETE query to delete item by barcode: ${barcode}`);
        const result = await pool.query('DELETE FROM product WHERE barcode = $1', [barcode]);
        return result.rowCount;
    },
};

module.exports = { Inventory, inventorySchemaInsertion, inventorySchemaDeletion, inventorySchemaUpdate, inventorySchemaBulkUpdate};
