const passport = require('passport');
const User = require('../models/User');

// Show login form
exports.getLogin = (req, res) => {
  res.render('auth/login', {
    title: 'Admin Login',
    message: req.flash('error')
  });
};

// Process login
exports.postLogin = (req, res, next) => {
  passport.authenticate('local', {
    successRedirect: req.session.returnTo || '/admin/dashboard',
    failureRedirect: '/auth/login',
    failureFlash: true
  })(req, res, next);
  
  // Clear returnTo from session
  delete req.session.returnTo;
};

// Logout
exports.logout = (req, res) => {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/auth/login');
  });
};

// Show register form (admin only)
exports.getRegister = (req, res) => {
  if (req.user && req.user.role === 'admin') {
    res.render('auth/register', {
      title: 'Register New User'
    });
  } else {
    res.status(403).render('error', {
      title: 'Access Denied',
      message: 'You do not have permission to access this page',
      error: { status: 403, stack: '' }
    });
  }
};

// Process registration (admin only)
exports.postRegister = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    
    // Check if user with email already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    
    if (existingUser) {
      return res.render('auth/register', {
        title: 'Register New User',
        error: 'User with this email or username already exists',
        username,
        email
      });
    }
    
    // Create new user
    const newUser = new User({
      username,
      email,
      password,
      role: role || 'editor'
    });
    
    await newUser.save();
    
    req.flash('success_msg', 'User registered successfully');
    res.redirect('/admin/users');
  } catch (err) {
    res.render('auth/register', {
      title: 'Register New User',
      error: 'An error occurred during registration',
      username: req.body.username,
      email: req.body.email
    });
  }
}; 