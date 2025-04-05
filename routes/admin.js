const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const adminController = require('../controllers/admin');
const newsController = require('../controllers/news');
const galleryController = require('../controllers/galleryController');
const sliderController = require('../controllers/sliderController');
const activityController = require('../controllers/activityController');
const authController = require('../controllers/auth');
const statisticController = require('../controllers/statisticController');
const campaignController = require('../controllers/campaignController');
const { isAdmin, isAuthenticated, isEditor } = require('../middleware/auth');
const { validateImageFile, compressImages } = require('../middleware/fileValidation');

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Yuklanayotgan fayl uchun tegishli papkani tanlash
    let uploadDir;
    
    if (req.originalUrl.includes('/sliders')) {
      uploadDir = path.join(__dirname, '../public/uploads/sliders/');
    } else if (req.originalUrl.includes('/activities')) {
      uploadDir = path.join(__dirname, '../public/uploads/activities/');
    } else {
      uploadDir = path.join(__dirname, '../public/uploads/');
    }
    
    // Papka mavjud emasligini tekshirish va yaratish
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Xavfsiz fayl nomi yaratish
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '-').toLowerCase();
    const uniqueFileName = `${Date.now()}-${safeName}`;
    cb(null, uniqueFileName);
  }
});

// Rasmlar uchun fayl filterini yangilash
const fileFilter = (req, file, cb) => {
  // Faqat tasdiqlangan fayl turlari uchun ruxsat berish
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const allowedExtensions = /\.(jpg|jpeg|png|gif|webp)$/i;
  
  if (!allowedMimeTypes.includes(file.mimetype) || !allowedExtensions.test(file.originalname)) {
    req.fileValidationError = 'Faqat rasm fayllari qabul qilinadi (JPG, JPEG, PNG, GIF, WebP)';
    return cb(new Error(req.fileValidationError), false);
  }
  
  cb(null, true);
};

// Rasm uchun multer middlewareni yangilash
const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { 
    fileSize: 5 * 1024 * 1024 // 5MB hajmga cheklash
  }
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
router.post('/news/create', upload.single('image'), validateImageFile, compressImages, newsController.postNewsCreate);
router.get('/news/:id', newsController.getNewsDetail);
router.get('/news/:id/edit', newsController.getNewsEdit);
router.post('/news/:id/update', upload.single('image'), validateImageFile, compressImages, newsController.postNewsUpdate);
router.post('/news/:id/delete', newsController.deleteNews);

// Slider management routes
router.get('/sliders', isEditor, sliderController.getSliders);
router.get('/sliders/create', isEditor, sliderController.getCreateSlider);
router.post('/sliders/create', isEditor, upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'titleImage', maxCount: 1 }
]), validateImageFile, compressImages, sliderController.postCreateSlider);
router.get('/sliders/:id/edit', isEditor, sliderController.getEditSlider);
router.post('/sliders/:id/update', isEditor, upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'titleImage', maxCount: 1 }
]), validateImageFile, compressImages, sliderController.postUpdateSlider);
router.post('/sliders/:id/delete', isEditor, sliderController.deleteSlider);
router.post('/sliders/change-order', isEditor, sliderController.postChangeOrder);
router.post('/sliders/:id/toggle-status', isEditor, sliderController.toggleStatus);

// Gallery Management (Editor or Admin)
router.get('/gallery', isEditor, galleryController.getAllGalleries);
router.get('/gallery/create', isEditor, galleryController.createGalleryForm);
router.post('/gallery/create', isEditor, upload.array('images', 20), validateImageFile, compressImages, galleryController.createGallery);
router.get('/gallery/:id/edit', isEditor, galleryController.editGalleryForm);
router.post('/gallery/:id/edit', isEditor, upload.array('images', 20), validateImageFile, compressImages, galleryController.updateGallery);
router.post('/gallery/:id/delete', isEditor, galleryController.deleteGallery);

// Faoliyatlar management (Editor or Admin)
router.get('/activities', isEditor, activityController.getAllActivities);
router.get('/activities/create', isEditor, activityController.createActivityForm);
router.post('/activities/create', isEditor, upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'icon', maxCount: 1 }
]), validateImageFile, compressImages, activityController.createActivity);
router.get('/activities/:id/edit', isEditor, activityController.editActivityForm);
router.post('/activities/:id/edit', isEditor, upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'icon', maxCount: 1 }
]), validateImageFile, compressImages, activityController.updateActivity);
router.post('/activities/:id/delete', isEditor, activityController.deleteActivity);
router.post('/activities/:id/toggle-status', isEditor, activityController.toggleStatus);
router.post('/activities/change-order', isEditor, activityController.changeOrder);

// Statistics routes
router.get('/statistics', isAdmin, statisticController.getAllStatistics);
router.get('/statistics/create', isAdmin, statisticController.createStatisticForm);
router.post('/statistics/create', isAdmin, statisticController.uploadIcon, validateImageFile, compressImages, statisticController.createStatistic);
router.get('/statistics/:id/edit', isAdmin, statisticController.editStatisticForm);
router.post('/statistics/:id/edit', isAdmin, statisticController.uploadIcon, validateImageFile, compressImages, statisticController.updateStatistic);
router.get('/statistics/:id/delete', isAdmin, statisticController.deleteStatistic);
router.post('/statistics/:id/toggle-status', isAdmin, statisticController.toggleStatus);

// Campaigns routes (Maxsus takliflar)
router.get('/campaigns', isAdmin, campaignController.getAllCampaigns);
router.get('/campaigns/create', isAdmin, campaignController.createCampaignForm);
router.post('/campaigns/create', isAdmin, campaignController.upload.fields([
  { name: 'leftImage', maxCount: 1 },
  { name: 'rightImage', maxCount: 1 }
]), validateImageFile, compressImages, campaignController.createCampaign);
router.get('/campaigns/:id/edit', isAdmin, campaignController.editCampaignForm);
router.post('/campaigns/:id/edit', isAdmin, campaignController.upload.fields([
  { name: 'leftImage', maxCount: 1 },
  { name: 'rightImage', maxCount: 1 }
]), validateImageFile, compressImages, campaignController.updateCampaign);
router.post('/campaigns/:id/delete', isAdmin, campaignController.deleteCampaign);
router.post('/campaigns/:id/toggle-status', isAdmin, campaignController.toggleStatus);

// TinyMCE image upload route
router.post('/upload-image', upload.single('file'), validateImageFile, compressImages, adminController.uploadImage);

// Logout route
router.get('/logout', authController.logout);

module.exports = router; 