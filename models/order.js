const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const orderSchema = new Schema({
  buyer: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  serviceProvider: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  service: {
    type: Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1 // Ensure the quantity is at least 1
  },
  status: {
    type: String,
    enum: ['pending', 'in progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['credit card', 'PayPal', 'mobile money'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'approved', 'declined'],
    default: 'pending'
  },
  paymentTransactionId: String,
  startDate: Date,
  endDate: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  communication: [{
    message: String,
    date: { type: Date, default: Date.now },
    sender: { type: Schema.Types.ObjectId, ref: 'User' }
  }],
  attachments: [{
    filename: String,
    url: String,
    uploadedAt: { type: Date, default: Date.now }
  }]
});

// Pre-save middleware to handle the updated at field
orderSchema.pre('save', function (next) {
  if (this.isModified()) {
    this.updatedAt = Date.now();
  }
  next();
});

// Custom toJSON transformation that removes internal fields and streamlines the output
orderSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
    // Consider if you want to expose this in responses
    delete returnedObject.paymentTransactionId;
  }
});

const Order = model('Order', orderSchema);

module.exports = Order;

