const express = require('express');
const router = express.Router();
const futureOrderController = require('../controllers/futureOrderControllerV3');
const verifyToken = require('../middleware/authMiddleware');

router.use(verifyToken);

// Debug Logging
router.use((req, res, next) => {
    console.log(`[DEBUG_ROUTER] Method: ${req.method}, URL: ${req.url}`);
    next();
});

// Routes
router.post('/estimate_date', futureOrderController.estimateDate);
router.post('/check-availability', futureOrderController.checkAvailability);
router.post('/', futureOrderController.createOrder); // Matches POST /api/future-orders
router.get('/', futureOrderController.getOrders);    // Matches GET /api/future-orders
router.put('/:id', futureOrderController.updateOrder);
router.delete('/:id', futureOrderController.deleteOrder);
router.put('/:id/cancel', futureOrderController.cancelOrder);
router.post('/:id/execute', futureOrderController.executeOrder);

module.exports = router;
