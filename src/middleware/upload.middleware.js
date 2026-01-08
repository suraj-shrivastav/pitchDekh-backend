import multer from "multer";
import path from "path";
import fs from "fs";

// 1. Ensure 'uploads' directory exists
// This prevents crashing if you forget to create the folder manually
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// 2. Configure Storage (Where and How to save)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir); // Save to 'uploads/' folder
    },
    filename: (req, file, cb) => {
        // Naming convention: timestamp-cleanFileName.pdf
        // This avoids overwriting files with the same name
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const cleanName = file.originalname.replace(/\s+/g, '-'); // Replace spaces with dashes
        cb(null, `${uniqueSuffix}-${cleanName}`);
    }
});

// 3. File Filter (Security)
// Only allow PDF files (MIME type: application/pdf)
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true); // Accept file
    } else {
        // Reject file with an error
        cb(new Error('Only PDF files are allowed!'), false);
    }
};

// 4. Initialize Multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // Limit file size to 10MB
    }
});

export default upload;