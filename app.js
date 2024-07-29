const express = require('express');
require('express-async-errors');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();

// Configuration and Logger
const config = require('./utils/config');
const logger = require('./utils/logger');

// Middleware
const middleware = require('./utils/middleware');

// Routers
const signupRouter = require('./controllers/signup');
const loginRouter = require('./controllers/login');
const servicesRouter = require('./controllers/services');
const ordersRouter = require('./controllers/orders');
const reviewsRouter = require('./controllers/reviews');
const usersRouter = require('./controllers/users');
const testingRouter = require('./controllers/testing'); // Conditional testing router

logger.info('connecting to', config.MONGODB_URI)
mongoose.connect(config.MONGODB_URI)
  .then(() => {
    logger.info('connected to MongoDB')
  })
  .catch((error) => {
    logger.error('error connecting to MongoDB:', error.message)
  })

app.use(cors());
app.use(express.json());
app.use(middleware.requestLogger);
app.use(middleware.tokenExtractor);

// Serve static files from 'dist' and 'uploads'
app.use(express.static('dist')); // Serves your frontend application after build
app.use('/uploads', express.static('uploads')); // Serves uploaded files


// API routes
app.use('/api/signup', signupRouter);
app.use('/api/login', loginRouter);
app.use('/api/services', servicesRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/users', usersRouter);

// Conditional route for testing (loaded only in 'test' environment)
if (process.env.NODE_ENV === 'test') {
    app.use('/api/testing', testingRouter);
}

app.use(middleware.unknownEndpoint);
app.use(middleware.errorHandler);

module.exports = app;
