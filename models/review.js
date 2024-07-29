const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  reviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reviewee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: false // Optional reference to the service being reviewed
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5 // Assuming a 1 to 5 rating scale
  },
  comment: {
    type: String,
    required: true
  },
  response: {
    text: String,
    respondedAt: Date
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

// Pre-save middleware to handle the updated at field
reviewSchema.pre('save', function (next) {
  if (this.isModified()) {
    this.updatedAt = Date.now();
  }
  next();
});

// Custom toJSON transformation that removes internal fields and streamlines the output
reviewSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
    // Optionally remove other internal fields if necessary
  }
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
