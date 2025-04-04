const Gallery = require('../models/Gallery');
const fs = require('fs');
const path = require('path');

/**
 * Get all galleries
 */
exports.getAllGalleries = async (req, res) => {
  try {
    const galleries = await Gallery.find().sort({ createdAt: -1 });
    
    res.render('admin/gallery/index', {
      title: 'Galereya boshqaruvi',
      galleries,
      user: req.user,
      path: '/admin/gallery',
      success_msg: req.flash('success'),
      error_msg: req.flash('error')
    });
  } catch (err) {
    console.error('Error loading galleries:', err);
    req.flash('error', 'Galereya ro\'yxatini yuklashda xatolik yuz berdi');
    res.redirect('/admin');
  }
};

/**
 * Display gallery creation form
 */
exports.createGalleryForm = (req, res) => {
  res.render('admin/gallery/create', {
    title: 'Galereya qo\'shish',
    user: req.user,
    path: '/admin/gallery/create',
    success_msg: req.flash('success'),
    error_msg: req.flash('error')
  });
};

/**
 * Create a new gallery
 */
exports.createGallery = async (req, res) => {
  try {
    const { title, description, category, tags, status } = req.body;
    
    // Check if images were uploaded
    if (!req.files || req.files.length === 0) {
      req.flash('error', 'Kamida bitta rasm yuklash kerak');
      return res.redirect('/admin/gallery/create');
    }
    
    // Process the uploaded images
    const images = req.files.map((file, index) => {
      return {
        path: `/uploads/${file.filename}`,
        caption: '',
        isMainImage: index === 0 // First image is the main image by default
      };
    });
    
    // Process tags
    let tagsArray = [];
    if (tags) {
      tagsArray = tags.split(',').map(tag => tag.trim());
    }
    
    // Create new gallery
    const gallery = new Gallery({
      title,
      description,
      images,
      category: category || 'Boshqa',
      tags: tagsArray,
      status: status || 'draft',
      author: req.user.id
    });
    
    await gallery.save();
    
    req.flash('success', 'Galereya muvaffaqiyatli yaratildi');
    res.redirect('/admin/gallery');
  } catch (err) {
    console.error('Error creating gallery:', err);
    req.flash('error', 'Galereya yaratishda xatolik yuz berdi');
    res.redirect('/admin/gallery/create');
  }
};

/**
 * Display gallery edit form
 */
exports.editGalleryForm = async (req, res) => {
  try {
    const gallery = await Gallery.findById(req.params.id);
    
    if (!gallery) {
      req.flash('error', 'Galereya topilmadi');
      return res.redirect('/admin/gallery');
    }
    
    res.render('admin/gallery/edit', {
      title: 'Galereyani tahrirlash',
      gallery,
      user: req.user,
      path: '/admin/gallery/edit',
      success_msg: req.flash('success'),
      error_msg: req.flash('error')
    });
  } catch (err) {
    console.error('Error loading gallery for edit:', err);
    req.flash('error', 'Galereya ma\'lumotlarini yuklashda xatolik yuz berdi');
    res.redirect('/admin/gallery');
  }
};

/**
 * Update a gallery
 */
