function generateBarcodeText(itemName) {
    // 1. Extract the first 2-3 alphanumeric characters from the item name
    const nameHash = itemName
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '') // Remove special characters
        .slice(0, 5); // Take the first 5 characters

    // 2. Get current timestamp in milliseconds (13-digit number)
    const timestamp = Date.now().toString().slice(-8); // Take last 8 digits for brevity

    // 3. Generate a 6-digit random number to ensure uniqueness
    const randomPart = Math.floor(100000 + Math.random() * 900000); // Random 6-digit number (100000 - 999999)

    // 4. Optionally include productId (if provided) to increase uniqueness
    //const productPart = productId ? productId.toString().padStart(3, '0').slice(-3) : '';

    // 5. Combine all parts to form a fixed-length barcode
    const barcode = `${nameHash}${timestamp}${randomPart}`;

    // Log the generated barcode for testing/debugging
    //console.log(`Generated Barcode: ${barcode}`);

    return barcode;
}
module.exports = generateBarcodeText
