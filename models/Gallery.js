const mongoose = require('mongoose');
const slugify = require('slugify');

const GallerySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    unique: true
  },
  description: {
    type: String,
    trim: true
  },
  images: [{
    path: {
      type: String,
      required: true
    },
    caption: {
      type: String,
      default: ''
    },
    isMainImage: {
      type: Boolean,
      default: false
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  category: {
    type: String,
    enum: ['Tadbirlar', 'Loyihalar', 'Boshqa'],
    default: 'Boshqa'
  },
  tags: {
    type: [String],
    default: []
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'draft'
  },
  views: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  publishedAt: {
    type: Date
  }
});

// Generate slug before saving
GallerySchema.pre('save', function(next) {
  // If title is modified or new, generate slug
  if (this.isModified('title') || this.isNew) {
    const slug = slugify(this.title, {
      lower: true,
      strict: true
    });
    
    // Add a random string to ensure uniqueness
    this.slug = `${slug}-${Math.random().toString(36).substr(2, 6)}`;
  }
  
  // Update updatedAt
  this.updatedAt = Date.now();
  
  // If status changed to published, set publishedAt
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = Date.now();
  }
  
  // Ensure only one main image
  let mainImageFound = false;
  this.images.forEach(image => {
    if (image.isMainImage) {
      if (mainImageFound) {
        image.isMainImage = false;
      } else {
        mainImageFound = true;
      }
    }
  });
  
  // If no main image is set and there are images, set the first one as main
  if (!mainImageFound && this.images.length > 0) {
    this.images[0].isMainImage = true;
  }
  
  next();
});

module.exports = mongoose.model('Gallery', GallerySchema); 