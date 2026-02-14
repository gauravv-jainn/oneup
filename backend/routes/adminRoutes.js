const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');

// Protect all admin routes
router.use(authMiddleware);

// User Management
router.get('/users', adminController.getUsers);
router.post('/users', adminController.createUser);
router.delete('/users/:id', adminController.deleteUser);

// Audit Logs
router.get('/audit-logs', adminController.getAuditLogs);

module.exports = router;
