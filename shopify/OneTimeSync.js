const axios = require('axios');
const { Pool } = require('pg');

// Create a connection pool
const pool = new Pool({
    user: "postgres",       // Replace with your DB username
    host: "localhost",      // Your DB host
    database: "pos_system", // Your database name
    password: "12345678",   // Replace with your DB password
    port: "5432",           // Default PostgreSQL port
});

async function syncShopifyProductsToPOS() {
  try {
    console.log('[INFO] Fetching products from Shopify API...');
    const shopifyResponse = await axios.get('https://5e8703-4.myshopify.com/admin/api/2024-01/products.json', {
      headers: { 'X-Shopify-Access-Token': process.env.SHOPIFY_ACCESS_TOKEN }
    });

    const products = shopifyResponse.data.products;
    console.log(`[INFO] Fetched ${products.length} products from Shopify.`);

    for (const product of products) {
      // Loop over each variant of the product

      console.log("product = ", product);
      
      
      //  for (const variant of product.variants) {
        
      //   console.log("Processing Variant = ", variant);
        
      //   const checkQuery = 'SELECT id FROM product WHERE variant_id = $1';
      //   const result = await pool.query(checkQuery, [variant.id]);

      //   if (result.rows.length === 0) {
      //     const insertQuery = `
      //       INSERT INTO product (item_name, description, price, stock, color, size, variant_id, shopify_product_id, created_at, updated_at, is_published_to_shopify) 
      //       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW(), TRUE)
      //     `;
      //     await pool.query(insertQuery, [
      //       product.title, 
      //       product.body_html, 
      //       variant.price, 
      //       variant.inventory_quantity, 
      //       variant.option1,  // Color or other option
      //       variant.option2,  // Size or other option
      //       variant.id,       // Variant ID
      //       product.id        // Shopify product ID
      //     ]);

      //     console.log(`[INFO] Inserted product variant "${variant.option1} ${variant.option2}" for "${product.title}" into POS.`);
      //   }
      //  }
    }
  } catch (error) {
    console.error('[ERROR] Error syncing products from Shopify to POS:', error.message);
  } finally {
    pool.end();
  }
}

syncShopifyProductsToPOS();
