const express = require('express');
const app = express();
const cors = require('cors');
const dotenv = require('dotenv');
const { startWebSocketServer } = require('./gameLogic/game');
const deleteGames = require('./gameLogic/deleteGames');

dotenv.config();
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const connectDB = require('./config/db');
connectDB();

app.use('/user', require('./routes/auth'));
app.use('/history', require('./routes/history'));
app.use('/profile', require('./routes/profile'));
startWebSocketServer();

setInterval(deleteGames, 30 * 1000);
console.log('Game cleanup service started, running every 30 seconds...');
// The setInterval function is used to call the deleteExpiredGames function every minute. The function fetches all games that are in progress and have been created more than 5 minutes ago. If any such games are found, they are deleted from the database.

const port = 3000;
app.listen(port, () => console.log('App listening on port', port));
