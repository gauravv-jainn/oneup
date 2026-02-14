const express = require('express');
const router = express.Router();
const pcbController = require('../controllers/pcbController');
const verifyToken = require('../middleware/authMiddleware');

router.use(verifyToken);

router.post('/', pcbController.createPCB);
router.get('/', pcbController.getAllPCBs);
router.get('/:id', pcbController.getPCBById);
router.post('/:id/components', pcbController.addComponentToPCB);
router.delete('/:id/components/:componentId', pcbController.removeComponentFromPCB);

module.exports = router;
