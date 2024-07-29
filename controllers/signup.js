const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user'); // Adjust the path according to your project structure
const { body, validationResult } = require('express-validator');

const signupRouter = express.Router();

// Validation rules as middleware
const userValidationRules = [
    body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters long'),
    body('email').isEmail().withMessage('Invalid email format'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('phoneNumber').isMobilePhone().withMessage('Invalid phone number'),
    body('firstName').not().isEmpty().withMessage('First name is required'),
    body('lastName').not().isEmpty().withMessage('Last name is required'),
];

// Signup endpoint
signupRouter.post('/', userValidationRules, async (request, response) => {
    const errors = validationResult(request);
    if (!errors.isEmpty()) {
        return response.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, phoneNumber, firstName, lastName } = request.body;

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
        return response.status(409).json({ message: 'Username or email already exists' });
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const user = new User({
        username,
        email,
        passwordHash,
        phoneNumber,
        firstName,
        lastName,
    });

    const savedUser = await user.save();
    response.status(201).json(savedUser)
});

module.exports = signupRouter;
