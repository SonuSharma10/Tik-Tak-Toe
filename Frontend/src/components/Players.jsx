import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

// Helper function to convert row-based board to flat array
const convertBoardToArray = (finalBoard) => {
  if (!finalBoard || !finalBoard.row1) return Array(9).fill('');
  return [...finalBoard.row1, ...finalBoard.row2, ...finalBoard.row3];
};

const GameBoard = ({ moves, currentMove }) => {
  // Initialize empty board
  const board = Array(9).fill('');

  // Apply moves up to currentMove
  for (let i = 0; i <= currentMove; i++) {
    const move = moves[i];
    if (move) {
      board[move.position] = move.symbol;
    }
  }

  return (
    <div className="grid grid-cols-3 gap-1 w-full max-w-[300px] mx-auto">
      {board.map((cell, index) => (
        <div
          key={index}
          className="aspect-square flex items-center justify-center 
                     border-2 border-gray-300 bg-white text-2xl font-bold"
        >
          {cell}
        </div>
      ))}
    </div>
  );
};

const Players = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userGames, setUserGames] = useState([]);
  const [expandedGame, setExpandedGame] = useState(null);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
  const { user } = useAuth();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:3000/history/active-users', {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchUserGames = async (username) => {
    try {
      const response = await fetch(`http://localhost:3000/history/user/${username}`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      const data = await response.json();
      setUserGames(data);
      setSelectedUser(username);
      setExpandedGame(null);
      setCurrentMoveIndex(-1);
    } catch (error) {
      console.error('Error fetching user games:', error);
    }
  };

  const toggleGameExpansion = (gameId) => {
    if (expandedGame === gameId) {
      setExpandedGame(null);
      setCurrentMoveIndex(-1);
    } else {
      setExpandedGame(gameId);
      setCurrentMoveIndex(-1);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Players</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Player List */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Player List</h2>
          <div className="space-y-2">
            {users.map((user) => (
              <button
                key={user.username}
                onClick={() => fetchUserGames(user.username)}
                className={`w-full text-left p-3 rounded transition-colors
                  ${
                    selectedUser === user.username
                      ? 'bg-blue-100 text-blue-800'
                      : 'hover:bg-gray-100'
                  }`}
              >
                {user.username}
              </button>
            ))}
          </div>
        </div>

        {/* Game History */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Game History</h2>

            {selectedUser ? (
              <div className="space-y-4">
                {userGames.map((game) => (
                  <div
                    key={game.id}
                    className={`border rounded-lg p-4 transition-all cursor-pointer
                      ${expandedGame === game.id ? 'shadow-lg bg-gray-50' : 'hover:shadow-md'}`}
                    onClick={() => toggleGameExpansion(game.id)}
                  >
                    {/* Game Header */}
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-sm text-gray-600">
                        {new Date(game.date).toLocaleDateString()} - Room: {game.roomCode}
                      </div>
                      <div
                        className={`px-3 py-1 rounded text-sm
                        ${
                          game.winner === 'Draw'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {game.winner === 'Draw' ? 'Draw' : `Winner: ${game.winner}`}
                      </div>
                    </div>

                    {/* Players Info */}
                    <div className="mt-2">
                      <div className="text-sm font-medium">
                        {game.players.map((player, index) => (
                          <span key={player.username}>
                            {index > 0 && ' vs '}
                            {player.username} ({player.symbol})
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Expanded View */}
                    {expandedGame === game.id && (
                      <div className="mt-4 transition-all">
                        <h3 className="text-lg font-medium mb-3">Game Replay</h3>
                        <GameBoard moves={game.moves} currentMove={currentMoveIndex} />

                        {/* Move Controls */}
                        <div className="mt-4 flex justify-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentMoveIndex(-1);
                            }}
                            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                          >
                            Start
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentMoveIndex((prev) => Math.max(-1, prev - 1));
                            }}
                            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                          >
                            Previous
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentMoveIndex((prev) =>
                                Math.min(game.moves.length - 1, prev + 1)
                              );
                            }}
                            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                          >
                            Next
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentMoveIndex(game.moves.length - 1);
                            }}
                            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                          >
                            End
                          </button>
                        </div>

                        {/* Moves List */}
                        <div className="mt-4">
                          <h3 className="text-lg font-medium mb-2">Moves</h3>
                          <div className="space-y-1">
                            {game.moves.map((move, index) => (
                              <div
                                key={index}
                                className={`text-sm p-1 rounded
                                  ${currentMoveIndex === index ? 'bg-blue-100' : ''}`}
                              >
                                {index + 1}. {move.player} placed {move.symbol} at position{' '}
                                {move.position}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500 text-center py-8">
                Select a player to view their game history
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Players;
