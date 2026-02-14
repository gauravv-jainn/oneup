const express = require('express');
const router = express.Router();
const procurementController = require('../controllers/procurementController');
const verifyToken = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/triggers', procurementController.getTriggers);
router.put('/triggers/:id', procurementController.updateTriggerStatus);

module.exports = router;
