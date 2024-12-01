// Utility to generate a barcode based on item name
function generateBarcodeText(itemName) {
    const timestamp = Date.now(); // Ensures uniqueness
    const nameHash = itemName
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .slice(0, 4); // Shorten the item name
    barcode = nameHash+timestamp;
   // console.log(barcode)
    return nameHash + timestamp;
}

module.exports = generateBarcodeText
