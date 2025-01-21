import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const [currentUsername, setCurrentUsername] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    const fetchUsername = async () => {
      try {
        const response = await fetch('http://localhost:3000/profile/my-profile', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user.token}`,
          },
        });

        const data = await response.json();

        if (response.ok) {
          setCurrentUsername(data.username);
        } else {
          setError(data.message);
        }
      } catch (error) {
        setError('Error fetching profile');
      }
    };

    if (user?.token) {
      fetchUsername();
    }
  }, [user?.token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      const response = await fetch('http://localhost:3000/profile/update-username', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ newUsername }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        setCurrentUsername(newUsername);
        setNewUsername('');
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError('Error updating username');
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-6">Edit Profile</h2>

        {message && <div className="mb-4 p-2 bg-green-100 text-green-700 rounded">{message}</div>}
        {error && <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Current Username</label>
            <input
              type="text"
              value={currentUsername}
              className="w-full p-2 border rounded bg-gray-100"
              disabled
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 mb-2">New Username</label>
            <input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              className="w-full p-2 border rounded"
              required
              placeholder="Enter new username"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          >
            Update Username
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
