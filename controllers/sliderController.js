const Slider = require('../models/Slider');
const fs = require('fs');
const path = require('path');
const { validationResult } = require('express-validator');

// Slayder ro'yxatini olish
exports.getSliders = async (req, res) => {
  try {
    const sliders = await Slider.find().sort({ order: 1 });
    res.render('admin/sliders/index', { 
      title: 'Slayderlar ro\'yxati',
      sliders,
      user: req.user,
      path: '/admin/sliders',
      success_msg: req.flash('success'),
      error_msg: req.flash('error')
    });
  } catch (error) {
    console.error('Slayder olishda xatolik:', error);
    req.flash('error', 'Slayderlar ro\'yxatini olishda xatolik yuz berdi');
    res.redirect('/admin/dashboard');
  }
};

// Yangi slayder yaratish sahifasi
exports.getCreateSlider = (req, res) => {
  res.render('admin/sliders/create', { 
    title: 'Yangi slayder yaratish',
    slider: {},
    user: req.user,
    path: '/admin/sliders/create',
    success_msg: req.flash('success'),
    error_msg: req.flash('error')
  });
};

// Yangi slayder yaratish
exports.postCreateSlider = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.render('admin/sliders/create', {
        title: 'Yangi slayder yaratish',
        slider: req.body,
        errors: errors.array(),
        user: req.user,
        path: '/admin/sliders/create',
        messages: req.flash()
      });
    }

    // Aktiv slayderlar sonini tekshirish
    const activeCount = await Slider.countDocuments({ active: true });
    
    // Agar 5 ta aktiv slayder bo'lsa va yangi slayder aktiv bo'lsa
    if (activeCount >= 5 && req.body.active === 'true') {
      req.flash('error', 'Eng ko\'pi bilan 5 ta aktiv slayder bo\'lishi mumkin');
      return res.render('admin/sliders/create', {
        title: 'Yangi slayder yaratish',
        slider: req.body,
        user: req.user,
        path: '/admin/sliders/create',
        messages: req.flash()
      });
    }

    // Rasm yuklash
    let imagePath = null;
    if (req.files && req.files.image && req.files.image[0]) {
      imagePath = `/uploads/sliders/${req.files.image[0].filename}`;
    } else if (req.file) {
      // Eski usulda rasm yuklangan bo'lsa
      imagePath = `/uploads/sliders/${req.file.filename}`;
    } else {
      req.flash('error', 'Slayder uchun rasm yuklash shart');
      return res.render('admin/sliders/create', {
        title: 'Yangi slayder yaratish',
        slider: req.body,
        user: req.user,
        path: '/admin/sliders/create',
        messages: req.flash()
      });
    }

    // Sarlavha rasmi yuklash (agar tanlangan bo'lsa)
    let titleImagePath = null;
    if (req.files && req.files.titleImage && req.files.titleImage[0]) {
      titleImagePath = `/uploads/sliders/${req.files.titleImage[0].filename}`;
    }

    // Eng katta order raqamini topish va undan 1 ta katta qilish
    const maxOrderSlider = await Slider.findOne().sort({ order: -1 });
    const newOrder = maxOrderSlider ? maxOrderSlider.order + 1 : 1;

    // Sarlavha turi bo'yicha slider yaratish
    const sliderData = {
      image: imagePath,
      description: req.body.description || '',
      buttonText: req.body.buttonText || '',
      buttonLink: req.body.buttonLink || '#',
      active: req.body.active === 'true',
      order: newOrder
    };

    // Sarlavha turi matn yoki rasm bo'lishiga qarab qo'shish
    if (req.body.titleType === 'image' && titleImagePath) {
      sliderData.titleImage = titleImagePath;
      sliderData.title = '';
    } else {
      sliderData.title = req.body.title || '';
      sliderData.titleImage = null;
    }

    const slider = new Slider(sliderData);

    await slider.save();
    req.flash('success', 'Slayder muvaffaqiyatli yaratildi');
    res.redirect('/admin/sliders');
  } catch (error) {
    console.error('Slayder yaratishda xatolik:', error);
    req.flash('error', 'Slayder yaratishda xatolik yuz berdi');
    res.render('admin/sliders/create', {
      title: 'Yangi slayder yaratish',
      slider: req.body,
      user: req.user,
      path: '/admin/sliders/create',
      messages: req.flash()
    });
  }
};

