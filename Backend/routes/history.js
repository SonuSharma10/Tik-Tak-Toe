const router = require('express').Router();
const { Game, User } = require('../config/schema');
const auth = require('../middleware/auth');

// Get logged-in user's game history
router.get('/my-history', auth, async (req, res) => {
  try {
    const games = await Game.find({
      'players.userId': req.user.id,
      status: 'completed',
    }).sort({ completedAt: -1 });
    console.log('games:', games); //Testing the game object

    const formattedGames = games.map((game) => ({
      id: game._id,
      roomCode: game.roomCode,
      players: game.players.map((player) => ({
        username: player.username,
        symbol: player.symbol,
      })),
      winner: game.winner ? game.winner : 'Draw',
      moves: game.moves.map((move) => ({
        player: move.player,
        position: move.position,
        symbol: move.symbol,
      })),
      finalBoard: game.finalBoard,
      date: game.completedAt,
    }));

    res.json(formattedGames);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching game history' });
  }
});

// Get specific user's game history by ID
router.get('/user/:username', auth, async (req, res) => {
  try {
    const games = await Game.find({
      'players.username': req.params.username,
      status: 'completed',
    }).sort({ completedAt: -1 });
    // .populate('players.userId', 'username');
    console.log('games:', games); //Testing the game object

    const formattedGames = games.map((game) => ({
      id: game._id,
      roomCode: game.roomCode,
      players: game.players.map((player) => ({
        username: player.username,
        symbol: player.symbol,
      })),
      winner: game.winner ? game.winner : 'Draw',
      moves: game.moves.map((move) => ({
        player: move.player,
        position: move.position,
        symbol: move.symbol,
      })),
      finalBoard: game.finalBoard,
      date: game.completedAt,
    }));

    res.json(formattedGames);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user game history' });
  }
});

// Get all active users
router.get('/active-users', auth, async (req, res) => {
  try {
    const users = await User.find({}, 'username');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users' });
  }
});

module.exports = router;
