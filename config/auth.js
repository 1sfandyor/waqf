module.exports = {
  // Ensure user is authenticated
  ensureAuthenticated: function(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    req.session.returnTo = req.originalUrl;
    res.redirect('/auth/login');
  },
  
  // Ensure user is not authenticated
  ensureNotAuthenticated: function(req, res, next) {
    if (!req.isAuthenticated()) {
      return next();
    }
    res.redirect('/admin/dashboard');
  },
  
  // Ensure user is admin
  ensureAdmin: function(req, res, next) {
    if (req.isAuthenticated() && req.user.role === 'admin') {
      return next();
    }
    res.status(403).render('error', {
      title: 'Access Denied',
      message: 'You do not have permission to access this page',
      error: { status: 403, stack: '' }
    });
  },
  
  // Ensure user is editor or admin
  ensureEditor: function(req, res, next) {
    if (req.isAuthenticated() && (req.user.role === 'editor' || req.user.role === 'admin')) {
      return next();
    }
    res.status(403).render('error', {
      title: 'Access Denied',
      message: 'You do not have permission to access this page',
      error: { status: 403, stack: '' }
    });
  }
}; 