const express = require('express');
const app = express();
const cors = require('cors');
const dotenv = require('dotenv');
const { startWebSocketServer } = require('./gameLogic/game');
dotenv.config();
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const connectDB = require('./config/db');
connectDB();

app.use('/user', require('./routes/login'));
app.use('/user', require('./routes/register'));
startWebSocketServer();

const port = 3000;
app.listen(port, () => console.log('App listening on port', port));
