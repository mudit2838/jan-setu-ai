import express from 'express';
import multer from 'multer';
import path from 'path';
import { S3Client } from '@aws-sdk/client-s3';
import multerS3 from 'multer-s3';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

let storage;

const isS3Configured = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_S3_BUCKET_NAME;

// 1. Storage Configuration
if (isS3Configured) {
    console.log("[STORAGE] Configuring AWS S3 Engine...");
    const s3Client = new S3Client({
        region: process.env.AWS_REGION || 'ap-south-1',
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        }
    });

    storage = multerS3({
        s3: s3Client,
        bucket: process.env.AWS_S3_BUCKET_NAME,
        // acl: 'private', // Removed to support "Bucket Owner Enforced" security patterns
        metadata: function (req, file, cb) {
            cb(null, { fieldName: file.fieldname });
        },
        key: function (req, file, cb) {
            const fileName = `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`;
            cb(null, fileName);
        }
    });
} else {
    // Fallback Local Storage
    console.warn("[STORAGE] AWS S3 Not Configured. Using local /uploads disk storage fallback.");
    storage = multer.diskStorage({
        destination(req, file, cb) {
            cb(null, 'uploads/');
        },
        filename(req, file, cb) {
            cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
        },
    });
}

// 2. File Filter (images only)
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

// 3. Init Upload
const uploadSizeLimit = 5 * 1024 * 1024; // 5MB
const upload = multer({
    storage,
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    },
    limits: { fileSize: uploadSizeLimit },
});

// @route   POST /api/upload
// @desc    Upload an image
// @access  Protected
router.post('/', protect, (req, res) => {
    upload.single('image')(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            // A Multer error occurred when uploading.
            console.error("[UPLOAD] Multer Error:", err);
            return res.status(400).json({ message: `Upload error: ${err.message}`, code: err.code });
        } else if (err) {
            // An unknown error occurred when uploading (including AWS S3 Rejections).
            console.error("[UPLOAD] Critical Storage Failure:", err);
            
            // Surfacing AWS specific messages to help the user diagnose Bucket/Region/ACL issues
            const errorMessage = err.message || "Unknown storage failure";
            return res.status(500).json({ 
                message: "Cloud storage rejection. Check bucket permissions or region.",
                error: errorMessage 
            });
        }

        // Success
        if (!req.file) {
            return res.status(400).send({ message: 'No image file provided in request' });
        }

        const fileUrl = req.file.location || `/${req.file.path.replace(/\\/g, "/")}`;
        console.log(`[UPLOAD] Success: ${fileUrl}`);
        res.send({ url: fileUrl });
    });
});

export default router;
