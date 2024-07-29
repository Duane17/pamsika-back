const multer = require('multer');
const path = require('path');

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads')) // adjust the path as needed
  },
  filename: (req, file, cb) => {
    // Use Date.now() to get a unique timestamp for the filename
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
  }
});

const upload = multer({ storage: storage });

module.exports = upload;
