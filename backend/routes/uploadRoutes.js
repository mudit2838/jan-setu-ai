import express from 'express';
import multer from 'multer';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// 1. Cloudinary Configuration
const isCloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET;

if (isCloudinaryConfigured) {
    console.log("[STORAGE] Configuring Cloudinary Engine...");
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });
} else {
    console.warn("[STORAGE] Cloudinary Not Configured. Upload will use local /uploads disk storage fallback.");
}

// 2. Multer Storage (always use memory/disk for initial intake, then push to Cloudinary)
let storage;

if (isCloudinaryConfigured) {
    // Use memory storage: file stays in RAM buffer, then we upload to Cloudinary
    storage = multer.memoryStorage();
} else {
    // Fallback Local Storage
    console.warn("[STORAGE] Using local /uploads disk storage fallback.");
    storage = multer.diskStorage({
        destination(req, file, cb) {
            cb(null, 'uploads/');
        },
        filename(req, file, cb) {
            cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
        },
    });
}

// 3. File Filter (images only)
function checkFileType(file, cb) {
    const filetypes = /jpg|jpeg|png|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb(new Error('Images only! Only .jpg, .jpeg, .png, .webp formats are accepted.'));
    }
}

// 4. Init Upload
const uploadSizeLimit = 5 * 1024 * 1024; // 5MB
const upload = multer({
    storage,
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    },
    limits: { fileSize: uploadSizeLimit },
});

// Helper: Upload buffer to Cloudinary and return the secure URL
const uploadToCloudinary = (fileBuffer, originalname) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: 'jansetu-grievances',
                resource_type: 'image',
                public_id: `${path.parse(originalname).name}-${Date.now()}`,
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );
        uploadStream.end(fileBuffer);
    });
};

// @route   POST /api/upload
// @desc    Upload an image (Cloudinary or local fallback)
// @access  Protected
router.post('/', protect, (req, res) => {
    upload.single('image')(req, res, async function (err) {
        if (err instanceof multer.MulterError) {
            // A Multer error occurred when uploading.
            console.error("[UPLOAD] Multer Error:", err);
            return res.status(400).json({ message: `Upload error: ${err.message}`, code: err.code });
        } else if (err) {
            // An unknown error occurred when uploading.
            console.error("[UPLOAD] Critical Storage Failure:", err);
            const errorMessage = err.message || "Unknown storage failure";
            return res.status(500).json({ 
                message: "Storage rejection. Check configuration.",
                error: errorMessage 
            });
        }

        // Success from Multer
        if (!req.file) {
            return res.status(400).send({ message: 'No image file provided in request' });
        }

        try {
            let fileUrl;

            if (isCloudinaryConfigured) {
                // Upload the in-memory buffer to Cloudinary
                const cloudinaryResult = await uploadToCloudinary(req.file.buffer, req.file.originalname);
                fileUrl = cloudinaryResult.secure_url;
                console.log(`[UPLOAD] Cloudinary Success: ${fileUrl}`);
            } else {
                // Local fallback: file already saved to disk by multer.diskStorage
                fileUrl = `/${req.file.path.replace(/\\/g, "/")}`;
                console.log(`[UPLOAD] Local Fallback Success: ${fileUrl}`);
            }

            res.send({ url: fileUrl });
        } catch (cloudinaryError) {
            console.error("[UPLOAD] Cloudinary Upload Failed:", cloudinaryError);
            return res.status(500).json({
                message: "Cloud image storage failed. Check Cloudinary credentials.",
                error: cloudinaryError.message || "Unknown Cloudinary error"
            });
        }
    });
});

export default router;
