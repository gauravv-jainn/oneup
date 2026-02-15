const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const fileFilter = (req, file, cb) => {
    const isMimeValid = file.mimetype.includes('excel') ||
        file.mimetype.includes('spreadsheetml') ||
        file.mimetype.includes('csv') ||
        file.mimetype === 'text/csv';

    const isExtValid = /\.(xlsx|xls|xlsm|csv)$/i.test(file.originalname);

    if (isMimeValid || isExtValid) {
        cb(null, true);
    } else {
        cb(new Error('Please upload only Excel (.xlsx, .xls, .xlsm) or CSV files.'), false);
    }
};

const upload = multer({ storage: storage, fileFilter: fileFilter });

module.exports = upload;
