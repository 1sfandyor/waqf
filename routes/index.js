const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth');
const homeController = require('../controllers/home');

// Home page
router.get('/', (req, res) => {
  res.redirect('/login');
});

// Yangiliklar sahifasi
router.get('/news', homeController.getNewsPage);
router.get('/news.html', homeController.getNewsPage);
router.get('/news/:slug', homeController.getNewsDetail);

// Authentication routes
router.get('/login', authController.getLogin);
router.post('/login', authController.postLogin);
router.get('/logout', authController.logout);
router.get('/auth/logout', authController.logout);
router.get('/forgot-password', authController.getForgotPassword);
router.post('/forgot-password', authController.postForgotPassword);
router.get('/reset-password/:token', authController.getResetPassword);
router.post('/reset-password/:token', authController.postResetPassword);

module.exports = router; 