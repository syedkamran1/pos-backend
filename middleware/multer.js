const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'images/';
    // Check if the directory exists
    if (!fs.existsSync(dir)) {
      // Create the directory if it does not exist
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir); // Save files in the 'images' directory
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname); // Use the original filename
  },
});

// File filter to allow only .png files
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/png') {
    cb(null, true); // Accept the file
  } else {
    cb(new Error('Only .png files are allowed!'), false); // Reject the file
  }
};

// Initialize multer with the storage and file filter configuration
const upload = multer({ storage, fileFilter });

module.exports = upload;