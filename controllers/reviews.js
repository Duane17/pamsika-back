const express = require('express');
const Review = require('../models/review');
const { tokenExtractor, userExtractor } = require('../utils/middleware');

const reviewRouter = express.Router();

reviewRouter.use(tokenExtractor);
reviewRouter.use(userExtractor);

reviewRouter.post('/', async (request, response) => {
    if (!request.user) {
        return response.status(401).json({error: 'Authentication required'});
    }

    const { revieweeId, serviceId, rating, comment } = request.body;
    if (!revieweeId || !rating || !comment) {
        return response.status(400).json({error: 'Missing required fields'});
    }

    const review = new Review({
        reviewer: request.user._id,
        reviewee: revieweeId,
        service: serviceId, // Optional, can be undefined if not reviewing a specific service
        rating,
        comment
    });

    const savedReview = await review.save();
    response.status(201).json(savedReview);
});

// GET endpoint to retrieve all reviews
reviewRouter.get('/', async (request, response) => {
    if (!request.user) {
        return response.status(401).json({error: 'Authentication required'});
    }
    const reviews = await Review.find({}).populate('reviewer reviewee service');
    response.json(reviews);
});

// GET endpoint to retrieve a specific review by ID
reviewRouter.get('/:id', async (request, response) => {
    if (!request.user) {
        return response.status(401).json({error: 'Authentication required'});
    }
    const review = await Review.findById(request.params.id).populate('reviewer reviewee service');
    if (!review) {
        return response.status(404).json({ error: 'Review not found' });
    }
    response.json(review);
});

// PUT endpoint to update a review by ID
reviewRouter.put('/:id', async (request, response) => {
    if (!request.user) {
        return response.status(401).json({ error: 'Authentication required' });
    }

    const review = await Review.findById(request.params.id);
    if (!review) {
        return response.status(404).json({ error: 'Review not found' });
    }

    // Check if the current user is the reviewer
    if (review.reviewer.toString() !== request.user._id.toString()) {
        return response.status(403).json({ error: 'Unauthorized: You can only update your own reviews' });
    }

    const { rating, comment } = request.body;
    const update = {};
    if (rating) update.rating = rating;
    if (comment) update.comment = comment;

    const updatedReview = await Review.findByIdAndUpdate(request.params.id, update, { new: true });
    response.json(updatedReview);
});


// DELETE endpoint to delete a review by ID
reviewRouter.delete('/:id', async (request, response) => {
    if (!request.user) {
        return response.status(401).json({ error: 'Authentication required' });
    }

    const review = await Review.findById(request.params.id);
    if (!review) {
        return response.status(404).json({ error: 'Review not found' });
    }

    // Check if the current user is the reviewer
    if (review.reviewer.toString() !== request.user._id.toString()) {
        return response.status(403).json({ error: 'Unauthorized: You can only delete your own reviews' });
    }

    await Review.findByIdAndDelete(request.params.id);
    response.status(204).json({ message: 'Review deleted successfully' });
});


module.exports = reviewRouter;
