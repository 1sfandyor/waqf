const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const adminController = require('../controllers/admin');
const newsController = require('../controllers/news');
const galleryController = require('../controllers/galleryController');
const authController = require('../controllers/auth');
const { isAdmin, isAuthenticated, isEditor } = require('../middleware/auth');

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../public/uploads/'));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '-'));
  }
});

const fileFilter = (req, file, cb) => {
  // Accept images only
  if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF|webp|WEBP)$/)) {
    req.fileValidationError = 'Only image files are allowed!';
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB max size
});

// Admin authentication middleware - all admin routes require authentication
router.use(isAuthenticated);

// Dashboard
router.get('/', adminController.getDashboard);

// User management routes
router.get('/users', isAdmin, adminController.getUsers);
router.get('/users/create', isAdmin, adminController.getUserCreate);
router.post('/users/create', isAdmin, adminController.postUserCreate);
router.get('/users/:id/edit', isAdmin, adminController.getUserEdit);
router.post('/users/:id/update', isAdmin, adminController.postUserUpdate);
router.get('/users/:id/delete', isAdmin, adminController.deleteUser);

// Profile routes
router.get('/profile', adminController.getProfile);
router.post('/profile/update', adminController.postProfileUpdate);

// News management routes
router.get('/news', newsController.getNewsList);
router.get('/news/create', newsController.getNewsCreate);
router.post('/news/create', upload.single('image'), newsController.postNewsCreate);
router.get('/news/:id', newsController.getNewsDetail);
router.get('/news/:id/edit', newsController.getNewsEdit);
router.post('/news/:id/update', upload.single('image'), newsController.postNewsUpdate);
router.post('/news/:id/delete', newsController.deleteNews);

// Gallery Management (Editor or Admin)
router.get('/gallery', isEditor, galleryController.getAllGalleries);
router.get('/gallery/create', isEditor, galleryController.createGalleryForm);
router.post('/gallery/create', isEditor, upload.array('images', 20), galleryController.createGallery);
router.get('/gallery/:id/edit', isEditor, galleryController.editGalleryForm);
router.post('/gallery/:id/edit', isEditor, upload.array('images', 20), galleryController.updateGallery);
router.post('/gallery/:id/delete', isEditor, galleryController.deleteGallery);

// Logout route
router.get('/logout', authController.logout);

module.exports = router; 