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
    add: async (saleId, inventoryId, quantity, price, item_discount) => {
        //console.log(saleId, inventoryId, quantity, price, item_discount);

        await pool.query(
            'INSERT INTO saleitems (sale_id, product_variant_id, quantity, price, item_discount) VALUES ($1, $2, $3, $4, $5)',
            [saleId, inventoryId, quantity, price, item_discount]
        );
    },
};

module.exports = { SaleItems, saleItemSchema };
