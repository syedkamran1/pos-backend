const pool = require('../config/db');
const logger = require('../utils/logger'); // Assuming you have a logger set up

const ShopifyProduct = {
    // Sync product from Shopify to local POS
    syncShopifyProduct: async ({
        shopify_product_id,
        variant_id,
        inventory_item_id,
        sku,
        item_name,
        description,
        price,
        stock,
        design_no,
        size,
        color,
        category_id
    }) => {
        try {
            logger.info(`Syncing product ${item_name} (${sku}) from Shopify to local POS...`);

            // Check if the product already exists in the local POS system
            const checkProductQuery = `
                SELECT * FROM local_pos_products WHERE sku = $1
            `;
            const result = await pool.query(checkProductQuery, [sku]);

            if (result.rows.length > 0) {
                // If product already exists, update it
                const updateProductQuery = `
                    UPDATE local_pos_products
                    SET shopify_product_id = $1, variant_id = $2, inventory_item_id = $3, 
                        item_name = $4, description = $5, price = $6, stock = $7, 
                        design_no = $8, size = $9, color = $10, category_id = $11
                    WHERE sku = $12
                `;
                await pool.query(updateProductQuery, [
                    shopify_product_id,
                    variant_id,
                    inventory_item_id,
                    item_name,
                    description,
                    price,
                    stock,
                    design_no,
                    size,
                    color,
                    category_id,
                    sku
                ]);

                logger.info(`Product ${sku} updated successfully in the local POS system.`);
            } else {
                // If the product doesn't exist, insert a new one
                const insertProductQuery = `
                    INSERT INTO local_pos_products (shopify_product_id, variant_id, inventory_item_id, 
                        sku, item_name, description, price, stock, design_no, size, color, category_id)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                `;
                await pool.query(insertProductQuery, [
                    shopify_product_id,
                    variant_id,
                    inventory_item_id,
                    sku,
                    item_name,
                    description,
                    price,
                    stock,
                    design_no,
                    size,
                    color,
                    category_id
                ]);

                logger.info(`Product ${sku} inserted successfully into the local POS system.`);
            }
        } catch (error) {
            logger.error(`Error syncing product ${sku}: ${error.message}`);
            throw new Error(`Failed to sync product ${sku} to local POS.`);
        }
    },
};

module.exports = { ShopifyProduct };
