const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

// Configure multer for file upload
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Check file type
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
    files: 10 // Max 10 files
  }
});

// Process uploaded images
const processImages = async (files, options = {}) => {
  const {
    width = 1200,
    height = 800,
    quality = 80,
    format = 'webp'
  } = options;

  const processedImages = [];

  for (const file of files) {
    try {
      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const filename = `${timestamp}-${randomString}.${format}`;
      
      // Create upload directory if it doesn't exist
      const uploadDir = process.env.UPLOAD_PATH || './uploads';
      await fs.mkdir(uploadDir, { recursive: true });

      // Process image
      const processedBuffer = await sharp(file.buffer)
        .resize(width, height, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .webp({ quality })
        .toBuffer();

      // Save processed image
      const filepath = path.join(uploadDir, filename);
      await fs.writeFile(filepath, processedBuffer);

      // Generate thumbnail
      const thumbnailBuffer = await sharp(file.buffer)
        .resize(300, 200, {
          fit: 'cover'
        })
        .webp({ quality: 70 })
        .toBuffer();

      const thumbnailFilename = `thumb-${filename}`;
      const thumbnailPath = path.join(uploadDir, thumbnailFilename);
      await fs.writeFile(thumbnailPath, thumbnailBuffer);

      processedImages.push({
        originalName: file.originalname,
        filename: filename,
        thumbnail: thumbnailFilename,
        path: filepath,
        size: processedBuffer.length,
        mimetype: `image/${format}`,
        url: `/uploads/${filename}`,
        thumbnailUrl: `/uploads/${thumbnailFilename}`
      });

    } catch (error) {
      console.error('Image processing error:', error);
      throw new Error(`Failed to process image ${file.originalname}`);
    }
  }

  return processedImages;
};

// Delete image files
const deleteImage = async (filename) => {
  try {
    const uploadDir = process.env.UPLOAD_PATH || './uploads';
    const filepath = path.join(uploadDir, filename);
    const thumbnailPath = path.join(uploadDir, `thumb-${filename}`);

    // Delete original and thumbnail
    await Promise.all([
      fs.unlink(filepath).catch(() => {}),
      fs.unlink(thumbnailPath).catch(() => {})
    ]);

    return true;
  } catch (error) {
    console.error('Delete image error:', error);
    return false;
  }
};

module.exports = {
  upload,
  processImages,
  deleteImage
};
