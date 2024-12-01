const bwipjs = require('bwip-js');
const { timeStamp } = require('console');
const fs = require('fs');
const { PDFDocument } = require('pdf-lib');
const { print } = require('pdf-to-printer');


// Function to generate barcode buffer
async function generateBarcode(barcodeText) {
    return bwipjs.toBuffer({
        bcid: 'code128',         // Barcode type
        text: barcodeText,       // Text to encode
        scale: 3,                // Scaling factor
        height: 10,              // Bar height in mm
        includetext: true,       // Include text below barcode
        textxalign: 'center',    // Align text
        
    });
}

// Function to create a PDF with barcodes
async function createBarcodePdf(barcodeText, quantity) {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([300, 100 * quantity]); // Adjust page size based on quantity
    const { height } = page.getSize();

    for (let i = 0; i < quantity; i++) {
        const yPosition = height - (100 * (i + 1)); // Adjust y-position for each barcode
        const barcodeBuffer = await generateBarcode(barcodeText);
        const barcodeImage = await pdfDoc.embedPng(barcodeBuffer);
        page.drawImage(barcodeImage, {
            x: 50,
            y: yPosition,
            width: 200,
            height: 80,
        });
    }

    const pdfBytes = await pdfDoc.save();
    const pdfFileName = `barcodes-${barcodeText}.pdf`;
    fs.writeFileSync(pdfFileName, pdfBytes);

    console.log(`PDF created: ${pdfFileName}`);
    return pdfFileName;
}

// Function to print the PDF
async function printPdf(pdfFileName) {
    try {
        await print(pdfFileName);
       console.log(`Print job sent for ${pdfFileName}`);
      
       //await getPrinters().then(console.log);
     console.log("------------------------------")
      await getDefaultPrinter().then(console.log)
    } catch (error) {
        console.error(`Failed to print ${pdfFileName}:`, error);
    }
}

// Main function
async function main() {
    const barcodeText = '123456789012'; // Example barcode
    const quantity = 8; // Example quantity

    // Step 1: Create and save the PDF
    const pdfFileName = await createBarcodePdf(barcodeText, quantity);

    // Step 2: Print the PDF
    await printPdf(pdfFileName);

    // Optional: Delete the PDF after printing
    // fs.unlinkSync(pdfFileName);
    // console.log(`PDF deleted: ${pdfFileName}`);
}


// Utility to generate a barcode based on item name
// function generateBarcode(itemName) {
//     const timestamp = Date.now(); // Ensures uniqueness
//     const nameHash = itemName
//         .toUpperCase()
//         .replace(/[^A-Z0-9]/g, '')
//         .slice(0, 4); // Shorten the item name
//     console.log(nameHash);
//     console.log(timestamp);
//     barcode = nameHash+timeStamp;
//     console.log("--------")
//     console.log( `${barcode} - ${itemName}`)
//     return nameHash + timestamp;
// }

//generateBarcode("thsirt")

main().catch(console.error);
