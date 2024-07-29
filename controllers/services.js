const express = require('express');
const Service = require('../models/service');
const { tokenExtractor, userExtractor } = require('../utils/middleware');
const upload = require('../utils/multer')

const servicesRouter = express.Router();

// Apply tokenExtractor and userExtractor middleware to all service routes
servicesRouter.use(tokenExtractor);
servicesRouter.use(userExtractor);

// POST endpoint to create a new service
servicesRouter.post('/', async (request, response) => {
    if (!request.user) {
        return response.status(401).json({error: 'invalid token or user not found'});
    }

    const { title, description, category, subcategory, price, currency, duration, portfolio } = request.body;

    const service = new Service({
        title,
        description,
        category,
        subcategory,
        price,
        currency,
        duration,
        serviceProvider: request.user.username,
        portfolio
    });

    const savedService = await service.save();
    response.status(201).json(savedService);
});

// GET endpoint to retrieve services with filtering (no pagination)
servicesRouter.get('/', async (request, response) => {
    if (!request.token) {
        return response.status(401).json({error: 'invalid token'});
    }

    const { category, minPrice, maxPrice, search } = request.query;

    // Build the filter object based on query parameters
    let filters = {};
    if (category) {
        filters.category = category;
    }
    if (minPrice && maxPrice) {
        filters.price = { $gte: Number(minPrice), $lte: Number(maxPrice) };
    } else if (minPrice) {
        filters.price = { $gte: Number(minPrice) };
    } else if (maxPrice) {
        filters.price = { $lte: Number(maxPrice) };
    }

    if (search) {
        filters.$or = [
            { title: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } }
        ];
    }

    // Fetch services based on filters
    const services = await Service.find(filters).exec();
    response.json(services);
});

// GET endpoint to retrieve a specific service by ID
servicesRouter.get('/:id', async (request, response) => {
    if (!request.token) {
        return response.status(401).json({error: 'invalid token'});
    }

    const service = await Service.findById(request.params.id);
    if (!service) {
        return response.status(404).json({ error: 'Service not found' });
    }
    response.json(service);
});

// DELETE endpoint to delete a service by ID
servicesRouter.delete('/:id', async (request, response) => {
    if (!request.user) {
        return response.status(401).json({ error: 'Authentication required' });
    }

    const service = await Service.findById(request.params.id);
    if (!service) {
        return response.status(404).json({ error: 'Service not found' });
    }

    // Check if the current user is the service provider
    if (service.serviceProvider.toString() !== request.user._id.toString()) {
        return response.status(403).json({ error: 'Unauthorized: Only the service provider can delete this service' });
    }

    await Service.findByIdAndDelete(request.params.id);
    response.status(204).json({ message: 'Service deleted successfully' });
});


// PUT endpoint to update service details and add new portfolio items
servicesRouter.put('/:id', async (request, response) => {
    if (!request.user) {
        return response.status(401).json({ error: 'Authentication required' });
    }

    const service = await Service.findById(request.params.id);
    if (!service) {
        return response.status(404).json({ error: 'Service not found' });
    }

    // Check if the current user is the service provider
    if (service.serviceProvider.toString() !== request.user._id.toString()) {
        return response.status(403).json({ error: 'Unauthorized: Only the service provider can update this service' });
    }

    const { newPortfolioItem, ...otherUpdates } = request.body;

    // Start with any field updates that aren't array-based
    const updateData = { ...otherUpdates };

    // Prepare update operations for arrays
    const arrayUpdates = {};
    if (newPortfolioItem) {
        arrayUpdates.$push = { portfolio: newPortfolioItem };
    }

    // Perform the standard field updates
    const updatedService = await Service.findByIdAndUpdate(request.params.id, updateData, { new: true, runValidators: true });

    // If there is an array update, perform this in a second operation
    if (updatedService && newPortfolioItem) {
        await Service.findByIdAndUpdate(request.params.id, arrayUpdates, { new: true });
    }

    if (!updatedService) {
        return response.status(404).json({ error: 'Service not found' });
    }

    response.json(updatedService);
});

// POST endpoint to upload a service picture
servicesRouter.post('/:id/picture', upload.single('image'), async (request, response) => {
  const service = await Service.findByIdAndUpdate(request.params.id, { picture: request.file.path }, { new: true });
  if (!service) {
    return response.status(404).json({ error: 'Service not found' });
  }
  response.status(201).json({ message: 'Picture added to service', service });
});

// PUT endpoint to update a service picture
servicesRouter.put('/:id/picture', upload.single('image'), async (request, response) => {
  const service = await Service.findByIdAndUpdate(request.params.id, { picture: request.file.path }, { new: true });
  if (!service) {
    return response.status(404).json({ error: 'Service not found' });
  }
  response.status(200).json({ message: 'Service picture updated', service });
});

module.exports = servicesRouter;
