import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login, { existingUser } from './components/login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import Game from './components/Game';
import { AuthProvider } from './context/AuthContext';
import GameHistory from './components/GameHistory';
import Players from './components/Players';
import Profile from './components/Profile';
import Navbar from './components/Navbar';

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-100">
          <Navbar />
          <Routes>
            <Route path="/" element={existingUser() ? <Dashboard /> : <Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/game" element={<Game />} />
            <Route path="/history" element={<GameHistory />} />
            <Route path="/players" element={<Players />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
