/**
 * Authentication middleware
 */

/**
 * Check if user is authenticated
 */
exports.isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  
  req.flash('error', 'Iltimos, avval tizimga kiring');
  res.redirect('/login');
};

/**
 * Check if user is admin
 */
exports.isAdmin = (req, res, next) => {
  if (req.isAuthenticated() && req.user.role === 'admin') {
    return next();
  }
  
  req.flash('error', 'Bu sahifaga kirishga ruxsat yo\'q. Faqat administratorlar kirishi mumkin.');
  res.redirect('/admin');
};

/**
 * Check if user is admin or editor
 */
exports.isEditor = (req, res, next) => {
  if (req.isAuthenticated() && (req.user.role === 'admin' || req.user.role === 'editor')) {
    return next();
  }
  
  req.flash('error', 'Bu sahifaga kirishga ruxsat yo\'q. Faqat tahrir huquqiga ega foydalanuvchilar kirishi mumkin.');
  res.redirect('/admin');
};

/**
 * Check if user is authenticated for API requests
 */
exports.isAuthenticatedApi = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  
  return res.status(401).json({ 
    success: false, 
    message: 'Avtorizatsiyadan o\'tilmagan' 
  });
};

/**
 * Check if user is admin for API requests
 */
exports.isAdminApi = (req, res, next) => {
  if (req.isAuthenticated() && req.user.role === 'admin') {
    return next();
  }
  
  return res.status(403).json({ 
    success: false, 
    message: 'Ruxsat berilmagan. Faqat administratorlar kirishi mumkin' 
  });
}; 