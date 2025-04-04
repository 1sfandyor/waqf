const mongoose = require('mongoose');
const { Schema } = mongoose;

const SliderSchema = new Schema({
  title: {
    type: String,
    required: false
  },
  titleImage: {
    type: String,
    required: false
  },
  description: {
    type: String
  },
  buttonText: {
    type: String,
    default: 'Daha'
  },
  buttonLink: {
    type: String,
    default: '#'
  },
  image: {
    type: String,
    required: [true, 'Slayder rasmi kiritilishi shart']
  },
  active: {
    type: Boolean,
    default: true
  },
  order: {
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
  }
});

SliderSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Slider', SliderSchema); 