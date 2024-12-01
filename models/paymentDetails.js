const Joi = require('joi');
const pool = require('../config/db');

// Joi schema for validation
const paymentDetailsSchema = Joi.object({
    saleId: Joi.number().integer().required(),
    paymentType: Joi.string().valid('Cash', 'Card').required(),
    paidAmount: Joi.number().positive().required(),
});

const PaymentDetails = {
    // Add a payment record
    add: async (saleId, paymentType, paidAmount) => {
       // console.log("heee");
        
        const result = await pool.query(
            'INSERT INTO payment_details (sale_id, payment_type, paid_amount) VALUES ($1, $2, $3) RETURNING *',
            [saleId, paymentType, paidAmount]
        );
        return result.rows[0]; // Return the inserted payment record
    },

    // Fetch payment details by sale ID
    getBySaleId: async (saleId) => {
        const result = await pool.query(
            'SELECT * FROM payment_details WHERE sale_id = $1',
            [saleId]
        );
        return result.rows[0]; // Return payment details
    },
};

module.exports = { PaymentDetails, paymentDetailsSchema };  
