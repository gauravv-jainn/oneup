const express = require('express');
const router = express.Router();
const productionController = require('../controllers/productionController');
const verifyToken = require('../middleware/authMiddleware');

router.use(verifyToken);

router.post('/', productionController.recordProduction);

module.exports = router;
