import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const GameHistory = () => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchGameHistory();
  }, []);

  const fetchGameHistory = async () => {
    try {
      const response = await fetch('http://localhost:3000/history/my-history', {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      const data = await response.json();
      console.log(data);
      setGames(data);
    } catch (error) {
      console.error('Error fetching game history:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Game History</h2>
      {loading ? (
        <p>Loading history...</p>
      ) : (
        <div className="space-y-4">
          {games.map((game) => (
            <div key={game.id} className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-center mb-2">
                <div className="text-gray-600">{new Date(game.date).toLocaleDateString()}</div>
                <div className="font-medium">
                  {game.winner === 'Draw'
                    ? 'Draw'
                    : `Winner: ${game.winner}
                      `}
                </div>
              </div>
              <div className="text-sm text-gray-500">
                {game.players.map((player) => player.username).join(' vs ')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GameHistory;
