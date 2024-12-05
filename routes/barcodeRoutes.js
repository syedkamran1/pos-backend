const express = require('express');
const { Barcode, BarcodePrintSchema } = require('../models/barcode'); // Import Barcode model
const logger = require('../utils/logger'); // Import logger

const router = express.Router();

router.post('/print', async (req, res) => {
    logger.info("*************** Barcode Post (Print) Route ***************") 

    logger.info('Received request to print barcodes.');


    logger.info('Validating barcode print request schema.');

    // Validate request body
    const { error } = BarcodePrintSchema.validate(req.body);
    if (error) {
        logger.error(`Validation error: ${error.message}`);
        return res.status(400).json({ error: error.details[0].message });
    }

    const { barcode, quantity } = req.body;

    try {
        logger.info(`Generating barcodes for product barcode: ${barcode}, quantity: ${quantity}`);
        const generatedBarcodes = await Barcode.createBarcodePdf(barcode, quantity);

        logger.info(`Barcodes generated successfully: ${JSON.stringify(generatedBarcodes)}`);
        await Barcode.printPdf(generatedBarcodes)

        res.status(200).json({ message: 'Barcodes generated successfully', barcodes: generatedBarcodes });
    } catch (error) {
        logger.error(`Error generating barcodes: ${error.message}`);
        res.status(500).json({ error: 'Failed to generate barcodes. Please try again later.' });
    }
});

module.exports = router;
