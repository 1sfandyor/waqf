const express = require('express');
const router = express.Router();
const News = require('../models/News');

// News listing page
router.get('/', async (req, res) => {
  try {
    const category = req.query.category;
    const query = { isPublished: true };
    
    if (category) {
      query.category = category;
    }
    
    const news = await News.find(query)
      .sort({ publishDate: -1 })
      .populate('author', 'username')
      .lean();
    
    res.render('news/index', {
      title: 'News',
      category: category || 'all',
      news
    });
  } catch (err) {
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to fetch news',
      error: { status: 500, stack: '' }
    });
  }
});

// Single news detail page
router.get('/:slug', async (req, res) => {
  try {
    const news = await News.findOne({ slug: req.params.slug, isPublished: true })
      .populate('author', 'username')
      .lean();
    
    if (!news) {
      return res.status(404).render('error', {
        title: '404 - Not Found',
        message: 'The requested news does not exist',
        error: { status: 404, stack: '' }
      });
    }
    
    // Increment views
    await News.findOneAndUpdate(
      { slug: req.params.slug },
      { $inc: { views: 1 } }
    );
    
    // Get related news (same category, excluding current news)
    const relatedNews = await News.find({
      category: news.category,
      _id: { $ne: news._id },
      isPublished: true
    })
      .sort({ publishDate: -1 })
      .limit(3)
      .lean();
    
    res.render('news/detail', {
      title: news.title,
      news,
      relatedNews
    });
  } catch (err) {
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to fetch news',
      error: { status: 500, stack: '' }
    });
  }
});

module.exports = router;