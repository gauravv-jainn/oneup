const express = require('express');
const router = express.Router();
const excelController = require('../controllers/excelController');
const upload = require('../middleware/uploadMiddleware');
const verifyToken = require('../middleware/authMiddleware');

router.use(verifyToken);

router.post('/import', upload.single('file'), excelController.importComponents);
router.post('/import/bom', upload.single('file'), excelController.importBOM);
router.get('/export/inventory', excelController.exportComponents);
router.get('/export/consumption', excelController.exportConsumption);

// New Detailed Reports
router.get('/export/repairs', excelController.exportRepairs); // PCB Wise Details
router.get('/export/component-usage', excelController.exportComponentUsage); // Component Wise Usage

module.exports = router;
