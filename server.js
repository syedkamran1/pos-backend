const express = require('express');
const inventoryRoutes = require('./routes/inventoryRoutes');
const salesRoutes = require('./routes/salesRoutes');
const userRoutes = require('./routes/userRoutes');
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

app.use('/api/sales', salesRoutes);

app.use('/api/auth', userRoutes);

 
// Fallback route to serve index.html for React Router
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    
});
