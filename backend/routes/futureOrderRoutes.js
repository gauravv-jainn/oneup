const express = require('express');
const router = express.Router();
const futureOrderController = require('../controllers/futureOrderController');
const verifyToken = require('../middleware/authMiddleware');

router.use(verifyToken);

router.post('/check-availability', futureOrderController.checkAvailability);
router.post('/', futureOrderController.createOrder);
router.get('/', futureOrderController.getOrders);
router.post('/:id/execute', futureOrderController.executeOrder);
router.delete('/:id', futureOrderController.cancelOrder);

module.exports = router;
