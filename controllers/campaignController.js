const Campaign = require('../models/Campaign');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

// Rasmlar uchun storage konfiguratsiyasi
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadPath = 'public/uploads/campaigns';
    
    // Papka mavjud emasligini tekshirish va yaratish
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: function(req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`);
  }
});

// File upload filter
const fileFilter = (req, file, cb) => {
  // Faqat tasdiqlangan fayl turlari uchun ruxsat berish
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const allowedExtensions = /\.(jpg|jpeg|png|gif|webp)$/i;
  
  if (!allowedMimeTypes.includes(file.mimetype) || !allowedExtensions.test(file.originalname)) {
    req.fileValidationError = 'Faqat rasm fayllari qabul qilinadi (JPG, JPEG, PNG, GIF, WebP)';
    return cb(new Error(req.fileValidationError), false);
  }
  
  cb(null, true);
};

exports.upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Admin: Barcha kampaniyalarni ko'rish
exports.getAllCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find().sort({ order: 1 });
    
    res.render('admin/campaigns/index', {
      title: 'Maxsus takliflar boshqaruvi',
      campaigns,
      user: req.user,
      success_msg: req.flash('success_msg'),
      error_msg: req.flash('error_msg'),
      path: '/admin/campaigns'
    });
  } catch (err) {
    req.flash('error_msg', 'Maxsus takliflarni yuklashda xatolik yuz berdi');
    res.redirect('/admin/dashboard');
  }
};

// Admin: Yangi kampaniya yaratish formasi
exports.createCampaignForm = (req, res) => {
  res.render('admin/campaigns/create', {
    title: 'Yangi maxsus taklif qo\'shish',
    user: req.user,
    success_msg: req.flash('success_msg'),
    error_msg: req.flash('error_msg'),
    path: '/admin/campaigns/create'
  });
};

// Admin: Yangi kampaniya yaratish
exports.createCampaign = async (req, res) => {
  try {
    let leftImagePath = '';
    let rightImagePath = '';
    
    if (req.files) {
      if (req.files.leftImage) {
        leftImagePath = `/uploads/campaigns/${req.files.leftImage[0].filename}`;
      }
      
      if (req.files.rightImage) {
        rightImagePath = `/uploads/campaigns/${req.files.rightImage[0].filename}`;
      }
    }
    
    const newCampaign = new Campaign({
      title: req.body.title,
      description: req.body.description,
      eventDate: req.body.eventDate,
      location: req.body.location,
      leftImage: leftImagePath,
      rightImage: rightImagePath,
      buttonText: req.body.buttonText,
      buttonLink: req.body.buttonLink,
      active: req.body.active === 'on',
      order: req.body.order,
      status: req.body.status
    });
    
    await newCampaign.save();
    
    req.flash('success_msg', 'Maxsus taklif muvaffaqiyatli qo\'shildi');
    res.redirect('/admin/campaigns');
  } catch (err) {
    console.error('Maxsus taklifni saqlashda xatolik:', err);
    req.flash('error_msg', 'Maxsus taklifni saqlashda xatolik yuz berdi');
    res.redirect('/admin/campaigns/create');
  }
};

// Admin: Kampaniya tahrirlash formasi
exports.editCampaignForm = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    
    if (!campaign) {
      req.flash('error_msg', 'Maxsus taklif topilmadi');
      return res.redirect('/admin/campaigns');
    }
    
    res.render('admin/campaigns/edit', {
      title: 'Maxsus taklifni tahrirlash',
      campaign,
      user: req.user,
      success_msg: req.flash('success_msg'),
      error_msg: req.flash('error_msg'),
      path: `/admin/campaigns/${req.params.id}/edit`
    });
  } catch (err) {
    req.flash('error_msg', 'Maxsus taklifni yuklashda xatolik yuz berdi');
    res.redirect('/admin/campaigns');
  }
};

// Admin: Kampaniyani yangilash
exports.updateCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    
    if (!campaign) {
      req.flash('error_msg', 'Maxsus taklif topilmadi');
      return res.redirect('/admin/campaigns');
    }
    
    let leftImagePath = campaign.leftImage;
    let rightImagePath = campaign.rightImage;
    
    if (req.files) {
      // Agar yangi chap rasm yuklangan bo'lsa
      if (req.files.leftImage) {
        // Eski rasmni o'chirish
        if (campaign.leftImage && fs.existsSync(path.join('public', campaign.leftImage))) {
          fs.unlinkSync(path.join('public', campaign.leftImage));
        }
        leftImagePath = `/uploads/campaigns/${req.files.leftImage[0].filename}`;
      }
      
      // Agar yangi o'ng rasm yuklangan bo'lsa
      if (req.files.rightImage) {
        // Eski rasmni o'chirish
        if (campaign.rightImage && fs.existsSync(path.join('public', campaign.rightImage))) {
          fs.unlinkSync(path.join('public', campaign.rightImage));
        }
        rightImagePath = `/uploads/campaigns/${req.files.rightImage[0].filename}`;
      }
    }
    
    // Kampaniyani yangilash
    campaign.title = req.body.title;
    campaign.description = req.body.description;
    campaign.eventDate = req.body.eventDate;
    campaign.location = req.body.location;
    campaign.leftImage = leftImagePath;
    campaign.rightImage = rightImagePath;
    campaign.buttonText = req.body.buttonText;
    campaign.buttonLink = req.body.buttonLink;
    campaign.active = req.body.active === 'on';
    campaign.order = req.body.order;
    campaign.status = req.body.status;
    
    await campaign.save();
    
    req.flash('success_msg', 'Maxsus taklif muvaffaqiyatli yangilandi');
    res.redirect('/admin/campaigns');
  } catch (err) {
    console.error('Maxsus taklifni yangilashda xatolik:', err);
    req.flash('error_msg', 'Maxsus taklifni yangilashda xatolik yuz berdi');
    res.redirect(`/admin/campaigns/${req.params.id}/edit`);
  }
};

// Admin: Kampaniyani o'chirish
exports.deleteCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    
    if (!campaign) {
      req.flash('error_msg', 'Maxsus taklif topilmadi');
      return res.redirect('/admin/campaigns');
    }
    
    // Rasmlarni o'chirish
    if (campaign.leftImage && fs.existsSync(path.join('public', campaign.leftImage))) {
      fs.unlinkSync(path.join('public', campaign.leftImage));
    }
    
    if (campaign.rightImage && fs.existsSync(path.join('public', campaign.rightImage))) {
      fs.unlinkSync(path.join('public', campaign.rightImage));
    }
    
    await Campaign.findByIdAndDelete(req.params.id);
    
    req.flash('success_msg', 'Maxsus taklif muvaffaqiyatli o\'chirildi');
    res.redirect('/admin/campaigns');
  } catch (err) {
    req.flash('error_msg', 'Maxsus taklifni o\'chirishda xatolik yuz berdi');
    res.redirect('/admin/campaigns');
  }
};

// Admin: Kampaniya holatini o'zgartirish
exports.toggleStatus = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Maxsus taklif topilmadi' });
    }
    
    campaign.active = !campaign.active;
    await campaign.save();
    
    res.status(200).json({ success: true, active: campaign.active });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Serverda xatolik yuz berdi' });
  }
};

// Public API: Active kampaniyalarni olish
exports.getActiveCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findOne({
      active: true,
      status: 'published'
    }).sort({ order: 1 });
    
    if (!campaign) {
      return res.status(404).json({ message: 'Faol maxsus takliflar mavjud emas' });
    }
    
    res.status(200).json(campaign);
  } catch (err) {
    res.status(500).json({ message: 'Serverda xatolik yuz berdi' });
  }
}; 