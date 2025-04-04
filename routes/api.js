const express = require('express');
const router = express.Router();
const newsController = require('../controllers/news');
const galleryController = require('../controllers/galleryController');
const News = require('../models/News');
const Gallery = require('../models/Gallery');
const Project = require('../models/Project');
const { isAuthenticatedApi, isAdminApi } = require('../middleware/auth');

// Public API endpoints
router.get('/news', newsController.getNewsApi);
router.get('/news/:id', newsController.getNewsDetailApi);
router.get('/galleries', galleryController.getGalleriesApi);
router.get('/galleries/:id', galleryController.getGalleryDetailApi);

// Gallery API endpoints - commented out due to function name mismatch
// router.get('/gallery', galleryController.getPublishedGalleries);
// router.get('/gallery/:id', galleryController.getGalleryById);

// Projects API endpoints
router.get('/projects', async (req, res) => {
  try {
    const category = req.query.category;
    const query = { isPublished: true };
    
    if (category) {
      query.category = category;
    }
    
    const projects = await Project.find(query)
      .sort({ createdAt: -1 })
      .lean();
    
    res.status(200).json(projects);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

router.get('/projects/:slug', async (req, res) => {
  try {
    const project = await Project.findOne({ slug: req.params.slug, isPublished: true })
      .lean();
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.status(200).json(project);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// Search API endpoint
router.get('/search', async (req, res) => {
  try {
    const query = req.query.q;
    
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    // Use regex to perform case-insensitive search
    const regex = new RegExp(query, 'i');
    
    // Search in news
    const news = await News.find({
      status: 'published',
      $or: [
        { title: regex },
        { content: regex },
        { tags: regex }
      ]
    })
      .select('title slug category image createdAt')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();
    
    // Search in galleries
    const galleries = await Gallery.find({
      status: 'published',
      $or: [
        { title: regex },
        { description: regex },
        { category: regex }
      ]
    })
      .select('title description category images createdAt')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();
    
    // Search in projects
    const projects = await Project.find({
      isPublished: true,
      $or: [
        { title: regex },
        { description: regex },
        { content: regex },
        { category: regex }
      ]
    })
      .select('title slug description image category status')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();
    
    // Transform gallery results to simplify the response
    const simplifiedGalleries = galleries.map(gallery => {
      const mainImage = gallery.images.find(img => img.isMainImage) || gallery.images[0];
      
      return {
        _id: gallery._id,
        title: gallery.title,
        description: gallery.description,
        mainImage: mainImage ? mainImage.path : null,
        category: gallery.category,
        createdAt: gallery.createdAt
      };
    });
    
    res.status(200).json({
      news,
      galleries: simplifiedGalleries,
      projects,
      total: news.length + simplifiedGalleries.length + projects.length
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to perform search' });
  }
});

// Protected API endpoints - require authentication
// Example of a protected endpoint:
// router.post('/news', isAuthenticatedApi, isAdminApi, newsController.createNewsApi);

module.exports = router; 