const Activity = require('../models/Activity');
const fs = require('fs');
const path = require('path');

// Barcha faoliyatlarni ko'rish
exports.getAllActivities = async (req, res) => {
  try {
    // Barcha faoliyatlarni olish va ularni order bo'yicha saralash
    const activities = await Activity.find().sort({ order: 1 });

    res.render('admin/activities/index', {
      title: 'Faoliyatlar boshqaruvi',
      activities,
      user: req.user,
      path: '/admin/activities',
      success_msg: req.flash('success_msg'),
      error_msg: req.flash('error_msg')
    });
  } catch (error) {
    req.flash('error_msg', 'Faoliyatlarni yuklashda xatolik yuz berdi');
    res.redirect('/admin');
  }
};

// Yangi faoliyat yaratish formasi
exports.createActivityForm = (req, res) => {
  res.render('admin/activities/create', {
    title: 'Yangi faoliyat qo\'shish',
    user: req.user,
    path: '/admin/activities/create',
    success_msg: req.flash('success_msg'),
    error_msg: req.flash('error_msg')
  });
};

// Yangi faoliyat yaratish
exports.createActivity = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      url, 
      status,
      showLessons,
      lessons,
      showGallery,
      showQuote,
      quote,
      quoteAuthor
    } = req.body;
    
    // Faoliyat uchun rasm va ikonka bo'lishi shart
    if (!req.files || !req.files.image || !req.files.icon) {
      req.flash('error_msg', 'Rasm va ikonka yuklash majburiy');
      return res.redirect('/admin/activities/create');
    }

    const imagePath = `/uploads/activities/${req.files.image[0].filename}`;
    const iconPath = `/uploads/activities/${req.files.icon[0].filename}`;

    // Galereyani qayta ishlash
    let galleryImages = [];
    if (req.files.gallery && req.files.gallery.length > 0) {
      galleryImages = req.files.gallery.map(file => `/uploads/activities/${file.filename}`);
    }

    // Darslar ro'yxatini qayta ishlash
    let lessonsList = [];
    if (lessons && typeof lessons === 'string') {
      lessonsList = [lessons];
    } else if (lessons && Array.isArray(lessons)) {
      lessonsList = lessons;
    }

    // Eng yuqori tartib raqamini topish
    const maxOrderActivity = await Activity.findOne().sort({ order: -1 });
    const order = maxOrderActivity ? maxOrderActivity.order + 1 : 1;

    // Yangi faoliyat yaratish
    const newActivity = new Activity({
      title,
      description,
      image: imagePath,
      icon: iconPath,
      url,
      status,
      order,
      showLessons: showLessons === 'on',
      lessons: lessonsList,
      showGallery: showGallery === 'on',
      gallery: galleryImages,
      showQuote: showQuote === 'on',
      quote,
      quoteAuthor
    });

    await newActivity.save();
    req.flash('success_msg', 'Faoliyat muvaffaqiyatli yaratildi');
    res.redirect('/admin/activities');
  } catch (error) {
    console.error('Faoliyat yaratishda xatolik:', error);
    req.flash('error_msg', 'Faoliyat yaratishda xatolik yuz berdi');
    res.redirect('/admin/activities/create');
  }
};

// Faoliyatni tahrirlash formasi
exports.editActivityForm = async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);
    
    if (!activity) {
      req.flash('error_msg', 'Faoliyat topilmadi');
      return res.redirect('/admin/activities');
    }

    res.render('admin/activities/edit', {
      title: 'Faoliyatni tahrirlash',
      activity,
      user: req.user,
      path: `/admin/activities/${req.params.id}/edit`,
      success_msg: req.flash('success_msg'),
      error_msg: req.flash('error_msg')
    });
  } catch (error) {
    req.flash('error_msg', 'Faoliyatni yuklashda xatolik yuz berdi');
    res.redirect('/admin/activities');
  }
};

// Faoliyatni yangilash
exports.updateActivity = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      url, 
      status,
      showLessons,
      lessons,
      showGallery,
      showQuote,
      quote,
      quoteAuthor
    } = req.body;
    
    const activity = await Activity.findById(req.params.id);
    
    if (!activity) {
      req.flash('error_msg', 'Faoliyat topilmadi');
      return res.redirect('/admin/activities');
    }

    // Ma'lumotlarni yangilash
    activity.title = title;
    activity.description = description;
    activity.url = url;
    activity.status = status;
    activity.showLessons = showLessons === 'on';
    activity.showGallery = showGallery === 'on';
    activity.showQuote = showQuote === 'on';
    activity.quote = quote;
    activity.quoteAuthor = quoteAuthor;

    // Darslar ro'yxatini qayta ishlash
    if (lessons && typeof lessons === 'string') {
      activity.lessons = [lessons];
    } else if (lessons && Array.isArray(lessons)) {
      activity.lessons = lessons;
    } else {
      activity.lessons = [];
    }

    // Agar yangi rasm yuklangan bo'lsa
    if (req.files && req.files.image && req.files.image.length > 0) {
      // Eski rasmni o'chirish
      try {
        const oldImagePath = path.join(__dirname, '../public', activity.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      } catch (err) {
        console.error('Eski rasmni o\'chirishda xatolik:', err);
      }
      
      // Yangi rasmni saqlash
      activity.image = `/uploads/activities/${req.files.image[0].filename}`;
    }

    // Agar yangi ikonka yuklangan bo'lsa
    if (req.files && req.files.icon && req.files.icon.length > 0) {
      // Eski ikonkani o'chirish
      try {
        const oldIconPath = path.join(__dirname, '../public', activity.icon);
        if (fs.existsSync(oldIconPath)) {
          fs.unlinkSync(oldIconPath);
        }
      } catch (err) {
        console.error('Eski ikonkani o\'chirishda xatolik:', err);
      }
      
      // Yangi ikonkani saqlash
      activity.icon = `/uploads/activities/${req.files.icon[0].filename}`;
    }

    // Agar yangi galeriya rasmlari yuklangan bo'lsa
    if (req.files && req.files.gallery && req.files.gallery.length > 0) {
      const newGalleryImages = req.files.gallery.map(file => `/uploads/activities/${file.filename}`);
      
      // Eski galeriya rasmlariga yangilarni qo'shish
      activity.gallery = [...activity.gallery, ...newGalleryImages];
    }

    await activity.save();
    req.flash('success_msg', 'Faoliyat muvaffaqiyatli yangilandi');
    res.redirect('/admin/activities');
  } catch (error) {
    console.error('Faoliyatni yangilashda xatolik:', error);
    req.flash('error_msg', 'Faoliyatni yangilashda xatolik yuz berdi');
    res.redirect(`/admin/activities/${req.params.id}/edit`);
  }
};

