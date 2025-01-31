const { getShopifyProducts } = require('../utils/shopifyAPI');
const { ShopifyProduct } = require('./shopifyProduct');
const logger = require('../utils/logger'); // Assuming you have a logger set up

// Sync products from Shopify to local POS
const syncShopifyProductsToPOS = async () => {
    try {
        // Step 1: Fetch all products from Shopify
        const products = await getShopifyProducts();

        for (let product of products) {
            const { id: shopifyProductId, title, variants } = product;

            // Step 2: Fetch the variants of the product
            for (let variant of variants) {
                const { id: variantId, sku, price, inventory_quantity, title: variantTitle } = variant;

                // Step 3: Sync each variant with local POS
                await ShopifyProduct.syncShopifyProduct({
                    shopify_product_id: shopifyProductId,
                    variant_id: variantId,
                    inventory_item_id: variant.inventory_item_id,
                    sku: sku,
                    item_name: title,
                    description: variantTitle, // You can customize this field if necessary
                    price: price,
                    stock: inventory_quantity,
                    design_no: product.design_no, // Assuming you have this field
                    size: variant.title, // You can customize this based on your needs
                    color: variant.option1, // For example, assuming option1 is color
                    category_id: 1, // Assuming you assign a category in the POS
                });

                logger.info(`Synced variant ${sku} from Shopify to POS.`);
            }
        }
    } catch (error) {
        logger.error('Error syncing products:', error.message);
    }
};

module.exports = { syncShopifyProductsToPOS }; 