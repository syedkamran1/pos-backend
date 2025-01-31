const axios = require('axios');
const logger = require('../utils/logger'); // Assuming you have a logger set up
require('dotenv').config();

// Shopify API credentials
const SHOPIFY_STORE_URL = process.env.SHOPIFY_STORE_NAME;
const API_KEY = process.env.SHOPIFY_API_KEY;

// Shopify API endpoint
const API_ENDPOINT = `https://${SHOPIFY_STORE_URL}/admin/api/2024-01/products.json`;


console.log(API_ENDPOINT);


// Function to get products from Shopify
const getShopifyProducts = async () => {
    try {
        // Make the API request to fetch all products
        const response = await axios.get(API_ENDPOINT, {
            headers: { 'X-Shopify-Access-Token': process.env.SHOPIFY_ACCESS_TOKEN }
          });

        // Return the list of products
        return response.data.products;
    } catch (error) {
        
        logger.error(`Error fetching Shopify products:', ${error.message}`)
        console.error('Error fetching Shopify products:', error.message);
        throw new Error('Failed to fetch products from Shopify.');
    }
};

// Function to get a specific product and its variants
const getShopifyProductWithVariants = async (productId) => {
    try {
        const response = await axios.get(
            `${SHOPIFY_STORE_URL}/admin/api/2024-01/products/${productId}.json`,
            {
                headers: { 'X-Shopify-Access-Token': process.env.SHOPIFY_ACCESS_TOKEN }
            }
        );
        return response.data.product;
    } catch (error) {
        console.error(`Error fetching Shopify product with ID ${productId}:`, error.message);
        throw new Error(`Failed to fetch product with ID ${productId} from Shopify.`);
    }
};

module.exports = { getShopifyProducts, getShopifyProductWithVariants };