exports.updateGallery = async (req, res) => {
  try {
    const { title, description, category, tags, status, imageActions } = req.body;
    const galleryId = req.params.id;
    
    // Find the gallery
    const gallery = await Gallery.findById(galleryId);
    if (!gallery) {
      req.flash('error', 'Galereya topilmadi');
      return res.redirect('/admin/gallery');
    }
    
    // Process tags
    let tagsArray = [];
    if (tags) {
      tagsArray = tags.split(',').map(tag => tag.trim());
    }
    
    // Update gallery fields
    gallery.title = title;
    gallery.description = description;
    gallery.category = category || gallery.category;
    gallery.tags = tagsArray;
    gallery.status = status || gallery.status;
    
    // Process image actions if any (delete, set as main, etc.)
    if (imageActions) {
      const actions = typeof imageActions === 'string' ? [imageActions] : imageActions;
      
      for (const action of actions) {
        const [actionType, imageIndex] = action.split(':');
        const index = parseInt(imageIndex);
        
        if (actionType === 'delete' && index >= 0 && index < gallery.images.length) {
          // Delete the image file
          const imagePath = path.join(process.cwd(), 'public', gallery.images[index].path);
          if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
          }
          
          // Remove the image from the array
          gallery.images.splice(index, 1);
        } else if (actionType === 'main' && index >= 0 && index < gallery.images.length) {
          // Set as main image
          gallery.images.forEach((img, i) => {
            img.isMainImage = i === index;
          });
        }
      }
    }
    
    // Add new images if uploaded
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => {
        return {
          path: `/uploads/${file.filename}`,
          caption: '',
          isMainImage: gallery.images.length === 0 // Only make it main if no other images
        };
      });
      
      gallery.images = [...gallery.images, ...newImages];
    }
    
    // Ensure at least one image is set as main
    if (gallery.images.length > 0) {
      const hasMainImage = gallery.images.some(img => img.isMainImage);
      if (!hasMainImage) {
        gallery.images[0].isMainImage = true;
      }
    }
    
    // Save the updated gallery
    await gallery.save();
    
    req.flash('success', 'Galereya muvaffaqiyatli yangilandi');
    res.redirect('/admin/gallery');
  } catch (err) {
    console.error('Error updating gallery:', err);
    req.flash('error', 'Galereyani yangilashda xatolik yuz berdi');
    res.redirect(`/admin/gallery/${req.params.id}/edit`);
  }
};

/**
 * Delete a gallery
 */
exports.deleteGallery = async (req, res) => {
  try {
    const galleryId = req.params.id;
    
    // Find gallery
    const gallery = await Gallery.findById(galleryId);
    
    if (!gallery) {
      req.flash('error', 'Galereya topilmadi');
      return res.redirect('/admin/gallery');
    }
    
    // Delete all images
    for (const image of gallery.images) {
      const imagePath = path.join(process.cwd(), 'public', image.path);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    // Delete the gallery
    await Gallery.findByIdAndDelete(galleryId);
    
    req.flash('success', 'Galereya muvaffaqiyatli o\'chirildi');
    res.redirect('/admin/gallery');
  } catch (err) {
    console.error('Error deleting gallery:', err);
    req.flash('error', 'Galereyani o\'chirishda xatolik yuz berdi');
    res.redirect('/admin/gallery');
  }
};

/**
 * API: Get all published galleries
 */
exports.getGalleriesApi = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const query = { status: 'published' };
    
    // Apply category filter if provided
    if (req.query.category) {
      query.category = req.query.category;
    }
    
    // Apply tag filter if provided
    if (req.query.tag) {
      query.tags = req.query.tag;
    }
    
    const [galleries, total] = await Promise.all([
      Gallery.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('author', 'username'),
      Gallery.countDocuments(query)
    ]);
    
    const totalPages = Math.ceil(total / limit);
    
    res.json({
      success: true,
      data: galleries,
      meta: {
        total,
        page,
        limit,
        totalPages
      }
    });
  } catch (err) {
    console.error('API Error fetching galleries:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Galereya ma\'lumotlarini olishda xatolik yuz berdi' 
    });
  }
};

/**
 * API: Get a single gallery by ID
 */
exports.getGalleryDetailApi = async (req, res) => {
  try {
    const gallery = await Gallery.findById(req.params.id)
      .populate('author', 'username');
    
    if (!gallery) {
      return res.status(404).json({ 
        success: false, 
        message: 'Galereya topilmadi' 
      });
    }
    
    // Increment views counter
    gallery.views += 1;
    await gallery.save();
    
    res.json({
      success: true,
      data: gallery
    });
  } catch (err) {
    console.error('API Error fetching gallery detail:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Galereya ma\'lumotlarini olishda xatolik yuz berdi' 
    });
  }
}; 