// here I am deleting those game which are in-progress and not completed for more then 2 mins.

const { Game, User } = require('../config/schema');
const mongoose = require('mongoose');

const deleteGames = async () => {
  console.log('Interval function called');
  try {
    const games = await Game.find({
      status: 'in_progress',
      createdAt: { $lt: new Date(Date.now() - 5 * 60 * 1000) },
    });

    if (games.length > 0) {
      console.log('Deleting games:', games);
      await Game.deleteMany({ _id: { $in: games.map((game) => game._id) } });
    }
  } catch (error) {
    console.error('Error deleting games:', error);
  }
};

module.exports = deleteGames;
// setInterval(deleteGames, 30 * 1000);

// console.log('Game cleanup service started, running every 1 minute...');
// // The setInterval function is used to call the deleteExpiredGames function every minute. The function fetches all games that are in progress and have been created more than 2 minutes ago. If any such games are found, they are deleted from the database.
