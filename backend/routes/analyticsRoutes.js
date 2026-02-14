const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const verifyToken = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/consumption-summary', analyticsController.getConsumptionSummary);
router.get('/top-consumed', analyticsController.getTopConsumed);
router.get('/low-stock', analyticsController.getLowStock);
router.get('/consumption-trend', analyticsController.getConsumptionTrend);
router.get('/heatmap-data', analyticsController.getHeatmapData);

module.exports = router;
