const express = require('express');
const Order = require('../models/order');
const { tokenExtractor, userExtractor } = require('../utils/middleware');

const orderRouter = express.Router();

orderRouter.use(tokenExtractor);
orderRouter.use(userExtractor);

orderRouter.post('/', async (request, response) => {
    if (!request.user) {
        return response.status(401).json({ error: 'Authentication required' });
    }

    const { serviceProviderId, serviceId, price, quantity, paymentMethod } = request.body;

    if (!serviceProviderId || !serviceId || !price || !quantity || !paymentMethod) {
        return response.status(400).json({ error: 'Missing required fields' });
    }

    const order = new Order({
        buyer: request.user._id, // Automatically set from the authenticated user
        serviceProvider: serviceProviderId,
        service: serviceId,
        price,
        quantity,
        status: 'pending', // Default status
        paymentMethod,
        paymentStatus: 'pending', // Default payment status
    });

    const savedOrder = await order.save();
    response.status(201).json(savedOrder);
});

// GET endpoint to retrieve all orders with token authentication
orderRouter.get('/', async (request, response) => {
    if (!request.user) {
        return response.status(401).json({ error: 'Authentication required' });
    }

    const orders = await Order.find({})
        .populate('buyer serviceProvider service')
        .exec();
    response.json(orders);
});

// GET endpoint to retrieve a specific order by ID with token authentication
orderRouter.get('/:id', async (request, response) => {
    if (!request.user) {
        return response.status(401).json({ error: 'Authentication required' });
    }

    const order = await Order.findById(request.params.id)
        .populate('buyer serviceProvider service')
        .exec();
    if (!order) {
        return response.status(404).json({ error: 'Order not found' });
    }
    response.json(order);
});

// PUT endpoint to update an order by ID
orderRouter.put('/:id', async (request, response) => {
    if (!request.user) {
        return response.status(401).json({ error: 'Authentication required' });
    }

    const order = await Order.findById(request.params.id);
    if (!order) {
        return response.status(404).json({ error: 'Order not found' });
    }

    if (request.user._id.toString() !== order.buyer.toString() && request.user._id.toString() !== order.serviceProvider.toString()) {
        return response.status(403).json({ error: 'Unauthorized: Only the buyer or service provider can update this order' });
    }

    // Update status if user is the buyer or service provider
    if (request.body.status && (request.user._id.toString() === order.buyer.toString() || request.user._id.toString() === order.serviceProvider.toString())) {
        order.status = request.body.status;
    }

    // Update payment method if user is the buyer
    if (request.body.paymentMethod && request.user._id.toString() === order.buyer.toString()) {
        order.paymentMethod = request.body.paymentMethod;
    }

    const updatedOrder = await order.save();
    response.json(updatedOrder);
});

// DELETE endpoint to delete an order by ID
orderRouter.delete('/:id', async (request, response) => {
    if (!request.user) {
        return response.status(401).json({ error: 'Authentication required' });
    }

    const order = await Order.findById(request.params.id);
    if (!order) {
        return response.status(404).json({ error: 'Order not found' });
    }

    // Check if the current user is the buyer of the order
    if (order.buyer.toString() !== request.user._id.toString()) {
        return response.status(403).json({ error: 'Unauthorized: Only the buyer can delete this order' });
    }

    await Order.findByIdAndDelete(request.params.id);
    response.status(204).json({ message: 'Order deleted successfully' });
});

module.exports = orderRouter;
