// const {Shopify} = require('@shopify/shopify-api');
// console.log('Shopify Object:', Shopify);


// // Replace these with your Shopify store details
// const SHOPIFY_STORE_NAME = "MyStyleMantra.myshopify.com";
// const ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN; // Retrieved during app setup

const axios = require('axios');

// Configuration
const config = {
  shopName: '5e8703-4.myshopify.com',
  accessToken: process.env.SHOPIFY_ACCESS_TOKEN,
  apiVersion: '2024-01'
};

// Create axios instance with default configuration
const shopifyClient = axios.create({
  baseURL: `https://${config.shopName}`,
  headers: {
    'X-Shopify-Access-Token': config.accessToken,
    'Content-Type': 'application/json'
  }
});

// Test shop connection
async function testConnection() {
  try {
    console.log('Testing shop connection...');
    const response = await shopifyClient.get(`/admin/api/${config.apiVersion}/shop.json`);
    console.log('Shop connection successful:', response.data);
    return true;
  } catch (error) {
    console.error('Shop connection failed:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      headers: error.response?.headers
    });
    return false;
  }
}

// Fetch orders
async function fetchOrders() {
  try {
    console.log('Attempting to fetch orders...');
    const response = await shopifyClient.get(`/admin/api/${config.apiVersion}/orders.json`, {
      params: {
        status: 'any',
        limit: 10
      }
    });
    console.log('✅ Orders fetched successfully:', response.data);
  } catch (error) {
    console.error('❌ Error fetching orders:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });
    
    // Print the full error for debugging
    if (error.response) {
      console.log('\nDetailed error information:', {
        status: error.response.status,
        headers: error.response.headers,
        data: error.response.data
      });
    } else if (error.request) {
      console.log('\nRequest was made but no response received:', error.request);
    } else {
      console.log('\nError setting up request:', error.message);
    }
  }
}

// Run tests
async function runTests() {
  console.log('Starting API tests...');
  
  // First test the connection
  const isConnected = await testConnection();
  
  if (isConnected) {
    console.log('\nConnection test passed, proceeding to fetch orders...\n');
    await fetchOrders();
  } else {
    console.log('\nSkipping order fetch due to failed connection test');
  }
}

// Execute the tests
runTests();

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
