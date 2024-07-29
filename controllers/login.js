const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/user');
const { body, validationResult } = require('express-validator');

const loginRouter = express.Router();

const validateLogin = [
    body('email').isEmail().withMessage('Please enter a valid email.'),
    body('password').notEmpty().withMessage('Password must not be empty.')
];

loginRouter.post('/', validateLogin, async (req, res) => {
   const { email, password } = req.body

   const user = await User.findOne({ email })
   const passwordCorrect = user === null
    ? false
    : await bcrypt.compare(password, user.passwordHash)

    if (!(user && passwordCorrect)) {
        return res.status(401).json({
            error: 'invalid username or password'
        })
    }

    const userForToken = {
        email: user.email,
        id: user._id
    }

    const token = jwt.sign(
        userForToken,
        process.env.SECRET
    )

    res
        .status(200)
        .send({token, email: user.email})

});

module.exports = loginRouter;
