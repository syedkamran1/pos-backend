const Joi = require('joi');
const pool = require('../config/db');

// Joi schema for validation
const salesSchema = Joi.object({
    saleDate: Joi.date().required(),
    total: Joi.number().positive().precision(2).required(),
    barcode: Joi.string().required(),
});

const saleRequestSchema = Joi.object({
    cart: Joi.array()
        .items(
            Joi.object({
                barcode: Joi.string().required(),
                quantity: Joi.number().integer().min(1).required(),
            })
        )
        .min(1)
        .required(),
    paymentType: Joi.string().valid('Cash', 'Card').required(),
    paidAmount: Joi.number().positive().required(),
});


const Sales = {
    // Fetch all sales records with payment details
    getAllWithPaymentDetails: async () => {
        const result = await pool.query(`
            SELECT s.*, pd.payment_type, pd.paid_amount, pd.payment_date 
            FROM sales s
            LEFT JOIN payment_details pd ON s.id = pd.sale_id
        `);
        return result.rows;
    },

    // Add a new sale
    add: async (sale) => {
        const { saleDate, total, barcode } = sale;
        const result = await pool.query(
            'INSERT INTO sales (sale_date, total, barcode) VALUES ($1, $2, $3) RETURNING id',
            [saleDate, total, barcode]
        );
        return result.rows[0].id; // Return the sale ID
    },
};

module.exports = { Sales, salesSchema, saleRequestSchema };