const multer = require('multer');
const { errorResponse } = require('../utils/responseHandler');

// Store upload in memory as Buffer for Supabase upload
const storage = multer.memoryStorage();

// Accept common image formats only (Max 5MB)
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error('Please upload a valid JPG, PNG, or WebP image.');
    error.status = 400;
    cb(error, false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB limit
  },
  fileFilter,
}).single('photo');

const uploadPhotoMiddleware = (req, res, next) => {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return errorResponse(res, 400, 'File too large. Maximum allowed file size is 5 MB.');
      }
      return errorResponse(res, 400, `Upload error: ${err.message}`);
    } else if (err) {
      return errorResponse(res, err.status || 400, err.message || 'Please upload a valid JPG, PNG, or WebP image.');
    }
    next();
  });
};

module.exports = {
  uploadPhotoMiddleware,
};
