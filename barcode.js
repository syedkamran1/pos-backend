const PDFDocument = require('pdfkit');

async function generatePrintablePDF(barcode, quantity) {
    const doc = new PDFDocument();
    const outputFileName = `barcodes-${barcode}.pdf`;
    const fs = require('fs');
    const bwipjs = require('bwip-js');

    const stream = fs.createWriteStream(outputFileName);
    doc.pipe(stream);

    for (let i = 0; i < quantity; i++) {
        const png = await bwipjs.toBuffer({
            bcid: 'code128', // Barcode type
            text: barcode,   // Text to encode
            scale: 3,        // Scaling factor
            height: 10,      // Bar height in mm
            includetext: true, // Include text below barcode
            textxalign: 'center', // Align text
        });

        // Add the barcode image to the PDF
        doc.image(png, { fit: [200, 100], align: 'center' });

        // Add some spacing between barcodes
        if (i < quantity - 1) doc.addPage();
    }

    doc.end();
    console.log(`PDF generated: ${outputFileName}`);
}

// Example usage
generatePrintablePDF('111111111111', 8); 
  