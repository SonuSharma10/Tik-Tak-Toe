const WebSocket = require('ws');

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8); // Generates a random 6-character string
}

function startWebSocketServer() {
  const wss = new WebSocket.Server({ port: 8080 });
  const rooms = {}; // To store all game rooms

  wss.on('connection', (ws) => {
    let roomCode;

    // Find or create a room for the player
    const availableRoom = Object.keys(rooms).find((code) => rooms[code].players.length < 2);

    if (availableRoom) {
      roomCode = availableRoom;
      const room = rooms[roomCode];
      room.players.push(ws);
      ws.roomCode = roomCode;
      ws.playerId = 2;

      // Notify both players that the game is starting
      room.players.forEach((player, index) => {
        player.send(
          JSON.stringify({
            type: 'start',
            player: index + 1,
            roomCode: roomCode,
            message: `Player ${index + 1} connected. Game starts!`,
          })
        );
      });
    } else {
      // Create a new room if none are available
      roomCode = generateRoomCode();
      rooms[roomCode] = {
        players: [ws],
        board: Array(9).fill(null),
        currentPlayer: 0,
      };

      ws.roomCode = roomCode;
      ws.playerId = 1;

      ws.send(
        JSON.stringify({
          type: 'message',
          message: 'Room created. Waiting for another player...',
          roomCode: roomCode,
        })
      );
    }

    ws.on('message', (message) => {
      const data = JSON.parse(message);
      const timestamp = new Date().toLocaleString(); // Includes both date and current time

      if (data.type === 'move') {
        handleMove(ws, data, timestamp);
      } else if (data.type === 'reset') {
        handleReset(ws);
      } else if (data.type === 'exit') {
        handleExit(ws);
      } else {
        ws.send(JSON.stringify({ type: 'error', data: 'Invalid message type' }));
      }
    });

    ws.on('close', () => {
      handleDisconnect(ws);
    });
  });

  function handleMove(ws, data, timestamp) {
    const room = rooms[ws.roomCode];
    if (!room) {
      ws.send(JSON.stringify({ type: 'error', data: 'Room does not exist' }));
      return;
    }

    if (room.players[room.currentPlayer] === ws) {
      if (room.board[data.index] === null) {
        room.board[data.index] = room.currentPlayer === 0 ? 'X' : 'O';

        room.players.forEach((player) => {
          player.send(
            JSON.stringify({
              type: 'move',
              index: data.index,
              player: room.currentPlayer + 1,
              row1: `${room.board[0] || ' '} | ${room.board[1] || ' '} | ${room.board[2] || ' '} `,
              row2: `${room.board[3] || ' '} | ${room.board[4] || ' '} | ${room.board[5] || ' '} `,
              row3: `${room.board[6] || ' '} | ${room.board[7] || ' '} | ${room.board[8] || ' '} `,
              timestamp: timestamp,
              roomCode: ws.roomCode,
            })
          );
        });

        if (checkWin(room.board)) {
          room.players.forEach((player) => {
            player.send(
              JSON.stringify({
                type: 'message',
                data: `Player ${room.currentPlayer + 1} wins!`,
              })
            );
          });
          resetGame(room);
        } else if (room.board.every((cell) => cell !== null)) {
          room.players.forEach((player) => {
            player.send(JSON.stringify({ type: 'message', data: 'Draw!' }));
          });
          resetGame(room);
        } else {
          room.currentPlayer = 1 - room.currentPlayer; // Switch turns
        }
      }
    }
  }

  function handleReset(ws) {
    const room = rooms[ws.roomCode];
    if (!room) {
      ws.send(JSON.stringify({ type: 'error', data: 'Room does not exist' }));
      return;
    }

    resetGame(room);
  }

  function handleExit(ws) {
    const room = rooms[ws.roomCode];
    if (!room) {
      ws.send(JSON.stringify({ type: 'error', data: 'Room does not exist' }));
      return;
    }

    room.players.forEach((player) => {
      player.send(JSON.stringify({ type: 'message', data: 'Game has ended.' }));
    });

    delete rooms[ws.roomCode]; // Remove the room
  }

  function handleDisconnect(ws) {
    if (ws.roomCode) {
      const room = rooms[ws.roomCode];
      if (room) {
        room.players = room.players.filter((player) => player !== ws);
        if (room.players.length === 1) {
          // Notify the remaining player that they have won
          room.players[0].send(
            JSON.stringify({
              type: 'message',
              data: 'The other player has disconnected. You win!',
            })
          );
          delete rooms[ws.roomCode]; // Remove the room
        } else if (room.players.length === 0) {
          delete rooms[ws.roomCode]; // Remove the room if empty
        }
      }
    }
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
      return board[a] !== null && board[a] === board[b] && board[a] === board[c];
    });
  }

  function resetGame(room) {
    room.board = Array(9).fill(null);
    room.currentPlayer = 0;

    room.players.forEach((player) => {
      player.send(JSON.stringify({ type: 'reset', roomCode: room.roomCode }));
    });
  }

  console.log('WebSocket server started on ws://localhost:8080');
}

module.exports = { startWebSocketServer };
