const User = require('../models/User');
const News = require('../models/News');
const Gallery = require('../models/Gallery');
const Project = require('../models/Project');

/**
 * Display admin dashboard
 */
exports.getDashboard = async (req, res) => {
  try {
    // Fetch counts for dashboard stats
    const [newsCount, galleryCount, projectCount, userCount, latestNews] = await Promise.all([
      News.countDocuments(),
      Gallery.countDocuments(),
      Project.countDocuments(),
      User.countDocuments(),
      News.find().sort({ createdAt: -1 }).limit(5).populate('author', 'username')
    ]);

    // Prepare stats object
    const stats = {
      newsCount,
      galleryCount, 
      projectCount,
      userCount
    };

    res.render('admin/dashboard', {
      title: 'Boshqaruv paneli',
      stats,
      latestNews,
      user: req.user,
      path: '/admin/dashboard'
    });
  } catch (err) {
    console.error('Error loading dashboard:', err);
    req.flash('error', 'Boshqaruv panelini yuklashda xatolik yuz berdi');
    res.redirect('/admin');
  }
};

/**
 * Display user management page
 */
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    
    res.render('admin/users/index', {
      title: 'Foydalanuvchilar boshqaruvi',
      users,
      user: req.user,
      path: '/admin/users'
    });
  } catch (err) {
    console.error('Error loading users:', err);
    req.flash('error', 'Foydalanuvchilar ro\'yxatini yuklashda xatolik yuz berdi');
    res.redirect('/admin');
  }
};

/**
 * Display user creation form
 */
exports.getUserCreate = (req, res) => {
  res.render('admin/users/create', {
    title: 'Yangi foydalanuvchi qo\'shish',
    user: req.user,
    path: '/admin/users/create'
  });
};

/**
 * Create a new user
 */
exports.postUserCreate = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    
    // Simple validation
    if (!username || !email || !password) {
      req.flash('error', 'Barcha kerakli maydonlarni to\'ldiring');
      return res.redirect('/admin/users/create');
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      req.flash('error', 'Bu foydalanuvchi nomi yoki email allaqachon mavjud');
      return res.redirect('/admin/users/create');
    }
    
    // Create new user
    const newUser = new User({
      username,
      email,
      password,
      role: role || 'editor'
    });
    
    await newUser.save();
    
    req.flash('success', 'Foydalanuvchi muvaffaqiyatli yaratildi');
    res.redirect('/admin/users');
  } catch (err) {
    console.error('Error creating user:', err);
    req.flash('error', 'Foydalanuvchi yaratishda xatolik yuz berdi');
    res.redirect('/admin/users/create');
  }
};

/**
 * Display user edit form
 */
exports.getUserEdit = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      req.flash('error', 'Foydalanuvchi topilmadi');
      return res.redirect('/admin/users');
    }
    
    res.render('admin/users/edit', {
      title: 'Foydalanuvchini tahrirlash',
      editUser: user,
      user: req.user,
      path: '/admin/users/edit'
    });
  } catch (err) {
    console.error('Error loading user:', err);
    req.flash('error', 'Foydalanuvchi ma\'lumotlarini yuklashda xatolik yuz berdi');
    res.redirect('/admin/users');
  }
};

/**
 * Update a user
 */
exports.postUserUpdate = async (req, res) => {
  try {
    const { username, email, role, password } = req.body;
    const userId = req.params.id;
    
    // Simple validation
    if (!username || !email) {
      req.flash('error', 'Foydalanuvchi nomi va email kiritilishi shart');
      return res.redirect(`/admin/users/${userId}/edit`);
    }
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      req.flash('error', 'Foydalanuvchi topilmadi');
      return res.redirect('/admin/users');
    }
    
    // Check if username or email is already in use by another user
    const existingUser = await User.findOne({
      $and: [
        { _id: { $ne: userId } },
        { $or: [{ email }, { username }] }
      ]
    });
    
    if (existingUser) {
      req.flash('error', 'Bu foydalanuvchi nomi yoki email boshqa foydalanuvchi tomonidan ishlatilmoqda');
      return res.redirect(`/admin/users/${userId}/edit`);
    }
    
    // Update user
    user.username = username;
    user.email = email;
    user.role = role || user.role;
    
    // Only update password if provided
    if (password && password.trim() !== '') {
      user.password = password;
    }
    
    await user.save();
    
    req.flash('success', 'Foydalanuvchi ma\'lumotlari muvaffaqiyatli yangilandi');
    res.redirect('/admin/users');
  } catch (err) {
    console.error('Error updating user:', err);
    req.flash('error', 'Foydalanuvchi ma\'lumotlarini yangilashda xatolik yuz berdi');
    res.redirect(`/admin/users/${req.params.id}/edit`);
  }
};

