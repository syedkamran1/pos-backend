const express = require('express');
const { syncShopifyProductsToPOS } = require('../models/shopify');
const logger = require('../utils/logger'); // Assuming you have a logger set up

const router = express.Router();

const crypto = require('crypto');

router.post('/webhooks/products/create', async (req, res) => {
    logger.info("*************** Shopify Product Create Webhook ***************");

    try {
        // Step 1: Verify the request came from Shopify (HMAC verification)
        const hmacHeader = req.get('X-Shopify-Hmac-SHA256');
        logger.info(hmacHeader)
        const body = JSON.stringify(req.rawBody);
        const hash = crypto.createHmac('sha256', "eefa30f4c7829b254bc5abbd8c68ed75759c0674f271c786650be9ab0e897942")
            .update(body, 'utf8')
            .digest('base64');

        if (hash !== hmacHeader) {
            logger.error('Webhook verification failed');
            return res.status(401).json({ message: 'Unauthorized' });
        }

        logger.info('Webhook verified successfully');

        // Step 2: Extract the product data from the request
        const productData = req.body;

        logger.info(`Received new product from Shopify: ${productData.title}`);

        // Step 3: Add product and variants to local POS
        await Inventory.addProductFromShopify(productData);

        logger.info('Product and variants added successfully to local POS.');
        res.status(200).json({ message: 'Product synced successfully!' });
    } catch (error) {
        logger.error(`Error while processing Shopify product create webhook: ${error.message}`);
        res.status(500).json({ error: 'Internal server error' });
    }
});


module.exports = router;
