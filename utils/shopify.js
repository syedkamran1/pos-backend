require('dotenv').config();
const { shopifyApi, LATEST_API_VERSION } = require('@shopify/shopify-api');
const { nodeRuntime } = require('@shopify/shopify-api/adapters/node');
const logger = require('../config/logger');

logger.info('🚀 Initializing Shopify API...');

const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET,
  scopes: ['read_orders', 'read_inventory'],
  hostName: process.env.SHOPIFY_STORE_NAME,
  isEmbeddedApp: false,
  apiVersion: LATEST_API_VERSION,
  runtime: nodeRuntime,
  logLevel: 'error'
});

const session = {
  shop: process.env.SHOPIFY_STORE_NAME,
  accessToken: process.env.SHOPIFY_ACCESS_TOKEN,
  isOnline: true
};

const restClient = new shopify.clients.Rest({ session });

logger.info('✅ Shopify API client initialized successfully');

module.exports = restClient;
