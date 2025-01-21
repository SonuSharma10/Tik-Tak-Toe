const { User } = require('../config/schema');
const bcrypt = require('bcryptjs');
const router = require('express').Router();
const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.SECRET_KEY;

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) {
    return res.status(400).send('Invalid username or password');
  }
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).send('Invalid username or password');
  }
  const ID = user._id;
  const token = jwt.sign(
    {
      id: ID,
    },
    SECRET_KEY
  );
  res.status(200).send({ message: 'Login successful', token, ID });
});

router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (user) {
    return res.status(400).send('User already exists');
  }
  const hashPassword = await bcrypt.hash(password, 10);
  const newUser = new User({ username, password: hashPassword });
  await newUser.save();
  const ID = newUser._id;
  const token = jwt.sign(
    {
      id: ID,
    },
    SECRET_KEY
  );
  res.status(200).json({ message: 'User registered successfully', token, ID });
});

module.exports = router;
