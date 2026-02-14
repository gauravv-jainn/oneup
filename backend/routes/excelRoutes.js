const express = require('express');
const router = express.Router();
const excelController = require('../controllers/excelController');
const upload = require('../middleware/uploadMiddleware');
const verifyToken = require('../middleware/authMiddleware');

router.use(verifyToken);

router.post('/import', upload.single('file'), excelController.importComponents);
router.get('/export/inventory', excelController.exportComponents);
router.get('/export/consumption', excelController.exportConsumption);

module.exports = router;
