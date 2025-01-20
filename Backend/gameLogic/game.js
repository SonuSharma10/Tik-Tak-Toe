const WebSocket = require('ws');
const { Game, User } = require('../config/schema');
const mongoose = require('mongoose');

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8);
}

function startWebSocketServer() {
  const wss = new WebSocket.Server({ port: 8080 });

  wss.on('connection', async (ws) => {
    ws.on('message', async (messageData) => {
      try {
        const data = JSON.parse(messageData.toString());
        const timestamp = new Date();

        switch (data.type) {
          case 'connect':
            await handleConnect(ws, data, wss);
            break;
          case 'move':
            await handleMove(ws, data, timestamp, wss);
            break;
          case 'reset':
            await handleReset(ws, wss);
            break;
          case 'exit':
            await handleExit(ws, wss);
            break;
          default:
            ws.send(
              JSON.stringify({
                type: 'error',
                message: 'Invalid message type',
              })
            );
        }
      } catch (error) {
        console.error('Message handling error:', error);
        ws.send(
          JSON.stringify({
            type: 'error',
            message: 'Error processing message',
            errorDetails: error.toString(),
          })
        );
      }
    });

    ws.on('close', async () => {
      await handleDisconnect(ws, wss);
    });
  });

  async function handleConnect(ws, data, wss) {
    try {
      const userId = new mongoose.Types.ObjectId(data.userId);
      const user = await User.findOne({ _id: userId });
      if (!user) {
        ws.send(
          JSON.stringify({
            type: 'error',
            message: 'User not found',
          })
        );
        return;
      }

      const availableRoom = await Game.findOne({
        status: 'waiting',
      });

      if (availableRoom) {
        // Join existing room
        availableRoom.players.push({
          userId: user._id,
          username: user.username,
          symbol: 'O', // Second player gets O
        });
        availableRoom.status = 'in_progress';
        await availableRoom.save();

        ws.roomCode = availableRoom.roomCode;
        ws.userId = user._id.toString();
        ws.username = user.username;
        ws.symbol = 'O';

        const playerWs = Array.from(wss.clients).filter((client) =>
          availableRoom.players.some((p) => p.userId.toString() === client.userId)
        );

        playerWs.forEach((client, index) => {
          client.send(
            JSON.stringify({
              type: 'start',
              player: index + 1,
              roomCode: availableRoom.roomCode,
              players: availableRoom.players.map((p) => ({
                username: p.username,
                symbol: p.symbol,
              })),
              message: `Game starts with ${availableRoom.players
                .map((p) => p.username)
                .join(' vs ')}`,
            })
          );
        });
      } else {
        // Create new room
        const roomCode = generateRoomCode();
        const newGame = new Game({
          roomCode: roomCode,
          status: 'waiting',
          players: [
            {
              userId: user._id,
              username: user.username,
              symbol: 'X', // First player gets X
            },
          ],
          moves: [],
          currentPlayer: 0,
          winner: null,
          finalBoard: {
            row1: [' ', ' ', ' '],
            row2: [' ', ' ', ' '],
            row3: [' ', ' ', ' '],
          },
        });
        await newGame.save();

        ws.roomCode = roomCode;
        ws.userId = user._id.toString();
        ws.username = user.username;
        ws.symbol = 'X';

        ws.send(
          JSON.stringify({
            type: 'message',
            message: 'Room created. Waiting for another player...',
            roomCode: roomCode,
          })
        );
      }
    } catch (error) {
      console.error('Room creation error:', error);
      ws.send(
        JSON.stringify({
          type: 'error',
          message: 'Failed to create/join room',
          errorDetails: error.toString(),
        })
      );
    }
  }

  async function handleMove(ws, data, timestamp, wss) {
    try {
      const room = await Game.findOne({ roomCode: ws.roomCode });
      if (!room || room.status !== 'in_progress') {
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid game state' }));
        return;
      }

      const currentPlayerIndex = room.players.findIndex(
        (player) => player.userId.toString() === ws.userId
      );

      if (currentPlayerIndex === room.currentPlayer) {
        // Calculate current board state from moves
        const board = calculateBoardState(room.moves);

        if (board[data.index] === ' ') {
          // Record the move
          const newMove = {
            player: ws.userId,
            position: data.index,
            symbol: ws.symbol,
            timestamp: timestamp,
          };

          room.moves.push(newMove);

          // Update board state
          const updatedBoard = calculateBoardState(room.moves);
          const formattedBoard = formatBoard(updatedBoard);

          // Broadcast move to players
          const playerWs = Array.from(wss.clients).filter(
            (client) => client.roomCode === ws.roomCode
          );

          playerWs.forEach((client) => {
            client.send(
              JSON.stringify({
                type: 'move',
                index: data.index,
                player: currentPlayerIndex + 1,
                username: ws.username,
                symbol: ws.symbol,
                ...formattedBoard,
                timestamp: timestamp,
                roomCode: ws.roomCode,
              })
            );
          });

          if (checkWin(updatedBoard)) {
            room.status = 'completed';
            room.winner = ws.userId;
            room.finalBoard = {
              row1: updatedBoard.slice(0, 3),
              row2: updatedBoard.slice(3, 6),
              row3: updatedBoard.slice(6, 9),
            };
            room.completedAt = new Date();
            await room.save();

            playerWs.forEach((client) => {
              client.send(
                JSON.stringify({
                  type: 'message',
                  data: `Player ${ws.username} wins!`,
                })
              );
            });
          } else if (updatedBoard.every((cell) => cell !== ' ')) {
            room.status = 'completed';
            room.finalBoard = {
              row1: updatedBoard.slice(0, 3),
              row2: updatedBoard.slice(3, 6),
              row3: updatedBoard.slice(6, 9),
            };
            room.completedAt = new Date();
            await room.save();

            playerWs.forEach((client) => {
              client.send(
                JSON.stringify({
                  type: 'message',
                  data: 'Draw!',
                })
              );
            });
          } else {
            room.currentPlayer = 1 - room.currentPlayer;
            await room.save();
          }
        }
      }
    } catch (error) {
      console.error('Move handling error:', error);
    }
  }

  async function handleReset(ws, wss) {
    try {
      const oldRoom = await Game.findOne({ roomCode: ws.roomCode });
      if (!oldRoom) {
        ws.send(JSON.stringify({ type: 'error', message: 'Room does not exist' }));
        return;
      }

      // Create new game with same players
      const roomCode = generateRoomCode();
      const newGame = new Game({
        roomCode: roomCode,
        status: 'in_progress',
        players: oldRoom.players,
        moves: [],
        currentPlayer: 0,
        winner: null,
        finalBoard: {
          row1: [' ', ' ', ' '],
          row2: [' ', ' ', ' '],
          row3: [' ', ' ', ' '],
        },
      });
      await newGame.save();

      const playerWs = Array.from(wss.clients).filter((client) => client.roomCode === ws.roomCode);

      playerWs.forEach((client) => {
        client.roomCode = roomCode;
        client.send(
          JSON.stringify({
            type: 'reset',
            roomCode: roomCode,
          })
        );
      });
    } catch (error) {
      console.error('Reset error:', error);
    }
  }

  async function handleExit(ws, wss) {
    try {
      const room = await Game.findOne({ roomCode: ws.roomCode });
      if (!room) {
        ws.send(JSON.stringify({ type: 'error', message: 'Room does not exist' }));
        return;
      }

      if (room.status === 'in_progress') {
        room.status = 'completed';
        room.completedAt = new Date();
        await room.save();
      }

      const playerWs = Array.from(wss.clients).filter((client) => client.roomCode === ws.roomCode);

      playerWs.forEach((client) => {
        client.send(
          JSON.stringify({
            type: 'message',
            data: 'Game has ended.',
          })
        );
      });
    } catch (error) {
      console.error('Exit error:', error);
    }
  }

  async function handleDisconnect(ws, wss) {
    try {
      const room = await Game.findOne({ roomCode: ws.roomCode });
      if (room && room.status === 'in_progress') {
        room.status = 'completed';
        const remainingPlayer = room.players.find(
          (player) => player.userId.toString() !== ws.userId
        );
        if (remainingPlayer) {
          room.winner = remainingPlayer.userId;
        }
        room.completedAt = new Date();
        await room.save();

        const remainingPlayerWs = Array.from(wss.clients).find(
          (client) => client.userId === remainingPlayer?.userId.toString()
        );

        if (remainingPlayerWs) {
          remainingPlayerWs.send(
            JSON.stringify({
              type: 'message',
              data: 'The other player has disconnected. You win!',
            })
          );
        }
      }
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  }

  function calculateBoardState(moves) {
    const board = Array(9).fill(' ');
    moves.forEach((move) => {
      board[move.position] = move.symbol;
    });
    return board;
  }

  function formatBoard(board) {
    return {
      row1: `${board[0]} | ${board[1]} | ${board[2]}`,
      row2: `${board[3]} | ${board[4]} | ${board[5]}`,
      row3: `${board[6]} | ${board[7]} | ${board[8]}`,
    };
  }

  function checkWin(board) {
    const winPatterns = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8], // rows
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8], // columns
      [0, 4, 8],
      [2, 4, 6], // diagonals
    ];

    return winPatterns.some((pattern) => {
      const [a, b, c] = pattern;
      return board[a] !== ' ' && board[a] === board[b] && board[a] === board[c];
    });
  }

  console.log('WebSocket server started on ws://localhost:8080');
}

module.exports = { startWebSocketServer };
