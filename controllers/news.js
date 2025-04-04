const News = require('../models/News');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

// Set up multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/news';
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniquePrefix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniquePrefix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Faqat rasm fayllari qabul qilinadi!'), false);
  }
};

exports.upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

/**
 * Get all news for admin panel
 */
exports.getNewsList = async (req, res) => {
  try {
    const news = await News.find().sort({ createdAt: -1 });
    
    res.render('admin/news/index', {
      title: 'Yangiliklar boshqaruvi',
      news,
      user: req.user,
      path: '/admin/news',
      success_msg: req.flash('success'),
      error_msg: req.flash('error')
    });
  } catch (err) {
    console.error('Error loading news:', err);
    req.flash('error', 'Yangiliklar ro\'yxatini yuklashda xatolik yuz berdi');
    res.redirect('/admin');
  }
};

/**
 * Display news creation form
 */
exports.getNewsCreate = (req, res) => {
  res.render('admin/news/create', {
    title: 'Yangilik qo\'shish',
    user: req.user,
    path: '/admin/news/create',
    error: req.flash('error')
  });
};

/**
 * Create a new news article
 */
exports.postNewsCreate = async (req, res) => {
  try {
    console.log('Form data:', req.body);
    console.log('File:', req.file);
    
    const { title, content, category, tags, status } = req.body;
    console.log('Status qiymati:', status);
    let image = null;
    
    // Check if image was uploaded
    if (req.file) {
      // Ensure directory exists
      const uploadDir = path.join(process.cwd(), 'public/uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      image = `/uploads/${req.file.filename}`;
    }
    
    // Simple validation
    if (!title || !content) {
      if (req.file && image) {
        try {
          // Remove uploaded file if validation fails
          const filePath = path.join(process.cwd(), 'public', image);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (e) {
          console.error('Error deleting file:', e);
        }
      }
      
      return res.render('admin/news/create', {
        title: 'Yangilik qo\'shish',
        error: 'Sarlavha va matn kiritilishi shart',
        formData: req.body,
        user: req.user,
        path: '/admin/news/create'
      });
    }
    
    if (!image) {
      return res.render('admin/news/create', {
        title: 'Yangilik qo\'shish',
        error: 'Asosiy rasm kiritilishi shart',
        formData: req.body,
        user: req.user,
        path: '/admin/news/create'
      });
    }
    
    // Process tags
    let tagsArray = [];
    if (tags) {
      tagsArray = tags.split(',').map(tag => tag.trim());
    }
    
    // Create new news article
    const newsArticle = new News({
      title,
      content,
      category: category || 'Boshqa',
      tags: tagsArray,
      image,
      status: status || 'draft',
      author: req.user._id // Ensure we're using _id property
    });
    
    console.log('Yaratilgan yangilik holati:', newsArticle.status);
    await newsArticle.save();
    
    req.flash('success', 'Yangilik muvaffaqiyatli yaratildi');
    res.redirect('/admin/news');
  } catch (err) {
    console.error('Error creating news:', err);
    return res.render('admin/news/create', {
      title: 'Yangilik qo\'shish',
      error: 'Yangilik yaratishda xatolik yuz berdi: ' + err.message,
      formData: req.body,
      user: req.user
    });
  }
};

/**
 * Get news detail
 */
exports.getNewsDetail = async (req, res) => {
  try {
    const news = await News.findById(req.params.id).populate('author', 'username');
    
    if (!news) {
      req.flash('error', 'Yangilik topilmadi');
      return res.redirect('/admin/news');
    }
    
    res.render('admin/news/detail', {
      title: news.title,
      news,
      user: req.user,
      path: '/admin/news/detail'
    });
  } catch (err) {
    console.error('Error loading news detail:', err);
    req.flash('error', 'Yangilik ma\'lumotlarini yuklashda xatolik yuz berdi');
    res.redirect('/admin/news');
  }
};

/**
 * Display news edit form
 */
exports.getNewsEdit = async (req, res) => {
  try {
    const news = await News.findById(req.params.id);
    
    if (!news) {
      req.flash('error', 'Yangilik topilmadi');
      return res.redirect('/admin/news');
    }
    
    res.render('admin/news/edit', {
      title: 'Yangilikni tahrirlash',
      news,
      user: req.user,
      path: '/admin/news/edit',
      error: req.flash('error')
    });
  } catch (err) {
    console.error('Error loading news for edit:', err);
    req.flash('error', 'Yangilik ma\'lumotlarini yuklashda xatolik yuz berdi');
    res.redirect('/admin/news');
  }
};

/**
 * Update a news article
 */
exports.postNewsUpdate = async (req, res) => {
  try {
    const { title, content, category, tags, status } = req.body;
    const newsId = req.params.id;
    
    console.log('Update data:', req.body);
    console.log('Status qiymati:', status);
    
    // Simple validation
    if (!title || !content) {
      req.flash('error', 'Sarlavha va matn kiritilishi shart');
      return res.redirect(`/admin/news/${newsId}/edit`);
    }
    
    // Find the news article
    const news = await News.findById(newsId);
    if (!news) {
      req.flash('error', 'Yangilik topilmadi');
      return res.redirect('/admin/news');
    }
    
    // Process tags
    let tagsArray = [];
    if (tags) {
      tagsArray = tags.split(',').map(tag => tag.trim());
    }
    
    // Update news fields
    news.title = title;
    news.content = content;
    news.category = category || news.category;
    news.tags = tagsArray;
    
    // Holatni yangilash
    const oldStatus = news.status;
    news.status = status || 'draft';
    
    // Agar yangi status published bo'lsa va oldingi status draft bo'lgan bo'lsa, publishedAt ni o'rnatamiz
    if (news.status === 'published' && (oldStatus !== 'published' || !news.publishedAt)) {
      news.publishedAt = new Date();
    }
    
    news.updatedAt = Date.now();
    
    // Handle image update if file was uploaded
    if (req.file) {
      // Ensure upload directory exists
      const uploadDir = path.join(process.cwd(), 'public/uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      // Delete old image if it exists
      if (news.image) {
        try {
          const oldImagePath = path.join(process.cwd(), 'public', news.image);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        } catch (e) {
          console.error('Error deleting old image:', e);
        }
      }
      
      // Set new image path
      news.image = `/uploads/${req.file.filename}`;
    }
    
    console.log('Yangilangan yangilik holati:', news.status);
    await news.save();
    
    req.flash('success', 'Yangilik muvaffaqiyatli yangilandi');
    res.redirect('/admin/news');
  } catch (err) {
    console.error('Error updating news:', err);
    req.flash('error', 'Yangilikni yangilashda xatolik yuz berdi: ' + err.message);
    res.redirect(`/admin/news/${req.params.id}/edit`);
  }
};

/**
 * Delete a news article
 */
exports.deleteNews = async (req, res) => {
  try {
    const newsId = req.params.id;
    
    // Find news article
    const news = await News.findById(newsId);
    
    if (!news) {
      req.flash('error', 'Yangilik topilmadi');
      return res.redirect('/admin/news');
    }
    
    // Delete the associated image if it exists
    if (news.image) {
      const imagePath = path.join(process.cwd(), 'public', news.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    // Delete the news article
    await News.findByIdAndDelete(newsId);
    
    req.flash('success', 'Yangilik muvaffaqiyatli o\'chirildi');
    res.redirect('/admin/news');
  } catch (err) {
    console.error('Error deleting news:', err);
    req.flash('error', 'Yangilikni o\'chirishda xatolik yuz berdi');
    res.redirect('/admin/news');
  }
};

/**
 * API: Get all published news articles
 */
exports.getNewsApi = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const query = { status: 'published' };
    
    // Apply category filter if provided
    if (req.query.category) {
      query.category = req.query.category;
    }
    
    // Apply tag filter if provided
    if (req.query.tag) {
      query.tags = req.query.tag;
    }
    
    // Apply search filter if provided
    if (req.query.search) {
      query.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { content: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    
    const [news, total] = await Promise.all([
      News.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('author', 'username'),
      News.countDocuments(query)
    ]);
    
    const totalPages = Math.ceil(total / limit);
    
    res.json({
      success: true,
      data: news,
      meta: {
        total,
        page,
        limit,
        totalPages
      }
    });
  } catch (err) {
    console.error('API Error fetching news:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Yangiliklar ma\'lumotlarini olishda xatolik yuz berdi' 
    });
  }
};

/**
 * API: Get a single news article by ID
 */
exports.getNewsDetailApi = async (req, res) => {
  try {
    const news = await News.findById(req.params.id)
      .populate('author', 'username');
    
    if (!news) {
      return res.status(404).json({ 
        success: false, 
        message: 'Yangilik topilmadi' 
      });
    }
    
    // Increment views counter
    news.views += 1;
    await news.save();
    
    res.json({
      success: true,
      data: news
    });
  } catch (err) {
    console.error('API Error fetching news detail:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Yangilik ma\'lumotlarini olishda xatolik yuz berdi' 
    });
  }
}; 