const mongoose = require('mongoose');
const slugify = require('slugify');

const ProjectSchema = new mongoose.Schema({
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
  additionalImages: [{
    path: {
      type: String,
      required: true
    },
    caption: {
      type: String,
      default: ''
    }
  }],
  category: {
    type: String,
    enum: ['Qurilish', 'Ta\'lim', 'Yordam', 'Boshqa'],
    default: 'Boshqa'
  },
  location: {
    type: String,
    trim: true
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
  budget: {
    amount: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: 'UZS'
    }
  },
  fundraisingGoal: {
    amount: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: 'UZS'
    }
  },
  collectedAmount: {
    amount: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: 'UZS'
    }
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
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
    enum: ['planning', 'active', 'completed', 'cancelled'],
    default: 'planning'
  },
  isPublished: {
    type: Boolean,
    default: false
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
ProjectSchema.pre('save', function(next) {
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
  
  // If isPublished changed to true, set publishedAt
  if (this.isModified('isPublished') && this.isPublished && !this.publishedAt) {
    this.publishedAt = Date.now();
  }
  
  // Calculate progress if collectedAmount and fundraisingGoal are provided
  if (this.fundraisingGoal.amount > 0) {
    this.progress = Math.min(
      Math.round((this.collectedAmount.amount / this.fundraisingGoal.amount) * 100),
      100
    );
  }
  
  next();
});

module.exports = mongoose.model('Project', ProjectSchema); 