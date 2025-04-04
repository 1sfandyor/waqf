const passport = require('passport');
const User = require('../models/User');

/**
 * Display login form
 */
exports.getLogin = (req, res) => {
  // If already logged in, redirect to admin
  if (req.isAuthenticated()) {
    return res.redirect('/admin');
  }
  
  res.render('auth/login', {
    title: 'Tizimga kirish',
    message: req.flash()
  });
};

/**
 * Process login request
 */
exports.postLogin = (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      console.error('Authentication error:', err);
      req.flash('error', 'Tizimga kirishda xatolik yuz berdi');
      return res.redirect('/login');
    }
    
    if (!user) {
      req.flash('error', info.message);
      return res.redirect('/login');
    }
    
    req.logIn(user, (err) => {
      if (err) {
        console.error('Login error:', err);
        req.flash('error', 'Tizimga kirishda xatolik yuz berdi');
        return res.redirect('/login');
      }
      
      return res.redirect('/admin');
    });
  })(req, res, next);
};

/**
 * Process logout request
 */
exports.logout = (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error('Logout error:', err);
      req.flash('error', 'Tizimdan chiqishda xatolik yuz berdi');
      return res.redirect('/admin');
    }
    
    req.flash('success', 'Muvaffaqiyatli tizimdan chiqdingiz');
    res.redirect('/login');
  });
};

/**
 * Display password reset request form
 */
exports.getForgotPassword = (req, res) => {
  res.render('auth/forgot-password', {
    title: 'Parolni tiklash',
    message: req.flash()
  });
};

/**
 * Process password reset request
 */
exports.postForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      req.flash('error', 'Email kiritilishi shart');
      return res.redirect('/forgot-password');
    }
    
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      // For security, don't reveal that the email doesn't exist
      req.flash('success', 'Agar siz ro\'yxatdan o\'tgan bo\'lsangiz, elektron pochtangizga parolni tiklash bo\'yicha ko\'rsatmalar yuboriladi');
      return res.redirect('/login');
    }
    
    // Generate a password reset token
    const resetToken = user.generatePasswordResetToken();
    await user.save();
    
    // In a real application, send an email with the reset link
    // For now, just log it
    console.log(`Password reset link: http://localhost:3000/reset-password/${resetToken}`);
    
    req.flash('success', 'Elektron pochtangizga parolni tiklash bo\'yicha ko\'rsatmalar yuborildi');
    res.redirect('/login');
  } catch (err) {
    console.error('Forgot password error:', err);
    req.flash('error', 'Parolni tiklashda xatolik yuz berdi');
    res.redirect('/forgot-password');
  }
};

/**
 * Display password reset form
 */
exports.getResetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    
    // Find user with valid reset token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      req.flash('error', 'Parolni tiklash uchun yaroqsiz yoki muddati o\'tgan havola');
      return res.redirect('/forgot-password');
    }
    
    res.render('auth/reset-password', {
      title: 'Yangi parol o\'rnatish',
      token,
      message: req.flash()
    });
  } catch (err) {
    console.error('Reset password error:', err);
    req.flash('error', 'Parolni tiklashda xatolik yuz berdi');
    res.redirect('/forgot-password');
  }
};

/**
 * Process password reset
 */
exports.postResetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;
    
    // Validate passwords
    if (!password || !confirmPassword) {
      req.flash('error', 'Barcha maydonlarni to\'ldiring');
      return res.redirect(`/reset-password/${token}`);
    }
    
    if (password !== confirmPassword) {
      req.flash('error', 'Parollar mos kelmadi');
      return res.redirect(`/reset-password/${token}`);
    }
    
    // Find user with valid reset token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      req.flash('error', 'Parolni tiklash uchun yaroqsiz yoki muddati o\'tgan havola');
      return res.redirect('/forgot-password');
    }
    
    // Update password and clear reset token
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    
    await user.save();
    
    req.flash('success', 'Parolingiz muvaffaqiyatli yangilandi. Endi yangi parol bilan tizimga kirishingiz mumkin');
    res.redirect('/login');
  } catch (err) {
    console.error('Reset password error:', err);
    req.flash('error', 'Parolni yangilashda xatolik yuz berdi');
    res.redirect('/forgot-password');
  }
}; 