/**
 * Delete a user
 */
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Check if user is trying to delete themselves
    if (userId === req.user.id) {
      req.flash('error', 'O\'zingizni o\'chirishingiz mumkin emas');
      return res.redirect('/admin/users');
    }
    
    // Check if user is admin when trying to delete another admin
    const userToDelete = await User.findById(userId);
    if (userToDelete.role === 'admin' && req.user.role !== 'admin') {
      req.flash('error', 'Administratorni faqat boshqa administrator o\'chirishi mumkin');
      return res.redirect('/admin/users');
    }
    
    // Delete user
    await User.findByIdAndDelete(userId);
    
    req.flash('success', 'Foydalanuvchi muvaffaqiyatli o\'chirildi');
    res.redirect('/admin/users');
  } catch (err) {
    console.error('Error deleting user:', err);
    req.flash('error', 'Foydalanuvchini o\'chirishda xatolik yuz berdi');
    res.redirect('/admin/users');
  }
};

/**
 * Display profile page
 */
exports.getProfile = (req, res) => {
  res.render('admin/profile', {
    title: 'Mening profilim',
    user: req.user,
    path: '/admin/profile',
    messages: req.flash()
  });
};

/**
 * Update user profile
 */
exports.postProfileUpdate = async (req, res) => {
  try {
    const { username, email, currentPassword, newPassword } = req.body;
    const userId = req.user.id;
    
    // Find user
    const user = await User.findById(userId);
    
    // Check if username or email is already in use by another user
    const existingUser = await User.findOne({
      $and: [
        { _id: { $ne: userId } },
        { $or: [{ email }, { username }] }
      ]
    });
    
    if (existingUser) {
      req.flash('error', 'Bu foydalanuvchi nomi yoki email boshqa foydalanuvchi tomonidan ishlatilmoqda');
      return res.redirect('/admin/profile');
    }
    
    // Update basic info
    user.username = username || user.username;
    user.email = email || user.email;
    
    // Update password if provided
    if (currentPassword && newPassword) {
      // Verify current password before setting new password
      const isMatch = await user.comparePassword(currentPassword);
      
      if (!isMatch) {
        req.flash('error', 'Joriy parol noto\'g\'ri');
        return res.redirect('/admin/profile');
      }
      
      user.password = newPassword;
    }
    
    await user.save();
    
    req.flash('success', 'Profil ma\'lumotlari muvaffaqiyatli yangilandi');
    res.redirect('/admin/profile');
  } catch (err) {
    console.error('Error updating profile:', err);
    req.flash('error', 'Profil ma\'lumotlarini yangilashda xatolik yuz berdi');
    res.redirect('/admin/profile');
  }
};

/**
 * Handle TinyMCE image uploads
 */
exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        error: 'Rasm yuklanmadi',
        message: 'Rasm yuklanmadi'
      });
    }
    
    // Faylni validatsiya qilish
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const allowedExtensions = /\.(jpg|jpeg|png|gif|webp)$/i;
    const fileSize = req.file.size;
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    // Fayl turini tekshirish
    if (!allowedMimeTypes.includes(req.file.mimetype) || !allowedExtensions.test(req.file.originalname)) {
      // Xato hosil bo'lsa, yuklangan faylni o'chirib tashlash
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(process.cwd(), req.file.path);
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      return res.status(400).json({ 
        error: 'Faqat rasm fayllari qabul qilinadi (JPG, JPEG, PNG, GIF, WebP)',
        message: 'Faqat rasm fayllari qabul qilinadi (JPG, JPEG, PNG, GIF, WebP)' 
      });
    }
    
    // Fayl hajmini tekshirish
    if (fileSize > maxSize) {
      // Xato hosil bo'lsa, yuklangan faylni o'chirib tashlash
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(process.cwd(), req.file.path);
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      return res.status(400).json({ 
        error: `Rasm hajmi 5MB dan oshmasligi kerak`,
        message: `Rasm hajmi 5MB dan oshmasligi kerak` 
      });
    }
    
    // Create image URL
    const imageUrl = `/uploads/${req.file.filename}`;
    
    // Return success response for TinyMCE
    return res.status(200).json({
      location: imageUrl
    });
  } catch (error) {
    console.error('Rasm yuklashda xatolik:', error);
    return res.status(500).json({ 
      error: 'Rasm yuklashda xatolik yuz berdi',
      message: 'Rasm yuklashda xatolik yuz berdi' 
    });
  }
}; 