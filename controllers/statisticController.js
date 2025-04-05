const Statistic = require('../models/Statistic');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

// Fayl yuklash konfiguratsiyasi
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadDir = 'public/uploads/icons';
    // Papka mavjud emas bo'lsa yaratamiz
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    // Xavfsiz fayl nomi yaratish
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = `icon-${uniqueSuffix}${ext}`;
    cb(null, safeName);
  }
});

// Faqat rasmlarni qabul qilish
const fileFilter = (req, file, cb) => {
  // MIME-type va kengaytma tekshirish
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
  const allowedExtensions = /\.(jpg|jpeg|png|gif|webp|svg)$/i;
  
  if (!allowedMimeTypes.includes(file.mimetype) || !allowedExtensions.test(file.originalname)) {
    return cb(new Error('Faqat rasm fayllari (JPG, PNG, GIF, WEBP, SVG) qabul qilinadi!'), false);
  }
  
  // Faylni o'qib, haqiqatdan rasm ekanligini tekshirish
  if (file.mimetype !== 'image/svg+xml') {
    // Bu yerda rasm header signaturalarini tekshirish mumkin
    // Oddiy tekshiruv uchun faqat MIME-type ga ishonib qo'yamiz
  }
  
  cb(null, true);
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// ===== ADMIN CONTROLLER FUNCTIONS =====

// Barcha statistikalarni olish
exports.getAllStatistics = async (req, res) => {
  try {
    const statistics = await Statistic.find().sort({ order: 1 });
    
    res.render('admin/statistics/index', {
      title: 'Statistika boshqaruvi',
      user: req.user,
      statistics,
      path: '/admin/statistics',
      success_msg: req.flash('success_msg'),
      error_msg: req.flash('error_msg')
    });
  } catch (err) {
    console.error('Statistika ma\'lumotlarini olishda xatolik:', err);
    req.flash('error_msg', 'Statistika ma\'lumotlarini olishda xatolik yuz berdi');
    res.redirect('/admin');
  }
};

// Yangi statistika qo'shish formasi
exports.createStatisticForm = (req, res) => {
  res.render('admin/statistics/create', {
    title: 'Yangi statistika qo\'shish',
    user: req.user,
    path: '/admin/statistics/create',
    formData: req.body,
    success_msg: req.flash('success_msg'),
    error_msg: req.flash('error_msg')
  });
};

// Ikonka faylini yuklash middleware
exports.uploadIcon = upload.single('iconFile');

// Yangi statistika qo'shish
exports.createStatistic = async (req, res) => {
  try {
    const { title, value, icon, description, order, status } = req.body;
    
    // Yangi statistika ma'lumotlari
    const newStatisticData = {
      title,
      value,
      description: description || '',
      order: order || 0,
      status: status || 'published'
    };
    
    // Agar fayl yuklangan bo'lsa, uni ishlatamiz
    if (req.file) {
      // Fayl yo'lini /uploads/icons/filename.ext formatida saqlash
      newStatisticData.icon = `/uploads/icons/${req.file.filename}`;
    } else {
      // Aks holda, kiritilgan URL ni ishlatamiz
      newStatisticData.icon = icon || '';
    }

    // Yangi statistika yaratish
    const newStatistic = new Statistic(newStatisticData);
    await newStatistic.save();

    req.flash('success_msg', 'Statistika muvaffaqiyatli qo\'shildi');
    res.redirect('/admin/statistics');
  } catch (err) {
    console.error('Statistika qo\'shishda xatolik:', err);
    req.flash('error_msg', 'Statistika qo\'shishda xatolik yuz berdi');
    res.redirect('/admin/statistics/create');
  }
};

// Statistikani tahrirlash formasi
exports.editStatisticForm = async (req, res) => {
  try {
    const statistic = await Statistic.findById(req.params.id);
    
    if (!statistic) {
      req.flash('error_msg', 'Statistika topilmadi');
      return res.redirect('/admin/statistics');
    }
    
    res.render('admin/statistics/edit', {
      title: 'Statistikani tahrirlash',
      user: req.user,
      path: '/admin/statistics',
      statistic,
      success_msg: req.flash('success_msg'),
      error_msg: req.flash('error_msg')
    });
  } catch (err) {
    console.error('Statistika ma\'lumotlarini olishda xatolik:', err);
    req.flash('error_msg', 'Statistika ma\'lumotlarini olishda xatolik yuz berdi');
    res.redirect('/admin/statistics');
  }
};

// Statistikani yangilash
exports.updateStatistic = async (req, res) => {
  try {
    const { title, value, icon, description, order, status } = req.body;

    const statistic = await Statistic.findById(req.params.id);

    if (!statistic) {
      req.flash('error_msg', 'Statistika topilmadi');
      return res.redirect('/admin/statistics');
    }

    // Statistikani yangilash
    statistic.title = title;
    statistic.value = value;
    statistic.description = description || '';
    statistic.order = order || 0;
    statistic.status = status || 'published';
    
    // Agar yangi fayl yuklangan bo'lsa
    if (req.file) {
      // Eski fayl mavjud bo'lsa va u serverda saqlangan bo'lsa, uni o'chiramiz
      if (statistic.icon && statistic.icon.startsWith('/uploads/icons/')) {
        const oldFilePath = path.join(__dirname, '../public', statistic.icon);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }
      
      // Yangi fayl yo'lini saqlash
      statistic.icon = `/uploads/icons/${req.file.filename}`;
    } else if (icon) {
      // Yangi fayl yuklanmagan, lekin icon maydoni yangilangan bo'lsa
      statistic.icon = icon;
    }

    await statistic.save();

    req.flash('success_msg', 'Statistika muvaffaqiyatli yangilandi');
    res.redirect('/admin/statistics');
  } catch (err) {
    console.error('Statistikani yangilashda xatolik:', err);
    req.flash('error_msg', 'Statistikani yangilashda xatolik yuz berdi');
    res.redirect(`/admin/statistics/${req.params.id}/edit`);
  }
};

// Statistikani o'chirish
exports.deleteStatistic = async (req, res) => {
  try {
    const statistic = await Statistic.findById(req.params.id);
    
    if (!statistic) {
      req.flash('error_msg', 'Statistika topilmadi');
      return res.redirect('/admin/statistics');
    }
    
    // Agar fayl lokaldagi serverda saqlangan bo'lsa, o'chiramiz
    if (statistic.icon && statistic.icon.startsWith('/uploads/icons/')) {
      const filePath = path.join(__dirname, '../public', statistic.icon);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    // Ma'lumotni bazadan o'chirish
    await Statistic.findByIdAndDelete(req.params.id);
    
    req.flash('success_msg', 'Statistika muvaffaqiyatli o\'chirildi');
    res.redirect('/admin/statistics');
  } catch (err) {
    console.error('Statistikani o\'chirishda xatolik:', err);
    req.flash('error_msg', 'Statistikani o\'chirishda xatolik yuz berdi');
    res.redirect('/admin/statistics');
  }
};

// Statistika holatini o'zgartirish
exports.toggleStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    const statistic = await Statistic.findById(req.params.id);
    
    if (!statistic) {
      return res.status(404).json({
        success: false,
        message: 'Statistika topilmadi'
      });
    }
    
    statistic.status = status;
    await statistic.save();
    
    res.status(200).json({
      success: true,
      message: 'Statistika holati muvaffaqiyatli o\'zgartirildi'
    });
  } catch (err) {
    console.error('Statistika holatini o\'zgartirishda xatolik:', err);
    res.status(500).json({
      success: false,
      message: 'Statistika holatini o\'zgartirishda xatolik yuz berdi'
    });
  }
};

// ===== API CONTROLLER FUNCTIONS =====

// Barcha statistikalarni olish (API)
exports.getStatisticsApi = async (req, res) => {
  try {
    const statistics = await Statistic.find({ status: 'published' })
      .sort({ order: 1 })
      .lean();
    
    res.status(200).json(statistics);
  } catch (err) {
    console.error('API: Statistika ma\'lumotlarini olishda xatolik:', err);
    res.status(500).json({ error: 'Statistika ma\'lumotlarini olishda xatolik yuz berdi' });
  }
}; 