const express = require("express");
const { Sales, saleRequestSchema } = require("../models/sales");
const { SaleItems } = require("../models/SaleItems");
const { Inventory } = require("../models/inventory");
const { PaymentDetails } = require("../models/paymentDetails");
const generateBarcodeText = require("../utils/generateBarcodeText"); // Import barcode utility
const pool = require("../config/db");
const logger = require("../utils/logger"); // Import the logger
const router = express.Router();

// Get all sales records
router.get("/", async (req, res) => {
  logger.info("*************** Sales Get Route ***************");
  try {
    const sales = await Sales.getAllWithPaymentDetails(); // Updated to include payment details
    res.json({ sales });
    logger.info("Sales Fetched.. Returning Result");
  } catch (error) {
    log.warn("Error fetching sales.");
    res.status(500).json({ error: error.message });
  }
});

// Process a sale

router.post("/", async (req, res) => {
  logger.info("*************** Sales Post Route ***************");
  // Validate the request body
  const { error } = saleRequestSchema.validate(req.body);
  if (error) {
    logger.error("Validation failed", { error: error.details[0].message });
    return res.status(400).json({ error: error.details[0].message });
  }

  const { cart, paymentType, paidAmount, discount } = req.body;

  try {
    // Begin transaction
    await pool.query("BEGIN");
    let total = 0;

    // Log cart and payment information for tracking
    logger.info("Processing sale", { cart, paymentType, paidAmount, discount });

    // Process each item in the cart
    for (const entry of cart) {
      const { barcode, quantity, item_discount } = entry;
      logger.info("Processing item", { barcode, quantity, item_discount });

      // Fetch product variant and inventory stock using barcode
      const inventoryItem = await Inventory.getByBarcodeWithStock(barcode);

      if (!inventoryItem) {
        await pool.query("ROLLBACK");
        logger.warn(`Product variant not found for barcode: ${barcode}`);
        return res
          .status(400)
          .json({
            error: `Product variant for barcode '${barcode}' not found.`,
          });
      }

      // Check if stock is 0 or less than the requested quantity
      if (inventoryItem.stock <= 0 || inventoryItem.stock < quantity) {
        await pool.query("ROLLBACK");
        logger.warn(`Item ${barcode} out of stock or insufficient stock`, {
          barcode,
          quantity,
          stockAvailable: inventoryItem.stock,
        });
        return res
          .status(400)
          .json({
            error: `Item '${barcode}' is out of stock or insufficient stock.`,
          });
      }

      // Log that stock is validated and sale is being processed
      logger.info("Stock validated for item", {
        barcode,
        quantity,
        stockAvailable: inventoryItem.stock,
      });

      // Deduct stock
      await Inventory.updateStock(
        inventoryItem.barcode,
        inventoryItem.stock - quantity
      );

      // Calculate total
      total += inventoryItem.price * quantity;
    }

    // Generate barcode for the sale
    const saleBarcode = generateBarcodeText("SALE");
    logger.info("Generated sale barcode", { saleBarcode });

    //logger.info('Calculating discount', { total, paidAmount });
    //let discount = total - paidAmount;
    //logger.info('Discount = ', { discount })

    // Record sale
    const saleId = await Sales.add({
      saleDate: new Date(),
      total: paidAmount,
      barcode: saleBarcode,
      discount,
    });

    // Add sale items
    for (const entry of cart) {
      const inventoryItem = await Inventory.getByBarcodeWithStock(entry.barcode);
      //console.log(inventoryItem);
      await SaleItems.add(
        saleId,
        inventoryItem.variantid,
        entry.quantity,
        inventoryItem.price * entry.quantity,
        entry.item_discount
      );
    }

    // Add payment details
    logger.info("Adding payment details", { saleId, paymentType, paidAmount });
    await PaymentDetails.add(saleId, paymentType, paidAmount);

    // Commit transaction
    await pool.query("COMMIT");
    logger.info("Sale processed successfully", {
      saleId,
      total,
      barcode: saleBarcode,
      paidAmount,
      discount,
    });

    res
      .status(201)
      .json({
        message: "Sale processed successfully!",
        barcode: saleBarcode,
        total,
        paidAmount,
        discount,
      });
  } catch (error) {
    await pool.query("ROLLBACK");
    logger.error("Error processing sale", { error: error.message });
    res.status(500).json({ error: error.message });
  }
});
module.exports = router;
