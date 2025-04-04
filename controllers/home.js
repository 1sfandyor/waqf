const News = require('../models/News');

// Bosh sahifa
exports.getHomePage = (req, res) => {
  res.redirect('/news');
};

// Yangiliklar sahifasi
exports.getNewsPage = async (req, res) => {
  try {
    // Chop etilgan yangiliklar
    const news = await News.find({ status: 'published' })
      .sort({ createdAt: -1 })
      .lean();
    
    // So'nggi yangiliklar (sidebar uchun)
    const recentNews = await News.find({ status: 'published' })
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();
    
    console.log('Yangiliklar yuklandi:', news.length);
    
    res.render('news', {
      title: 'Yangiliklar - Ezan Vakfı',
      news,
      recentNews
    });
  } catch (err) {
    console.error('Yangiliklar yuklashda xatolik:', err);
    res.status(500).render('error', {
      message: 'Yangiliklar yuklashda xatolik yuz berdi',
      error: { status: 500, stack: err.stack }
    });
  }
};

// Yangilik detali sahifasi
exports.getNewsDetail = async (req, res) => {
    try {
        const slug = req.params.slug;
        
        // Yangilikni bazadan topish
        const news = await News.findOneAndUpdate(
            { slug: slug, status: 'published' },
            { $inc: { views: 1 } }, // Ko'rishlar sonini oshirish
            { new: true }
        ).populate('author', 'name');
        
        if (!news) {
            req.flash('error_msg', 'Yangilik topilmadi');
            return res.redirect('/news');
        }
        
        // So'nggi 5ta yangilikni olish
        const recentNews = await News.find({ 
            status: 'published', 
            _id: { $ne: news._id } 
        })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('title image slug createdAt');
        
        res.render('news-detail', {
            news,
            recentNews,
            title: news.title,
            path: '/news'
        });
    } catch (error) {
        console.error('Yangilik detali sahifasini yuklashda xatolik:', error);
        req.flash('error_msg', 'Serverda xatolik yuz berdi');
        res.redirect('/news');
    }
}; 