import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const [roomCode, setRoomCode] = useState('');
  const [winStreak, setWinStreak] = useState(0);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    // Load win streak from localStorage
    const savedStreak = localStorage.getItem(`winStreak_${user.userId}`);
    if (savedStreak) {
      setWinStreak(parseInt(savedStreak));
    }
  }, [user.userId]);

  const handleCreateGame = () => {
    navigate('/game');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Game Dashboard</h1>
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Logout
            </button>
          </div>
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Your Stats</h2>
            <p className="text-lg">Current Win Streak: {winStreak}</p>
          </div>
          <div className="flex justify-center">
            <button
              onClick={handleCreateGame}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg text-lg font-semibold hover:bg-blue-600"
            >
              Create New Game
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
