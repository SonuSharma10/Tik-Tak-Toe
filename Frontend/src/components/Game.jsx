import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Game = () => {
  const [board, setBoard] = useState(Array(9).fill(''));
  const [gameState, setGameState] = useState({
    status: 'connecting',
    message: 'Connecting to game...',
    roomCode: null,
    symbol: null,
    players: [],
  });
  const [timer, setTimer] = useState(300);
  const [scores, setScores] = useState({ player1: 0, player2: 0 });
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ws, setWs] = useState(null);

  // Timer effect remains the same...
  useEffect(() => {
    let interval;
    if (gameState.status === 'playing' && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      handleTimeUp();
    }
    return () => clearInterval(interval);
  }, [gameState.status, timer]);

  const handleTimeUp = () => {
    if (ws) {
      ws.send(
        JSON.stringify({
          type: 'message',
          data: "Time's up! Game ended in a draw.",
        })
      );
    }
    setGameState((prev) => ({ ...prev, status: 'completed' }));
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // WebSocket connection setup remains the same...
  useEffect(() => {
    const socket = new WebSocket('ws://localhost:8080');

    socket.onopen = () => {
      socket.send(
        JSON.stringify({
          type: 'connect',
          userId: user.userId,
        })
      );
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleGameMessage(data);
    };

    setWs(socket);

    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, [user.userId]);

  const handleGameMessage = (data) => {
    switch (data.type) {
      case 'start':
        setGameState({
          status: 'playing',
          message: data.message,
          roomCode: data.roomCode,
          symbol: data.players.find((p) => p.username === user.username)?.symbol,
          players: data.players,
        });
        setBoard(Array(9).fill(''));
        setTimer(300);
        // Initialize scores only when starting a new game session
        if (!gameState.roomCode) {
          setScores({ player1: 0, player2: 0 });
        }
        break;
      case 'move':
        updateBoard(data);
        break;
      case 'message':
        if (data.data.includes('wins')) {
          setGameState((prev) => ({ ...prev, status: 'completed' }));
          updateScores(data.data);
        }
        setGameState((prev) => ({ ...prev, message: data.data }));
        break;
      case 'reset':
        const player1Name = data.user1;
        const player2Name = data.user2;
        // console.log('player1Name:', player1Name);
        // console.log('player2Name:', player2Name);
        setGameState((prev) => ({
          ...prev,
          status: 'playing',
          message: `Game Reset!\nNew match started between ${player1Name} and ${player2Name}`,
          roomCode: data.roomCode,
        }));
        setBoard(Array(9).fill(''));
        setTimer(300);
        break;
      case 'error':
        setGameState((prev) => ({ ...prev, message: data.message }));
        break;
    }
  };

  const updateScores = (message) => {
    if (message.includes(user.username)) {
      const currentStreak = parseInt(localStorage.getItem(`winStreak_${user.userId}`)) || 0;
      const newStreak = currentStreak + 1;
      localStorage.setItem(`winStreak_${user.userId}`, newStreak.toString());

      setScores((prev) => ({
        ...prev,
        [gameState.symbol === 'X' ? 'player1' : 'player2']:
          prev[gameState.symbol === 'X' ? 'player1' : 'player2'] + 1,
      }));
    }
  };

  const handleReset = () => {
    if (ws && gameState.status === 'completed') {
      ws.send(JSON.stringify({ type: 'reset' }));
    }
  };

  // Other functions remain the same...
  const updateBoard = (data) => {
    setBoard((prev) => {
      const newBoard = [...prev];
      newBoard[data.index] = data.symbol;
      return newBoard;
    });
  };

  const handleCellClick = (index) => {
    if (board[index] === '' && gameState.status === 'playing') {
      ws.send(
        JSON.stringify({
          type: 'move',
          index: index,
        })
      );
    }
  };

  const handleExit = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Tic Tac Toe</h1>
            <button
              onClick={handleExit}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Exit
            </button>
          </div>

          {gameState.status === 'playing' && (
            <div className="text-center mb-4">
              <div className="text-2xl font-bold mb-2">{formatTime(timer)}</div>
              <div className="text-lg">
                Score: {scores.player1} - {scores.player2}
              </div>
            </div>
          )}

          <div className="text-center mb-4">
            <p className="text-lg whitespace-pre-line">{gameState.message}</p>
          </div>

          <div className="aspect-square mb-4">
            <div className="grid grid-cols-3 gap-1 h-full">
              {board.map((cell, index) => (
                <button
                  key={index}
                  onClick={() => handleCellClick(index)}
                  className="aspect-square bg-gray-50 border-2 border-gray-200 rounded flex items-center justify-center text-4xl font-bold hover:bg-gray-100"
                >
                  {cell}
                </button>
              ))}
            </div>
          </div>

          {gameState.status === 'completed' && (
            <div className="text-center">
              <button
                onClick={handleReset}
                className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600"
              >
                Reset Game
              </button>
            </div>
          )}

          {gameState.roomCode && (
            <div className="text-center mt-4">
              <p className="text-gray-600">Room Code: {gameState.roomCode}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Game;
