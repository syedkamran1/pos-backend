const express = require('express');
const { Sales , saleRequestSchema} = require('../models/sales');
const { SaleItems } = require('../models/SaleItems');
const { Inventory } = require('../models/inventory');
const { PaymentDetails } = require('../models/paymentDetails');
const generateBarcodeText = require('../utils/generateBarcodeText'); // Import barcode utility
const pool = require('../config/db');
const logger = require('../utils/logger'); // Import the logger
const router = express.Router();

// Get all sales records
router.get('/', async (req, res) => {
    try {
        const sales = await Sales.getAllWithPaymentDetails(); // Updated to include payment details
        res.json({ sales });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Process a sale

router.post('/', async (req, res) => {
    // Validate the request body
    const { error } = saleRequestSchema.validate(req.body);
    if (error) {
        logger.error('Validation failed', { error: error.details[0].message });
        return res.status(400).json({ error: error.details[0].message });
    }

    const { cart, paymentType, paidAmount } = req.body;

    try {
        // Begin transaction
        await pool.query('BEGIN');
        let total = 0;

        // Log cart and payment information for tracking
        logger.info('Processing sale', { cart, paymentType, paidAmount });

        // Process each item in the cart
        for (const entry of cart) {
            const { barcode, quantity } = entry;
            logger.info('Processing item', { barcode, quantity });

            const inventoryItem = await Inventory.getByBarcode(barcode);
          //  console.log(inventoryItem);
            
            if (!inventoryItem || inventoryItem.stock < quantity) {
                await pool.query('ROLLBACK');
                logger.warn(`Item ${barcode} out of stock`, { barcode, quantity, stockAvailable: inventoryItem?.stock });
                return res.status(400).json({ error: `Item '${barcode}' is out of stock.` });
            }

            // Deduct stock
            await Inventory.updateStock(inventoryItem.barcode, inventoryItem.stock - quantity);

            // Calculate total
            total += inventoryItem.price * quantity;
        }

        // Generate barcode for the sale
        const saleBarcode = generateBarcodeText('SALE');
        logger.info('Generated sale barcode', { saleBarcode });

        // Record sale
        const saleId = await Sales.add({ saleDate: new Date(), total, barcode: saleBarcode });

        // Add sale items
        for (const entry of cart) {
            const inventoryItem = await Inventory.getByBarcode(entry.barcode);
            await SaleItems.add(saleId, inventoryItem.id, entry.quantity, inventoryItem.price * entry.quantity);
        }

        // Add payment details
        logger.info('Adding payment details', { saleId, paymentType, paidAmount });
        await PaymentDetails.add(saleId, paymentType, paidAmount);

        // Commit transaction
        await pool.query('COMMIT');
        logger.info('Sale processed successfully', { saleId, total, barcode: saleBarcode });

        res.status(201).json({ message: 'Sale processed successfully!', total, barcode: saleBarcode });
    } catch (error) {
        await pool.query('ROLLBACK');
        logger.error('Error processing sale', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});


module.exports = router;