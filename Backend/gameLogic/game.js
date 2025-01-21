const WebSocket = require('ws');
const { Game, User } = require('../config/schema');
const mongoose = require('mongoose');

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 10);
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
            // ws connecting method {"type":"connect","userId":"678e5d5034b9824afdb95ef1"}
            break;
          case 'move':
            await handleMove(ws, data, timestamp, wss);
            // ws move method {"type":"move","index":0 to 9 any number}
            break;
          case 'reset':
            await handleReset(ws, wss);
            // ws reset method {"type":"reset"}
            break;
          default:
            ws.send(
              JSON.stringify({
                type: 'error',
                message:
                  'Invalid message type for connect = {"type":"connect", "userId":"678e5d5034b9824afdb95ef1"} \n move = {"type":"move","index":0 to 9 any number} \n reset = {"type":"reset"}',
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

      // Check if user is already in a game
      const existingGame = await Game.findOne({
        'players.userId': userId,
        status: { $in: ['waiting', 'in_progress'] },
      });

      if (existingGame) {
        ws.send(
          JSON.stringify({
            type: 'error',
            message: 'You are already in a game',
          })
        );
        return;
      }

      const availableRoom = await Game.findOne({
        status: 'waiting',
        'players.userId': { $ne: userId }, // Ensure user is not already in the room
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
          message: 'Failed to create room. May be there is some error in the server',
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
      // console.log('Room:', room);
      // console.log('Data:', data);
      // console.log('ws', ws);
      const currentPlayerIndex = room.players.findIndex(
        (player) => player.userId.toString() === ws.userId
      );

      if (currentPlayerIndex === room.currentPlayer) {
        // Calculate current board state from moves
        const board = calculateBoardState(room.moves);

        if (board[data.index] === ' ') {
          // Record the move
          // console.log('ws inside selected player', ws);
          const newMove = {
            player: ws.username,
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
            // console.log('Winning board:', ws);
            room.winner = ws.username;
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

  async function handleDisconnect(ws, wss) {
    try {
      // console.log('Disconnect handler started for user:', ws.username);
      const room = await Game.findOne({ roomCode: ws.roomCode });

      if (room) {
        // console.log('Found room:', room.roomCode);
        // console.log('Current room status:', room.status);
        // console.log('Current players:', room.players);

        if (room.status === 'completed') {
          // Find remaining player
          const remainingPlayer = room.players.find((player) => player.username !== ws.username);

          // console.log('Disconnecting player username:', ws.username);
          // console.log('Found remaining player:', remainingPlayer);

          if (remainingPlayer) {
            // console.log('Setting winner to:', remainingPlayer.username);
            // Explicitly set the winner
            room.winner = remainingPlayer.username;

            // Force mark as modified to ensure save
            room.markModified('winner');
          }

          room.completedAt = new Date();

          // Log room state before save
          // console.log('Room before save:', {
          //   status: room.status,
          //   winner: room.winner,
          //   completedAt: room.completedAt,
          // });

          // Save with error handling
          try {
            await room.save();
            // console.log('Room saved successfully');
            // console.log('Room after save:', await Game.findOne({ roomCode: ws.roomCode }));
          } catch (saveError) {
            console.error('Error saving room:', saveError);
          }
        }

        // Remove the disconnected player
        room.players = room.players.filter((player) => player.username !== ws.username);

        const remainingPlayerWs = Array.from(wss.clients).find(
          (client) => client.username === room.players[0]?.username
        );

        if (remainingPlayerWs) {
          // console.log('Sending win message to remaining player:', room.players[0]?.username);
          remainingPlayerWs.send(
            JSON.stringify({
              type: 'message',
              data: 'The other player has disconnected. You win!',
            })
          );

          // Allow the remaining player to join new games
          remainingPlayerWs.roomCode = null;
          remainingPlayerWs.userId = null;
          remainingPlayerWs.username = null;
          remainingPlayerWs.symbol = null;
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
    console.log('Board state:', board);
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
