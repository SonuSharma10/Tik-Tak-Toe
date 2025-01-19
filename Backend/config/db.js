const mongoose = require('mongoose');

async function dbConnect() {
  try {
    await mongoose.connect(process.env.MONGO_DB);
    console.log('Connected to TestData database');
  } catch (err) {
    console.log('Error connecting to the database:', err);
  }
}

module.exports = dbConnect;
