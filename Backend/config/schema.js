const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
});

const moveSchema = new mongoose.Schema({
  player: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  position: {
    type: Number,
    required: true,
    min: 0,
    max: 8,
  },
  symbol: {
    type: String,
    enum: ['X', 'O'],
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const gameSchema = new mongoose.Schema({
  roomCode: {
    type: String,
    required: true,
    unique: true,
  },
  status: {
    type: String,
    enum: ['waiting', 'in_progress', 'completed'],
    default: 'waiting',
  },
  players: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      username: {
        type: String,
        required: true,
      },
      symbol: {
        type: String,
        enum: ['X', 'O'],
        required: true,
      },
    },
  ],
  moves: [moveSchema],
  currentPlayer: {
    type: Number,
    default: 0,
  },
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  finalBoard: {
    row1: {
      type: [String],
      default: [' ', ' ', ' '],
    },
    row2: {
      type: [String],
      default: [' ', ' ', ' '],
    },
    row3: {
      type: [String],
      default: [' ', ' ', ' '],
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  completedAt: {
    type: Date,
  },
});

const User = mongoose.model('User', userSchema);
const Game = mongoose.model('Game', gameSchema);

module.exports = {
  User,
  Game,
};
