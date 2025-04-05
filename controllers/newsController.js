const News = require('../models/News');
const fs = require('fs');
const path = require('path');

// Get all news for admin panel
exports.getAllNews = async (req, res) => {
  try {
    const news = await News.find().sort({ publishDate: -1 }).populate('author', 'username');
    res.render('admin/news/index', {
      title: 'News Management',
      news,
      user: req.user,
      success_msg: req.flash('success_msg'),
      error_msg: req.flash('error_msg')
    });
  } catch (err) {
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to fetch news',
      error: { status: 500, stack: process.env.NODE_ENV === 'development' ? err.stack : '' }
    });
  }
};

// Display form to create a news
exports.createNewsForm = (req, res) => {
  res.render('admin/news/create', {
    title: 'Create News',
    user: req.user,
    success_msg: req.flash('success_msg'),
    error_msg: req.flash('error_msg'),
    error: ''
  });
};

// Process news creation
exports.createNews = async (req, res) => {
  try {
    const { title, content, category, tags, status } = req.body;
    let tagArray = [];
    
    // Validatsiya
    if (!title || !content) {
      return res.render('admin/news/create', {
        title: 'Create News',
        error: 'Sarlavha va matn kiritilishi shart',
        formData: req.body,
        user: req.user
      });
    }
    
    if (tags) {
      tagArray = tags.split(',').map(tag => tag.trim());
    }
    
    if (!req.file) {
      return res.render('admin/news/create', {
        title: 'Create News',
        error: 'Asosiy rasm kiritilishi shart',
        formData: req.body,
        user: req.user
      });
    }
    
    const news = new News({
      title,
      content,
      image: '/uploads/' + req.file.filename,
      category: category || 'other',
      author: req.user._id,
      tags: tagArray,
      status: status || 'draft'
    });
    
    await news.save();
    
    req.flash('success_msg', 'Yangilik muvaffaqiyatli yaratildi');
    res.redirect('/admin/news');
  } catch (err) {
    console.error('Yangilik yaratishda xatolik:', err);
    res.render('admin/news/create', {
      title: 'Create News',
      error: 'Yangilik yaratishda xatolik yuz berdi',
      formData: req.body,
      user: req.user
    });
  }
};

// Display form to edit a news
exports.editNewsForm = async (req, res) => {
  try {
    const news = await News.findById(req.params.id);
    
    if (!news) {
      req.flash('error_msg', 'Yangilik topilmadi');
      return res.redirect('/admin/news');
    }
    
    res.render('admin/news/edit', {
      title: 'Edit News',
      news,
      user: req.user,
      success_msg: req.flash('success_msg'),
      error_msg: req.flash('error_msg')
    });
  } catch (err) {
    req.flash('error_msg', 'Yangilik ma\'lumotlarini yuklashda xatolik');
    res.redirect('/admin/news');
  }
};

// Process news update
exports.updateNews = async (req, res) => {
  try {
    const { title, content, category, tags, isPublished } = req.body;
    let tagArray = [];
    
    if (tags) {
      tagArray = tags.split(',').map(tag => tag.trim());
    }
    
    const news = await News.findById(req.params.id);
    
    if (!news) {
      req.flash('error_msg', 'Yangilik topilmadi');
      return res.redirect('/admin/news');
    }
    
    news.title = title;
    news.content = content;
    news.category = category || 'other';
    news.tags = tagArray;
    news.isPublished = isPublished === 'true';
    
    // Update image if provided
    if (req.file) {
      // Delete old image
      if (news.featuredImage) {
        const oldImagePath = path.join(__dirname, '..', 'public', news.featuredImage);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      
      news.featuredImage = '/uploads/' + req.file.filename;
    }
    
    await news.save();
    
    req.flash('success_msg', 'Yangilik muvaffaqiyatli yangilandi');
    res.redirect('/admin/news');
  } catch (err) {
    req.flash('error_msg', 'Yangilikni yangilashda xatolik yuz berdi');
    res.redirect(`/admin/news/${req.params.id}/edit`);
  }
};

// Delete a news
exports.deleteNews = async (req, res) => {
  try {
    const news = await News.findById(req.params.id);
    
    if (!news) {
      req.flash('error_msg', 'Yangilik topilmadi');
      return res.redirect('/admin/news');
    }
    
    // Delete associated image
    if (news.featuredImage) {
      const imagePath = path.join(__dirname, '..', 'public', news.featuredImage);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    // Delete any gallery images
    if (news.gallery && news.gallery.length > 0) {
      news.gallery.forEach(image => {
        const galleryImagePath = path.join(__dirname, '..', 'public', image);
        if (fs.existsSync(galleryImagePath)) {
          fs.unlinkSync(galleryImagePath);
        }
      });
    }
    
    await News.findByIdAndDelete(req.params.id);
    
    req.flash('success_msg', 'Yangilik muvaffaqiyatli o\'chirildi');
    res.redirect('/admin/news');
  } catch (err) {
    req.flash('error_msg', 'Yangilikni o\'chirishda xatolik yuz berdi');
    res.redirect('/admin/news');
  }
};

// API: Get all published news
exports.getNewsApi = async (req, res) => {
  try {
    const category = req.query.category;
    const query = { status: 'published' };
    
    if (category) {
      query.category = category;
    }
    
    const news = await News.find(query)
      .sort({ createdAt: -1 })
      .select('title slug category image createdAt')
      .lean();
    
    res.status(200).json(news);
  } catch (err) {
    res.status(500).json({ error: 'Yangiliklar olishda xatolik' });
  }
};

// API: Get a single news by slug
exports.getNewsDetailApi = async (req, res) => {
  try {
    const news = await News.findOne({ 
      slug: req.params.slug, 
      status: 'published'
    }).lean();
    
    if (!news) {
      return res.status(404).json({ error: 'Yangilik topilmadi' });
    }
    
    // Increment views
    await News.findOneAndUpdate(
      { slug: req.params.slug },
      { $inc: { views: 1 } }
    );
    
    res.status(200).json(news);
  } catch (err) {
    res.status(500).json({ error: 'Yangilik ma\'lumotlarini olishda xatolik' });
  }
}; 