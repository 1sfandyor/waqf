/**
 * Rasmlarni yuklash va tekshirish uchun middlewareler
 */
const fs = require('fs');
const path = require('path');
const tinify = require('tinify');
const multer = require('multer');

// TinyPNG API kalitini o'rnatish
if (process.env.TINIFY_API_KEY) {
  tinify.key = process.env.TINIFY_API_KEY;
}

/**
 * Multer xatolarini ushlab oluvchi middleware
 */
exports.handleMulterErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Multer xatolari
    if (err.code === 'LIMIT_FILE_SIZE') {
      req.flash('error_msg', 'Fayl hajmi juda katta! Maksimal ruxsat etilgan hajm: 5MB');
      
      // Agar request o'z yo'nalishini aniqlay olsak, shu yo'nalishga qaytaramiz
      if (req.originalUrl && req.originalUrl.includes('/statistics/create')) {
        return res.redirect('/admin/statistics/create');
      } else if (req.originalUrl && req.originalUrl.includes('/statistics/')) {
        const id = req.params.id || req.originalUrl.split('/').filter(Boolean).pop();
        return res.redirect(`/admin/statistics/${id}/edit`);
      } else if (req.originalUrl && req.originalUrl.includes('/campaigns/create')) {
        return res.redirect('/admin/campaigns/create');
      } else if (req.originalUrl && req.originalUrl.includes('/campaigns/')) {
        const id = req.params.id || req.originalUrl.split('/').filter(Boolean).pop();
        return res.redirect(`/admin/campaigns/${id}/edit`);
      } else if (req.originalUrl && req.originalUrl.includes('/gallery/create')) {
        return res.redirect('/admin/gallery/create');
      } else if (req.originalUrl && req.originalUrl.includes('/gallery/')) {
        const id = req.params.id || req.originalUrl.split('/').filter(Boolean).pop();
        return res.redirect(`/admin/gallery/${id}/edit`);
      }
      
      // Agar TinyMCE editor orqali yuklayotgan bo'lsa, JSON xato qaytaramiz
      if (req.originalUrl && req.originalUrl.includes('/upload-image')) {
        return res.status(413).json({
          success: false,
          message: 'Fayl hajmi juda katta! Maksimal ruxsat etilgan hajm: 5MB'
        });
      }
      
      // Boshqa holatda admin panelga qaytarish
      return res.redirect('/admin');
    }
    
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      req.flash('error_msg', 'Kutilmagan fayl yuklandi');
      return res.redirect(req.originalUrl || '/admin');
    }
  }
  
  // Boshqa xatolarni keyingi middlewarega uzatish
  next(err);
};

/**
 * Rasm fayllarini tekshirish uchun middleware
 */
