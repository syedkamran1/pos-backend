const Joi = require('joi');
const logger = require('../utils/logger'); // Import logger
const fs = require('fs');
const { PDFDocument } = require('pdf-lib');
const { print, getDefaultPrinter } = require('pdf-to-printer');
const path = require('path');

const generateBarcodeBuffer = require('../utils/generateBarcodeBuffer');


const BarcodePrintSchema = Joi.object({
    barcode: Joi.string().max(50).required(),
    quantity: Joi.number().integer().min(1).required(),

});

const Barcode = {
    createBarcodePdf: async (barcode, quantity) => {
        try {
            logger.info(`Starting PDF creation for barcode: ${barcode}, quantity: ${quantity}`);

// Create a new PDF document
const pdfDoc = await PDFDocument.create();
logger.info('PDF document created successfully.');

// Add barcodes to the document, each on a separate page
for (let i = 0; i < quantity; i++) {
    // Add a new page for each barcode
    const page = pdfDoc.addPage([300, 100]); // Fixed height for each page
    const { height } = page.getSize();
    logger.info(`Page ${i + 1} added to PDF with height ${height}`);

    // Generate the barcode buffer
    const barcodeBuffer = await generateBarcodeBuffer(barcode);
    
    // Embed the barcode image
    const barcodeImage = await pdfDoc.embedPng(barcodeBuffer);
    logger.info(`Barcode image embedded for instance ${i + 1}`);

    // Draw the barcode on the page
    page.drawImage(barcodeImage, {
        x: 50,
        y: height - 80, // Adjust y-position to place the barcode near the top
        width: 200,
        height: 80,
    });
}

logger.info('PDF creation completed.');

            logger.info(`Successfully embedded ${quantity} barcodes into PDF.`);

    
            // Save the PDF and write it to a file
            const pdfBytes = await pdfDoc.save();

            try {             
                const folderPath = path.join(__dirname, "../barcodes"); // Construct the full path
                if (!fs.existsSync(folderPath)) {
                    fs.mkdirSync(folderPath); // Create the folder if it does not exist
                    logger.info(`Folder barcode created successfully in the current directory.`);
                } else {
                    logger.info(`Folder barcode already exists in the current directory.`);
                }
            } catch (error) {
                console.error(`Error creating folder '${folderName}':`, error.message);
            }


            const pdfFileName = `barcodes/barcodes-${barcode}.pdf`;
            fs.writeFileSync(pdfFileName, pdfBytes);
    
            logger.info(`PDF saved successfully: ${pdfFileName}`);
            return pdfFileName;
        } catch (error) {
            logger.error(`Error creating barcode PDF: ${error.message}`, { barcode, quantity });
            throw error; // Re-throw error for upstream handling
        }

    },
   // Function to print the PDF
   printPdf: async (pdfFileName) => {
    try {
        logger.info(`Attempting to send print job for ${pdfFileName}`);
        
        await print(pdfFileName);
        logger.info(`Print job successfully sent for ${pdfFileName}`);
        
        logger.info(`Fetching default printer information...`);
        const defaultPrinter = await getDefaultPrinter();
        logger.info(`Default printer details:`, { defaultPrinter });
    
        logger.info(`Print operation completed for ${pdfFileName}`);
    } catch (error) {
        logger.error(`Failed to print ${pdfFileName}: ${error.message}`, { stack: error.stack });
    }
}
};

module.exports = { Barcode, BarcodePrintSchema};
