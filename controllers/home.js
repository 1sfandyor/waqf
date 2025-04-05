const News = require('../models/News');
const Slider = require('../models/Slider');
const Activity = require('../models/Activity');
const Statistic = require('../models/Statistic');
const Campaign = require('../models/Campaign');

// Bosh sahifa
exports.getHomePage = async (req, res) => {
  try {
    // Faol slayderlarni tartib bilan chiqarish
    const sliders = await Slider.find({ active: true }).sort({ order: 1 }).limit(5);
    
    // Kategoriyalar bo'yicha yangiliklar
    // Duyurular - news kategoriyasi
    const duyurular = await News.find({ 
      status: 'published', 
      category: 'news' 
    }).sort({ createdAt: -1 }).limit(6);
    
    // Barcha yangiliklar - sidebar uchun
    const latestNews = await News.find({ 
      status: 'published'
    }).sort({ createdAt: -1 }).limit(12);
    
    // Faoliyatlarni yuklash
    const activities = await Activity.find({ status: 'published' }).sort({ order: 1 });
    
    // Statistikalarni yuklash
    const statistics = await Statistic.find({ status: 'published' }).sort({ order: 1 });
    
    // Faol kampaniyani yuklash
    const activeCampaign = await Campaign.findOne({
      active: true,
      status: 'published'
    }).sort({ order: 1 });
    
    res.render('index', {
      title: 'Ezan Vakfı - Orta Asya halklarının infak eli',
      sliders,
      duyurular,
      latestNews,
      activities,
      statistics,
      activeCampaign
    });
    
  } catch (err) {
    console.error('Bosh sahifani yuklashda xatolik:', err);
    res.status(500).render('error', {
      message: 'Bosh sahifani yuklashda xatolik yuz berdi',
      error: { status: 500, stack: err.stack }
    });
  }
};

// Yangiliklar sahifasi
exports.getNewsPage = async (req, res) => {
  try {
    // Kategoriya filtri
    const category = req.query.category;
    let filter = { status: 'published' };
    
    // Agar kategoriya berilgan bo'lsa, uni filtrga qo'shish
    if (category) {
      filter.category = category;
    }
    
    // Chop etilgan yangiliklar
    const news = await News.find(filter)
      .sort({ createdAt: -1 })
      .lean();
    
    // So'nggi yangiliklar (sidebar uchun)
    const recentNews = await News.find({ status: 'published' })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();
        
    // Sarlavha kategoriyaga qarab o'zgarishi
    let pageTitle = 'Yangiliklar - Ezan Vakfı';
    if (category === 'news') {
      pageTitle = 'Duyurular - Ezan Vakfı';
    } else if (category === 'notes') {
      pageTitle = 'Bildiriler - Ezan Vakfı';
    } else if (category === 'future_project') {
      pageTitle = 'Gelecek projelerimiz - Ezan Vakfı';
    }
    
    res.render('news', {
      title: pageTitle,
      news,
      recentNews,
      category: category || 'all'
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