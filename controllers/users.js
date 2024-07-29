const express = require('express');
const User = require('../models/user'); 
const { tokenExtractor } = require('../utils/middleware')
const upload = require('../utils/multer')

const usersRouter = express.Router();

// Applying tokenExtractor to all routes
usersRouter.use(tokenExtractor)

// Fetch all users with limited information
usersRouter.get('/', async (request, response) => {
    const users = await User.find({}).select('-passwordHash'); // Exclude password hashes from the output
    response.json(users);
});

// Fetch a single user by ID with detailed information
usersRouter.get('/:id', async (request, response) => {
    const user = await User.findById(request.params.id).select('-passwordHash')
      .populate('reviews', { rating: 1, comment: 1 }) // Assuming reviews are stored separately and reference User
      .populate('portfolio', { title: 1, description: 1, imageUrl: 1, link: 1 }) // Assuming portfolio items are referenced
      .populate('skills'); // This depends on how skills are structured

    if (!user) {
        return response.status(404).json({ error: 'User not found' });
    }
    response.json(user);
});

// Endpoint to upload a profile picture
usersRouter.post('/:id/profile-picture', upload.single('image'), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a file' });
    }
  
    const id = req.params.id;
    const filePath = req.file.path;
  
    const updatedUser = await User.findByIdAndUpdate(id, { profilePicture: filePath }, { new: true });
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'Profile picture updated', user: updatedUser });
  });
  
// PUT endpoint to update a user's profile picture
usersRouter.put('/:id/profile-picture', upload.single('image'), async (req, res) => {
    const updatedUser = await User.findByIdAndUpdate(req.params.id, { profilePicture: req.file.path }, { new: true });
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'Profile picture updated', user: updatedUser });
  });
  

// Update details
usersRouter.put('/:id', async (request, response) => {
    if (!request.token) {
        return response.status(401).json({error: 'invalid token'})
    }

    const { id } = request.params;
    const { newSkill, newPortfolioItem, ...otherUpdates } = request.body; // Destructure to separate array updates from other updates

    // Start with any field updates that aren't array-based
    const updateData = { ...otherUpdates };

    // Prepare update operations for arrays
    const arrayUpdates = {};
    if (newSkill) {
        arrayUpdates.$push = { skills: newSkill }; // Push new skill to the skills array
    }
    if (newPortfolioItem) {
        if (!arrayUpdates.$push) arrayUpdates.$push = {};
        arrayUpdates.$push.portfolio = newPortfolioItem; // Push new portfolio item
    }

    // Perform the standard field updates
    let updatedUser = await User.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

    // If there are array updates, perform these in a second operation
    if (updatedUser && (newSkill || newPortfolioItem)) {
        updatedUser = await User.findByIdAndUpdate(id, arrayUpdates, { new: true });
    }

    if (!updatedUser) {
        return response.status(404).json({ error: 'User not found' });
    }

    response.json(updatedUser);
});


module.exports = usersRouter;
