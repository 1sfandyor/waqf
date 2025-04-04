const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { ensureAuthenticated, ensureNotAuthenticated, ensureAdmin } = require('../config/auth');

// Login page
router.get('/login', ensureNotAuthenticated, authController.getLogin);

// Login process
router.post('/login', ensureNotAuthenticated, authController.postLogin);

// Logout
router.get('/logout', ensureAuthenticated, authController.logout);

// Register page - only accessible by admin
router.get('/register', ensureAuthenticated, ensureAdmin, authController.getRegister);

// Register process - only accessible by admin
router.post('/register', ensureAuthenticated, ensureAdmin, authController.postRegister);

module.exports = router; 