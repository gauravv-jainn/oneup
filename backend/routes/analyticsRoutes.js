const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsControllerV2');
const verifyToken = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/consumption-summary', analyticsController.getConsumptionSummary);
router.get('/top-consumed', analyticsController.getTopConsumed);
router.get('/low-stock', analyticsController.getLowStock);
router.get('/consumption-trend', analyticsController.getConsumptionTrend);

// New Stats Endpoints
router.get('/stats', analyticsController.getDashboardStats);
router.get('/production-trend', analyticsController.getProductionTrend);
router.get('/heatmap-data', analyticsController.getHeatmapData);

module.exports = router;