exports.validateImageFile = (req, res, next) => {
  // Agar fayl yuklanmagan bo'lsa, keyingi middleware ga o'tish
  if (!req.file && !req.files) {
    return next();
  }
  
  // Ruxsat berilgan MIME turlar va kengaytmalar
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
  const allowedExtensions = /\.(jpg|jpeg|png|gif|webp|svg)$/i;
  const maxSize = 5 * 1024 * 1024; // 5MB
  
  // Yagona fayl tekshirish
  if (req.file) {
    const { mimetype, originalname, size, path: filePath } = req.file;
    
    if (!allowedMimeTypes.includes(mimetype) || !allowedExtensions.test(originalname)) {
      // Faylni o'chirib tashlash
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      req.flash('error_msg', 'Faqat rasm fayllari qabul qilinadi (JPG, JPEG, PNG, GIF, WebP, SVG)');
      
      if (req.xhr || req.originalUrl.includes('/upload-image')) {
        return res.status(400).json({
          success: false,
          message: 'Faqat rasm fayllari qabul qilinadi (JPG, JPEG, PNG, GIF, WebP, SVG)'
        });
      } else {
        return res.redirect(req.originalUrl || '/admin');
      }
    }
    
    if (size > maxSize) {
      // Faylni o'chirib tashlash
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      req.flash('error_msg', 'Rasm hajmi 5MB dan oshmasligi kerak');
      
      if (req.xhr || req.originalUrl.includes('/upload-image')) {
        return res.status(400).json({
          success: false,
          message: 'Rasm hajmi 5MB dan oshmasligi kerak'
        });
      } else {
        return res.redirect(req.originalUrl || '/admin');
      }
    }
  }
  
  // Ko'p fayllar tekshirish (array)
  if (req.files && Array.isArray(req.files)) {
    for (const file of req.files) {
      const { mimetype, originalname, size, path: filePath } = file;
      
      if (!allowedMimeTypes.includes(mimetype) || !allowedExtensions.test(originalname)) {
        // Barcha fayllarni o'chirib tashlash
        for (const f of req.files) {
          if (fs.existsSync(f.path)) {
            fs.unlinkSync(f.path);
          }
        }
        
        req.flash('error_msg', 'Faqat rasm fayllari qabul qilinadi (JPG, JPEG, PNG, GIF, WebP, SVG)');
        return res.redirect(req.originalUrl || '/admin');
      }
      
      if (size > maxSize) {
        // Barcha fayllarni o'chirib tashlash
        for (const f of req.files) {
          if (fs.existsSync(f.path)) {
            fs.unlinkSync(f.path);
          }
        }
        
        req.flash('error_msg', 'Rasm hajmi 5MB dan oshmasligi kerak');
        return res.redirect(req.originalUrl || '/admin');
      }
    }
  }
  
  // Ko'p fayllar tekshirish (object)
  if (req.files && !Array.isArray(req.files)) {
    for (const fieldname in req.files) {
      for (const file of req.files[fieldname]) {
        const { mimetype, originalname, size, path: filePath } = file;
        
        if (!allowedMimeTypes.includes(mimetype) || !allowedExtensions.test(originalname)) {
          // Barcha fayllarni o'chirib tashlash
          for (const fn in req.files) {
            for (const f of req.files[fn]) {
              if (fs.existsSync(f.path)) {
                fs.unlinkSync(f.path);
              }
            }
          }
          
          req.flash('error_msg', 'Faqat rasm fayllari qabul qilinadi (JPG, JPEG, PNG, GIF, WebP, SVG)');
          return res.redirect(req.originalUrl || '/admin');
        }
        
        if (size > maxSize) {
          // Barcha fayllarni o'chirib tashlash
          for (const fn in req.files) {
            for (const f of req.files[fn]) {
              if (fs.existsSync(f.path)) {
                fs.unlinkSync(f.path);
              }
            }
          }
          
          req.flash('error_msg', 'Rasm hajmi 5MB dan oshmasligi kerak');
          return res.redirect(req.originalUrl || '/admin');
        }
      }
    }
  }
  
  next();
};

/**
 * TinyPNG bilan rasmni siqish funksiyasi
 */
exports.compressImage = async (filePath) => {
  try {
    if (!process.env.TINIFY_API_KEY) {
      console.log('TINIFY_API_KEY topilmadi, rasm siqilmadi');
      return;
    }
    
    // Faqat jpg, png, webp fayllarini siqish
    const allowedExtensions = /\.(jpg|jpeg|png|webp)$/i;
    if (!allowedExtensions.test(filePath)) {
      return;
    }
    
    const fullPath = path.join(process.cwd(), 'public', filePath);
    
    // Asosiy fayl uchun zahira nusxa yaratish
    const backupPath = `${fullPath}.backup`;
    fs.copyFileSync(fullPath, backupPath);
    
    // TinyPNG orqali rasmni siqish
    await tinify.fromFile(fullPath).toFile(fullPath);
    
    // Siqish muvaffaqiyatli bo'lsa zahira faylni o'chirish
    fs.unlinkSync(backupPath);
    console.log(`Rasm siqildi: ${filePath}`);
  } catch (err) {
    console.error('Rasmni siqishda xatolik:', err);
    
    // Xatolik yuz berganda zahira nusxani qaytarish
    const fullPath = path.join(process.cwd(), 'public', filePath);
    const backupPath = `${fullPath}.backup`;
    
    if (fs.existsSync(backupPath)) {
      fs.copyFileSync(backupPath, fullPath);
      fs.unlinkSync(backupPath);
    }
  }
};

/**
 * TinyPNG bilan rasmlarni siqish middleware
 */
exports.compressImages = (req, res, next) => {
  // Fayl yuklangan bo'lsa, keyin siqish (async ishlasin)
  setTimeout(async () => {
    try {
      if (req.file) {
        // Yagona fayl uchun
        await exports.compressImage(req.file.path.replace('public/', ''));
      } else if (req.files) {
        // Ko'p fayllar uchun
        if (Array.isArray(req.files)) {
          // Array formatida kelgan fayllar
          for (const file of req.files) {
            await exports.compressImage(file.path.replace('public/', ''));
          }
        } else {
          // Obyekt formatida kelgan fayllar
          for (const fieldname in req.files) {
            for (const file of req.files[fieldname]) {
              await exports.compressImage(file.path.replace('public/', ''));
            }
          }
        }
      }
    } catch (error) {
      console.error('Rasmlarni siqishda xatolik:', error);
    }
  }, 0);
  
  next();
}; 