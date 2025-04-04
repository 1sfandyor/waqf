const User = require('../models/User');
const News = require('../models/News');
const Gallery = require('../models/Gallery');
const Project = require('../models/Project');

// Dashboard page
exports.getDashboard = async (req, res) => {
  try {
    // Get counts
    const newsCount = await News.countDocuments();
    const galleryCount = await Gallery.countDocuments();
    const projectCount = await Project.countDocuments();
    const userCount = await User.countDocuments();
    
    // Get recent news
    const recentNews = await News.find()
      .sort({ publishDate: -1 })
      .limit(5)
      .populate('author', 'username');
    
    // Get popular news (most viewed)
    const popularNews = await News.find()
      .sort({ views: -1 })
      .limit(5);
    
    // Get recent galleries
    const recentGalleries = await Gallery.find()
      .sort({ createdAt: -1 })
      .limit(5);
    
    res.render('admin/dashboard', {
      title: 'Admin Dashboard',
      counts: {
        news: newsCount,
        galleries: galleryCount,
        projects: projectCount,
        users: userCount
      },
      recentNews,
      popularNews,
      recentGalleries
    });
  } catch (err) {
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to load dashboard data',
      error: { status: 500, stack: process.env.NODE_ENV === 'development' ? err.stack : '' }
    });
  }
};

// Users management
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    
    res.render('admin/users/index', {
      title: 'User Management',
      users
    });
  } catch (err) {
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to fetch users',
      error: { status: 500, stack: process.env.NODE_ENV === 'development' ? err.stack : '' }
    });
  }
};

// Edit user form
exports.editUserForm = async (req, res) => {
  try {
    // Only admin can edit users
    if (req.user.role !== 'admin') {
      req.flash('error_msg', 'You do not have permission to edit users');
      return res.redirect('/admin/dashboard');
    }
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      req.flash('error_msg', 'User not found');
      return res.redirect('/admin/users');
    }
    
    res.render('admin/users/edit', {
      title: 'Edit User',
      user
    });
  } catch (err) {
    req.flash('error_msg', 'Failed to fetch user');
    res.redirect('/admin/users');
  }
};

// Update user
exports.updateUser = async (req, res) => {
  try {
    // Only admin can update users
    if (req.user.role !== 'admin') {
      req.flash('error_msg', 'You do not have permission to update users');
      return res.redirect('/admin/dashboard');
    }
    
    const { username, email, role } = req.body;
    const user = await User.findById(req.params.id);
    
    if (!user) {
      req.flash('error_msg', 'User not found');
      return res.redirect('/admin/users');
    }
    
    // Update fields
    user.username = username;
    user.email = email;
    user.role = role;
    
    // Update password if provided
    if (req.body.password && req.body.password.trim() !== '') {
      user.password = req.body.password;
    }
    
    await user.save();
    
    req.flash('success_msg', 'User updated successfully');
    res.redirect('/admin/users');
  } catch (err) {
    req.flash('error_msg', 'Failed to update user');
    res.redirect(`/admin/users/${req.params.id}/edit`);
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    // Only admin can delete users
    if (req.user.role !== 'admin') {
      req.flash('error_msg', 'You do not have permission to delete users');
      return res.redirect('/admin/dashboard');
    }
    
    // Prevent admin from deleting themselves
    if (req.params.id === req.user.id) {
      req.flash('error_msg', 'You cannot delete your own account');
      return res.redirect('/admin/users');
    }
    
    await User.findByIdAndDelete(req.params.id);
    
    req.flash('success_msg', 'User deleted successfully');
    res.redirect('/admin/users');
  } catch (err) {
    req.flash('error_msg', 'Failed to delete user');
    res.redirect('/admin/users');
  }
};

// Profile page
exports.getProfile = (req, res) => {
  res.render('admin/profile', {
    title: 'Your Profile',
    user: req.user
  });
};

// Update profile
exports.updateProfile = async (req, res) => {
  try {
    const { username, email } = req.body;
    const user = await User.findById(req.user.id);
    
    // Update fields
    user.username = username;
    user.email = email;
    
    // Update password if provided
    if (req.body.password && req.body.password.trim() !== '') {
      user.password = req.body.password;
    }
    
    await user.save();
    
    req.flash('success_msg', 'Profile updated successfully');
    res.redirect('/admin/profile');
  } catch (err) {
    req.flash('error_msg', 'Failed to update profile');
    res.redirect('/admin/profile');
  }
}; 