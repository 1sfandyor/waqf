const mongoose = require('mongoose');
const slugify = require('slugify');

const ActivitySchema = new mongoose.Schema({
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
    required: true
  },
  image: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  order: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'draft'
  },
  showLessons: {
    type: Boolean,
    default: false
  },
  lessons: [{
    type: String,
    trim: true
  }],
  showGallery: {
    type: Boolean,
    default: false
  },
  gallery: [{
    type: String,
    trim: true
  }],
  showQuote: {
    type: Boolean,
    default: false
  },
  quote: {
    type: String,
    trim: true
  },
  quoteAuthor: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Generate slug before saving
ActivitySchema.pre('save', function(next) {
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
  
  next();
});

module.exports = mongoose.model('Activity', ActivitySchema); 