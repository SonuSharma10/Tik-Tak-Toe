const { Game, User } = require('../config/schema');
const bcrypt = require('bcryptjs');
const router = require('express').Router();
const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.SECRET_KEY;

router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const hashPassword = await bcrypt.hash(password, 10);
  const user = await User.findOne({ username });
  if (user) {
    return res.status(400).send('User already exists');
  }

  const newUser = new User({ username, password: hashPassword });
  await newUser.save();
  const ID = newUser._id;
  const token = jwt.sign(
    {
      id: ID,
    },
    SECRET_KEY
  );
  res.status(201).json({ message: 'User registered successfully', token, ID });
});

module.exports = router;
