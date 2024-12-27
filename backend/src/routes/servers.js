const express = require('express');
const router = express.Router();
const serverController = require('../controllers/server.controller');
const { authMiddleware, adminMiddleware } = require('../middleware/auth.middleware');

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Server management routes
router.post('/', adminMiddleware, serverController.addServer);
router.get('/', serverController.getAllServers);
router.get('/:id', serverController.getServer);
router.put('/:id', adminMiddleware, serverController.updateServer);
router.delete('/:id', adminMiddleware, serverController.deleteServer);

// Server operations routes
router.post('/:id/connect', serverController.connectToServer);
router.post('/:id/command', serverController.executeCommand);
router.get('/:id/ovn/check', serverController.checkOVNInstallation);
router.post('/:id/ovn/install', adminMiddleware, serverController.installOVN);

module.exports = router;
