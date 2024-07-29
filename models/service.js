const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const serviceSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  subcategory: { type: String },
  price: { type: Number, required: true },
  currency: { type: String, required: true },
  duration: { type: String},
  serviceProvider: {
    type: Schema.Types.String,
    ref: 'User',
    required: true
  },
  portfolio: [{
    title: { type: String, required: true },
    description: { type: String, required: true },
    imageUrl: { type: String, required: true },
    link: { type: String }
  }],
  picture: { type: String }, // Field to store the image path
  ratings: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  },
  reviews: [{
    reviewer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true },
    comment: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Indexes
serviceSchema.index({ category: 1, subcategory: 1 });
serviceSchema.index({ serviceProvider: 1 });

// Pre-save middleware to handle the updated at field
serviceSchema.pre('save', function (next) {
  if (this.isModified()) {
    this.updatedAt = Date.now();
  }
  next();
});

// Custom toJSON transformation that removes internal fields and streamlines the output
serviceSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  }
});

const Service = model('Service', serviceSchema);

module.exports = Service;
