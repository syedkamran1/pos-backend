const bwipjs = require('bwip-js');

// Function to generate barcode buffer
async function generateBarcodeBuffer(barcodeText) {
    return bwipjs.toBuffer({
        bcid: 'code128',         // Barcode type
        text: barcodeText,       // Text to encode
        scale: 3,                // Scaling factor
        height: 10,              // Bar height in mm
        includetext: true,       // Include text below barcode
        textxalign: 'center',    // Align text
        
    });
}

module.exports = generateBarcodeBuffer