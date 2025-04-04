const mongoose = require('mongoose');
const slugify = require('slugify');

const NewsSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    unique: true
  },
  content: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['Vakf hayati', 'Duyurular', 'Boshqa'],
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
NewsSchema.pre('save', function(next) {
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
  
  next();
});

module.exports = mongoose.model('News', NewsSchema); 