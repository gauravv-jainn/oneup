const express = require('express');
const router = express.Router();
const componentController = require('../controllers/componentController');
const verifyToken = require('../middleware/authMiddleware');

// Protect all routes with JWT
router.use(verifyToken);

router.post('/', componentController.createComponent);
router.get('/', componentController.getAllComponents);
router.get('/:id', componentController.getComponentById);
router.put('/:id', componentController.updateComponent);
router.delete('/:id', componentController.deleteComponent);

module.exports = router;
