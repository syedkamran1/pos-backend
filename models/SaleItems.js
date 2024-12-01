const Joi = require('joi');
const pool = require('../config/db');

// Joi schema for validation
const saleItemSchema = Joi.object({
    saleId: Joi.number().integer().required(),
    inventoryId: Joi.number().integer().required(),
    quantity: Joi.number().integer().min(1).required(),
});

const SaleItems = {
    // Add items to SaleItems table
    add: async (saleId, inventoryId, quantity, price) => {

        await pool.query(
            'INSERT INTO saleitems (sale_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
            [saleId, inventoryId, quantity, price]
        );
    },
};

module.exports = { SaleItems, saleItemSchema };
