const router = require('express').Router();
const { User, Game } = require('../config/schema');
const auth = require('../middleware/auth');

// Update username
router.put('/update-username', auth, async (req, res) => {
  try {
    const { newUsername } = req.body;
    // Check if username already exists
    // console.log('new username', newUsername); //Testing the new username recieving in the request
    const existingUser = await User.findOne({ username: newUsername });
    // console.log('existing user', existingUser); //Testing the existing user object in the database
    if (existingUser) {
      return res.status(400).json({ message: 'Username already taken' });
    }

    // Update username
    const oldUsername = req.user.username;
    // console.log('old Username', oldUsername); //Testing the old username recieving in the request
    // console.log('Auth User saved data', req.user); //Testing the user data saved in the request
    await User.findByIdAndUpdate(req.user.id, { username: newUsername });
    await Game.updateMany(
      { 'players.username': oldUsername },
      { $set: { 'players.$[elem].username': newUsername } },
      { arrayFilters: [{ 'elem.username': oldUsername }] }
    );
    res.json({ message: 'Username updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating username' });
  }
});

router.get('/my-profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({ username: user.username });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user profile' });
  }
});

module.exports = router;
