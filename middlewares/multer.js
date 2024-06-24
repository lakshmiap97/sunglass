const multer = require('multer');
const path=require('path')
const productStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/product-images');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + path.extname(file.originalname));
  }
});

const productUpload = multer({
  storage: productStorage
}).array('image', 4);

module.exports = {
  productUpload
};

