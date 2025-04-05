const Statistic = require('../models/Statistic');
const fs = require('fs');
const path = require('path');

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

// Yangi statistika qo'shish
exports.createStatistic = async (req, res) => {
  try {
    const { title, value, icon, description, order, status } = req.body;
    
    // Yangi statistika yaratish
    const newStatistic = new Statistic({
      title,
      value,
      icon: icon || '',
      description: description || '',
      order: order || 0,
      status: status || 'published'
    });
    
    await newStatistic.save();
    
    req.flash('success_msg', 'Statistika muvaffaqiyatli qo\'shildi');
    res.redirect('/admin/statistics');
  } catch (err) {
    console.error('Statistika qo\'shishda xatolik:', err);
    req.flash('error_msg', 'Statistika qo\'shishda xatolik yuz berdi');
    res.render('admin/statistics/create', {
      title: 'Yangi statistika qo\'shish',
      user: req.user,
      path: '/admin/statistics/create',
      formData: req.body,
      success_msg: req.flash('success_msg'),
      error_msg: req.flash('error_msg')
    });
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
      statistic,
      path: `/admin/statistics/${req.params.id}/edit`,
      success_msg: req.flash('success_msg'),
      error_msg: req.flash('error_msg')
    });
  } catch (err) {
    console.error('Statistikani tahrirlash formasini ochishda xatolik:', err);
    req.flash('error_msg', 'Statistikani tahrirlash formasini ochishda xatolik yuz berdi');
    res.redirect('/admin/statistics');
  }
};

// Statistikani tahrirlash
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
    statistic.icon = icon || '';
    statistic.description = description || '';
    statistic.order = order || 0;
    statistic.status = status || 'published';
    
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
    const statistic = await Statistic.findByIdAndDelete(req.params.id);
    
    if (!statistic) {
      req.flash('error_msg', 'Statistika topilmadi');
    } else {
      req.flash('success_msg', 'Statistika muvaffaqiyatli o\'chirildi');
    }
    
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