// Faoliyatni o'chirish
exports.deleteActivity = async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);
    
    if (!activity) {
      req.flash('error_msg', 'Faoliyat topilmadi');
      return res.redirect('/admin/activities');
    }

    // Rasmlarni o'chirish
    try {
      const imagePath = path.join(__dirname, '../public', activity.image);
      const iconPath = path.join(__dirname, '../public', activity.icon);
      
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
      
      if (fs.existsSync(iconPath)) {
        fs.unlinkSync(iconPath);
      }
    } catch (err) {
      console.error('Rasmlarni o\'chirishda xatolik:', err);
    }

    await Activity.deleteOne({ _id: req.params.id });
    req.flash('success_msg', 'Faoliyat muvaffaqiyatli o\'chirildi');
    res.redirect('/admin/activities');
  } catch (error) {
    req.flash('error_msg', 'Faoliyatni o\'chirishda xatolik yuz berdi');
    res.redirect('/admin/activities');
  }
};

// Faoliyat holatini o'zgartirish (publish/draft)
exports.toggleStatus = async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);
    
    if (!activity) {
      return res.status(404).json({ success: false, message: 'Faoliyat topilmadi' });
    }

    activity.status = activity.status === 'published' ? 'draft' : 'published';
    await activity.save();
    
    return res.status(200).json({ 
      success: true, 
      message: 'Status muvaffaqiyatli yangilandi',
      newStatus: activity.status
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Xatolik yuz berdi' });
  }
};

// Faoliyatlar tartibini o'zgartirish
exports.changeOrder = async (req, res) => {
  try {
    const { activities } = req.body;
    
    // Har bir faoliyat uchun yangi tartib raqamini saqlash
    for (const item of activities) {
      await Activity.findByIdAndUpdate(item.id, { order: item.order });
    }
    
    return res.status(200).json({ success: true, message: 'Tartib muvaffaqiyatli yangilandi' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Xatolik yuz berdi' });
  }
};

// API uchun barcha faoliyatlarni olish
exports.getActivitiesApi = async (req, res) => {
  try {
    const activities = await Activity.find({ status: 'published' })
      .sort({ order: 1 })
      .select('title description image icon url')
      .lean();
    
    res.status(200).json(activities);
  } catch (error) {
    console.error('API: Faoliyatlarni olishda xatolik:', error);
    res.status(500).json({ error: 'Faoliyatlarni olishda xatolik' });
  }
};

// API uchun bitta faoliyat ma'lumotini olish
exports.getActivityDetailApi = async (req, res) => {
  try {
    const activity = await Activity.findOne({ 
      status: 'published', 
      _id: req.params.slug 
    }).lean();
    
    if (!activity) {
      return res.status(404).json({ error: 'Faoliyat topilmadi' });
    }
    
    res.status(200).json(activity);
  } catch (error) {
    console.error('API: Faoliyat ma\'lumotlarini olishda xatolik:', error);
    res.status(500).json({ error: 'Faoliyat ma\'lumotlarini olishda xatolik' });
  }
};

// Frontend uchun faoliyat tafsilotlari sahifasi
exports.getActivityDetail = async (req, res) => {
  try {
    const activity = await Activity.findOne({ 
      slug: req.params.slug,
      status: 'published'
    });
    
    if (!activity) {
      return res.status(404).render('error', {
        message: 'Faoliyat topilmadi',
        error: { status: 404 }
      });
    }
    
    // So'nggi 5ta e'lon qilingan faoliyatlar (hozirgi faoliyatdan tashqari)
    const otherActivities = await Activity.find({
      status: 'published',
      _id: { $ne: activity._id }
    })
    .sort({ order: 1 })
    .limit(5)
    .select('title icon image url');
    
    res.render('activities-detail', {
      title: activity.title,
      activity,
      otherActivities
    });
  } catch (error) {
    console.error('Faoliyat tafsilotlarini yuklashda xatolik:', error);
    res.status(500).render('error', {
      message: 'Serverda xatolik yuz berdi',
      error: { status: 500, stack: error.stack }
    });
  }
}; 