const express = require('express');
const inventoryRoutes = require('./routes/inventoryRoutes');
const productRoutes = require('./routes/productRoutes');

const salesRoutes = require('./routes/salesRoutes');
const userRoutes = require('./routes/userRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const barcodeRoutes = require('./routes/barcodeRoutes');

//const shopifyInventoryRoutes = require('./routes/shopifyInventoryRoutes');
//const shopifyOrdersRoutes = require('./routes/shopifyOrdersRoutes');
const shopifySyncRoutes = require('./routes/shopifySyncRoutes'); // Import the sync routes

 

const cors = require('cors')
const path = require('path');
//const serveStatic = require('serve-static'); // Import serve-static
require('dotenv').config();

const app = express();
app.use(express.json());

app.use(cors());


// Serve Vite's production files
app.use(express.static(path.join(__dirname, 'dist')));

// Serve static files from the "dist" folder
//app.use(serveStatic(path.join(__dirname, 'dist'), { index: false }));

// Routes
app.use('/api/inventory', inventoryRoutes);

app.use('/api/product', productRoutes);


app.use('/api/sales', salesRoutes);

app.use('/api/auth', userRoutes);

app.use('/api/categories', categoryRoutes);

app.use('/api/barcode', barcodeRoutes);

//app.use('/api/shopify/inventory', shopifyInventoryRoutes);

//app.use('/api/shopify/sales', shopifyOrdersRoutes);

app.use('/api/shopify', shopifySyncRoutes); // Define your sync route


 
// Fallback route to serve index.html for React Router
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    
});