// Slayderni tahrirlash sahifasi
exports.getEditSlider = async (req, res) => {
  try {
    const slider = await Slider.findById(req.params.id);
    if (!slider) {
      req.flash('error', 'Slayder topilmadi');
      return res.redirect('/admin/sliders');
    }

    res.render('admin/sliders/edit', {
      title: 'Slayderni tahrirlash',
      slider,
      user: req.user,
      path: `/admin/sliders/${req.params.id}/edit`,
      success_msg: req.flash('success'),
      error_msg: req.flash('error')
    });
  } catch (error) {
    console.error('Slayderni tahrirlashda xatolik:', error);
    req.flash('error', 'Slayderni tahrirlashda xatolik yuz berdi');
    res.redirect('/admin/sliders');
  }
};

// Slayderni yangilash
exports.postUpdateSlider = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.render('admin/sliders/edit', {
        title: 'Slayderni tahrirlash',
        slider: { ...req.body, _id: req.params.id },
        errors: errors.array(),
        user: req.user,
        path: `/admin/sliders/${req.params.id}/edit`,
        messages: req.flash()
      });
    }

    const slider = await Slider.findById(req.params.id);
    if (!slider) {
      req.flash('error', 'Slayder topilmadi');
      return res.redirect('/admin/sliders');
    }

    // Aktiv slayderlar sonini tekshirish
    const willBeActive = req.body.active === 'true';
    
    // Agar slider aktiv emas bo'lib, aktiv qilinayotgan bo'lsa
    if (!slider.active && willBeActive) {
      const activeCount = await Slider.countDocuments({ active: true });
      if (activeCount >= 5) {
        req.flash('error', 'Eng ko\'pi bilan 5 ta aktiv slayder bo\'lishi mumkin');
        return res.render('admin/sliders/edit', {
          title: 'Slayderni tahrirlash',
          slider: { ...req.body, _id: req.params.id },
          user: req.user,
          path: `/admin/sliders/${req.params.id}/edit`,
          messages: req.flash()
        });
      }
    }

    // Asosiy rasm yangilanishi
    let imagePath = slider.image;
    if (req.files && req.files.image && req.files.image[0]) {
      // Eski rasmni o'chirish
      if (slider.image) {
        const oldImagePath = path.join(__dirname, '..', 'public', slider.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      imagePath = `/uploads/sliders/${req.files.image[0].filename}`;
    } else if (req.file) {
      // Eski usulda rasm yuklangan bo'lsa
      // Eski rasmni o'chirish
      if (slider.image) {
        const oldImagePath = path.join(__dirname, '..', 'public', slider.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      imagePath = `/uploads/sliders/${req.file.filename}`;
    }

    // Sarlavha rasmi yangilanishi
    let titleImagePath = slider.titleImage;
    if (req.files && req.files.titleImage && req.files.titleImage[0]) {
      // Eski sarlavha rasmini o'chirish
      if (slider.titleImage) {
        const oldTitleImagePath = path.join(__dirname, '..', 'public', slider.titleImage);
        if (fs.existsSync(oldTitleImagePath)) {
          fs.unlinkSync(oldTitleImagePath);
        }
      }
      titleImagePath = `/uploads/sliders/${req.files.titleImage[0].filename}`;
    }

    // Sarlavha turi bo'yicha slider ma'lumotlarini yangilash
    if (req.body.titleType === 'image') {
      // Agar sarlavha turi rasm bo'lsa
      if (titleImagePath) {
        slider.titleImage = titleImagePath;
      } else if (req.body.titleType === 'image' && !slider.titleImage) {
        // Agar sarlavha turi rasmi tanlandi lekin rasm yuklanmagan va oldin ham yo'q bo'lsa
        req.flash('error', 'Sarlavha rasm turini tanladingiz, lekin rasm yuklamadingiz');
        return res.render('admin/sliders/edit', {
          title: 'Slayderni tahrirlash',
          slider: { ...req.body, _id: req.params.id, titleImage: slider.titleImage, image: slider.image },
          user: req.user,
          path: `/admin/sliders/${req.params.id}/edit`,
          messages: req.flash()
        });
      }
      slider.title = '';
    } else {
      // Agar sarlavha turi matn bo'lsa
      slider.title = req.body.title || '';
      
      // Eski sarlavha rasmini o'chirish
      if (slider.titleImage) {
        const oldTitleImagePath = path.join(__dirname, '..', 'public', slider.titleImage);
        if (fs.existsSync(oldTitleImagePath)) {
          fs.unlinkSync(oldTitleImagePath);
        }
        slider.titleImage = null;
      }
    }

    slider.description = req.body.description || '';
    slider.buttonText = req.body.buttonText || '';
    slider.buttonLink = req.body.buttonLink || '#';
    slider.image = imagePath;
    slider.active = willBeActive;
    slider.updatedAt = Date.now();

    await slider.save();
    req.flash('success', 'Slayder muvaffaqiyatli yangilandi');
    res.redirect('/admin/sliders');
  } catch (error) {
    console.error('Slayderni yangilashda xatolik:', error);
    req.flash('error', 'Slayderni yangilashda xatolik yuz berdi');
    res.render('admin/sliders/edit', {
      title: 'Slayderni tahrirlash',
      slider: { ...req.body, _id: req.params.id },
      user: req.user,
      path: `/admin/sliders/${req.params.id}/edit`,
      messages: req.flash()
    });
  }
};

// Slayder tartibini o'zgartirish
exports.postChangeOrder = async (req, res) => {
  try {
    const { sliderId, direction } = req.body;
    
    const slider = await Slider.findById(sliderId);
    if (!slider) {
      return res.status(404).json({ success: false, message: 'Slayder topilmadi' });
    }

    let targetSlider;
    
    if (direction === 'up') {
      // Yuqorida joylashgan slayderni topish
      targetSlider = await Slider.findOne({ order: { $lt: slider.order } }).sort({ order: -1 });
    } else {
      // Pastda joylashgan slayderni topish
      targetSlider = await Slider.findOne({ order: { $gt: slider.order } }).sort({ order: 1 });
    }

    if (!targetSlider) {
      return res.status(400).json({ success: false, message: `Slayderni ${direction === 'up' ? 'yuqoriga' : 'pastga'} ko'tarish mumkin emas` });
    }

    // Tartib raqamlarini almashtirish
    const tempOrder = slider.order;
    slider.order = targetSlider.order;
    targetSlider.order = tempOrder;

    await slider.save();
    await targetSlider.save();

    res.json({ success: true, message: 'Slayder tartibi muvaffaqiyatli o\'zgartirildi' });
  } catch (error) {
    console.error('Slayder tartibini o\'zgartirishda xatolik:', error);
    res.status(500).json({ success: false, message: 'Slayder tartibini o\'zgartirishda xatolik yuz berdi' });
  }
};

// Slayderni o'chirish
exports.deleteSlider = async (req, res) => {
  try {
    const slider = await Slider.findById(req.params.id);
    if (!slider) {
      req.flash('error', 'Slayder topilmadi');
      return res.redirect('/admin/sliders');
    }

    // Rasmni o'chirish
    if (slider.image) {
      const imagePath = path.join(__dirname, '..', 'public', slider.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await Slider.findByIdAndDelete(req.params.id);
    req.flash('success', 'Slayder muvaffaqiyatli o\'chirildi');
    res.redirect('/admin/sliders');
  } catch (error) {
    console.error('Slayderni o\'chirishda xatolik:', error);
    req.flash('error', 'Slayderni o\'chirishda xatolik yuz berdi');
    res.redirect('/admin/sliders');
  }
};

// Slayder holatini o'zgartirish
exports.toggleStatus = async (req, res) => {
  try {
    const sliderId = req.params.id;
    const { status } = req.body;
    
    // Slayderni topish
    const slider = await Slider.findById(sliderId);
    if (!slider) {
      return res.status(404).json({ success: false, message: 'Slayder topilmadi' });
    }
    
    // Status o'zgartirish
    slider.status = status;
    await slider.save();
    
    res.status(200).json({ success: true, message: 'Slayder statusi muvaffaqiyatli o\'zgartirildi' });
  } catch (error) {
    console.error('Slayder statusini o\'zgartirishda xatolik:', error);
    res.status(500).json({ success: false, message: 'Slayder statusini o\'zgartirishda xatolik yuz berdi' });
  }
};

// Publish qilingan slayderlarni olish (API)
exports.getPublishedSliders = async (req, res) => {
  try {
    const sliders = await Slider.find({ 
      status: 'published',
      active: true 
    }).sort({ order: 1 });
    
    res.status(200).json(sliders);
  } catch (error) {
    console.error('Publish qilingan slayderlarni olishda xatolik:', error);
    res.status(500).json({ error: 'Slayderlarni olishda xatolik yuz berdi' });
  }
};

module.exports = exports; 