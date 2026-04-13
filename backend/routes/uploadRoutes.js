import express from 'express';
import multer from 'multer';
import path from 'path';

const router = express.Router();

// 1. Storage Configuration
const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, 'uploads/'); // Make sure this folder exists
    },
    filename(req, file, cb) {
        cb(
            null,
            `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
        );
    },
});

// 2. File Filter (images only)
function checkFileType(file, cb) {
    const filetypes = /jpg|jpeg|png|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb('Images only!');
    }
}

// 3. Init Upload
const upload = multer({
    storage,
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    },
});

// @route   POST /api/upload
// @desc    Upload an image
// @access  Public (Can add protect middleware if needed)
router.post('/', upload.single('image'), (req, res) => {
    if (req.file) {
        res.send({ url: `/${req.file.path.replace(/\\/g, "/")}` });
    } else {
        res.status(400).send({ message: 'No image file provided' });
    }
});

export default router;
