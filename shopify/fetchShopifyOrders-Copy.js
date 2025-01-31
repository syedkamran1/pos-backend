// const {Shopify} = require('@shopify/shopify-api');
// console.log('Shopify Object:', Shopify);


// // Replace these with your Shopify store details
// const SHOPIFY_STORE_NAME = "MyStyleMantra.myshopify.com";
// const ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN; // Retrieved during app setup

require('dotenv').config();
const { shopifyApi , LATEST_API_VERSION } = require('@shopify/shopify-api');
const { nodeRuntime } = require('@shopify/shopify-api/adapters/node');

console.log(LATEST_API_VERSION);


// Step 1: Initialize Shopify API
const shopify = shopifyApi({
  apiKey: "12fe2da5ca030284c704ab718ccb1314", 
  apiSecretKey: "453c182e2879e485999c5bb0e0e7764f", 
  scopes: ['read_orders'], 
  //hostName: "MyStyleMantra.myshopify.com", 
  hostName: "5e8703-4.myshopify.com",
  isEmbeddedApp: false,
  apiVersion: LATEST_API_VERSION, // Shopify API version (use your desired version)
  runtime: nodeRuntime,
  logLevel: 'error',
});

const session = {
    //shop: "MyStyleMantra.myshopify.com", 
    shop: "5e8703-4.myshopify.com",
    accessToken: process.env.SHOPIFY_ACCESS_TOKEN, 
    isOnline: true, 
  };

// Step 2: Create a Shopify REST client
// const restClient = new shopify.clients.Rest(
//   "MyStyleMantra.myshopify.com", 
//   process.env.SHOPIFY_ACCESS_TOKEN
// );

const restClient = new shopify.clients.Rest({ session });

// Fetch orders
const fetchOrders = async () => {
  try {
      const response = await restClient.get({
          path: 'orders',
          query: {
              status: 'any', // Fetch any status of orders
              limit: 10,     // Limit to 10 orders for testing
          },
      });

      console.log("✅ Fetched Orders:", response.body.orders);
  } catch (error) {
      console.error("❌ Error fetching orders:", error.response ? error.response.body : error.message);
  }
};

// Example usage
fetchOrders();

// import {createAdminRestApiClient} from '@shopify/admin-api-client';

// const client = createAdminRestApiClient({
//   storeDomain: 'MyStyleMantra.myshopify.com',
//   apiVersion: '2025-01',
//   accessToken: process.env.SHOPIFY_ACCESS_TOKEN,
// });

// const response = await client.get('products/1234567890');
// console.log(response);

// if (response.ok) {
//   const body = await response.json();
// }
