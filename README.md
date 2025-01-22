# Tik-Tak-Toe Game

This is a full-stack implementation of the classic Tik-Tak-Toe game, featuring both frontend and backend components. The project allows users to register, log in, play games, and view their history.

# Tic Tac Toe Game

My assignment on Tic Tac Toe game given by LenDenClub.

## Features

- User authentication (register/login)
- Real-time multiplayer gameplay
- Game history tracking
- Profile management
- RESTful API backend

## Tech Stack

### Frontend
- React
- Tailwind CSS
- Vite

### Backend
- Node.js
- Express.js
- MongoDB
- JWT for authentication

<details>
<summary> 
    
## Directory Structure 
</summary>

```
sonusharma10-tik-tak-toe/
├── README.md
├── Backend/
│   ├── index.js
│   ├── package.json
│   ├── .env.example  --> Rename '.env.example' to '.env' and update the DatabaseName of mongodb.
│   ├── .gitignore
│   ├── config/
│   │   ├── db.js
│   │   └── schema.js
│   ├── gameLogic/
│   │   ├── deleteGames.js
│   │   └── game.js
│   ├── middleware/
│   │   └── auth.js
│   └── routes/
│       ├── api.js
│       ├── auth.js
│       ├── history.js
│       └── profile.js
└── Frontend/
    ├── README.md
    ├── eslint.config.js
    ├── index.html
    ├── package-lock.json
    ├── package.json
    ├── postcss.config.js
    ├── tailwind.config.js
    ├── vite.config.js
    ├── .gitignore
    ├── public/
    └── src/
        ├── App.css
        ├── App.jsx
        ├── index.css
        ├── main.jsx
        ├── assets/
        ├── components/
        │   ├── Dashboard.jsx
        │   ├── Game.jsx
        │   ├── GameHistory.jsx
        │   ├── Login.jsx
        │   ├── Navbar.jsx
        │   ├── Players.jsx
        │   ├── Profile.jsx
        │   └── Register.jsx
        └── context/
            └── AuthContext.jsx
```
</details>

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/SonuSharma10/Tik-Tak-Toe.git
   ```

2. Navigate to the backend and frontend directories and install dependencies:
   ```bash
   cd Backend
   npm install
   cd ../Frontend
   npm install
   ```
   
3. .env Update
   Before running the project, make sure to rename `.env.example` to `.env` and update the necessary environment variables.
   Example `.env` file:
   ```
    SECRET_KEY = 997766
    ROTATE = 10
    MONGO_DB = "mongodb://localhost:27017/{DB_NAME}"  # Replace {DB_NAME} with your database name
   ```
   Ensure that the `MONGO_DB` variable points to the correct MongoDB instance and database name.

4. Run the backend server:
   ```bash
   node index.js
   ```

5. Run the frontend:
   ```bash
   npm run dev
   ```



## API Calls and Examples

### 1) Register
**Method:** POST  
**API:** `http://localhost:3000/user/register`  
**Content Type:** `application/json`  
**Body:**  
```json
{
  "username": "SonuSharma",
  "password": "12345"
}
```
<details>
  <summary>Response Body</summary>

  ```json
  {
    "message": "User registered successfully",
    "token": "<JWT_TOKEN>",
    "ID": "6790bedec08f7de1bba9a1eb"
  }
  ```
</details>

---

### 2) Login
**Method:** POST  
**API:** `http://localhost:3000/user/login`  
**Content Type:** `application/json`  
**Body:**  
```json
{
  "username": "12345",  
  "password": "12345"
}
```
<details>
  <summary>Response Body</summary>

  ```json
  {
    "message": "Login successful",
    "token": "<JWT_TOKEN>",
    "ID": "678e75d118e995031c5e5294"
  }
  ```
</details>

---

### 3) All Login User Details
**Method:** GET  
**API:** `http://localhost:3000/history/active-users`  
<details>
  <summary>Response Body</summary>

  ```json
  [
    { "_id": "678e5a1b08857d3f924c7636", "username": "sonu" },
    { "_id": "678e75d118e995031c5e5294", "username": "12345" },
    { "_id": "6790bf84c08f7de1bba9a1f5", "username": "SonuSharma" }
  ]
  ```
</details>

---

### 4) Get All Games by Username
**Method:** GET  
**API:** `http://localhost:3000/history/user/:username`  

Example username: `12345`
<details>
  <summary>Response Body</summary>

  ```json
[
  {
    "id": "6790bba9b68b052e43aea8ca",
    "roomCode": "1x3phrm5",
    "players": [
      {
        "username": "12345",
        "symbol": "X"
      },
      {
        "username": "sonu",
        "symbol": "O"
      }
    ],
    "winner": "12345",
    "moves": [
      {
        "player": "12345",
        "position": 1,
        "symbol": "X",
        "timestamp": "2025-01-22T09:34:36.836Z"
      },
      {
        "player": "sonu",
        "position": 7,
        "symbol": "O",
        "timestamp": "2025-01-22T09:34:38.608Z"
      },
      {
        "player": "12345",
        "position": 4,
        "symbol": "X",
        "timestamp": "2025-01-22T09:34:40.029Z"
      },
      {
        "player": "sonu",
        "position": 6,
        "symbol": "O",
        "timestamp": "2025-01-22T09:34:42.141Z"
      },
      {
        "player": "12345",
        "position": 2,
        "symbol": "X",
        "timestamp": "2025-01-22T09:34:43.846Z"
      },
      {
        "player": "sonu",
        "position": 3,
        "symbol": "O",
        "timestamp": "2025-01-22T09:34:45.826Z"
      },
      {
        "player": "12345",
        "position": 8,
        "symbol": "X",
        "timestamp": "2025-01-22T09:34:48.410Z"
      },
      {
        "player": "sonu",
        "position": 0,
        "symbol": "O",
        "timestamp": "2025-01-22T09:34:49.999Z"
      }
    ],
    "finalBoard": {
      "row1": ["O","X","X"],
      "row2": ["O","X"," "],
      "row3": ["O","O","X"]
    },
    "date": "2025-01-22T09:34:52.628Z"
  }, ...] //All Games Details
  ```
</details>

---

### 5) Login Player's History
**Method:** GET  
**API:** `http://localhost:3000/history/my-history`  
**Authorization:** Bearer `JWT_TOKEN` required  
<details>
  <summary>Response Body</summary>
  
   ```json
[
  {
    "id": "6790bba9b68b052e43aea8ca",
    "roomCode": "1x3phrm5",
    "players": [
      {
        "username": "12345",
        "symbol": "X"
      },
      {
        "username": "sonu",
        "symbol": "O"
      }
    ],
    "winner": "12345",
    "moves": [
      {
        "player": "12345",
        "position": 1,
        "symbol": "X",
        "timestamp": "2025-01-22T09:34:36.836Z"
      },
      {
        "player": "sonu",
        "position": 7,
        "symbol": "O",
        "timestamp": "2025-01-22T09:34:38.608Z"
      },
      {
        "player": "12345",
        "position": 4,
        "symbol": "X",
        "timestamp": "2025-01-22T09:34:40.029Z"
      },
      {
        "player": "sonu",
        "position": 6,
        "symbol": "O",
        "timestamp": "2025-01-22T09:34:42.141Z"
      },
      {
        "player": "12345",
        "position": 2,
        "symbol": "X",
        "timestamp": "2025-01-22T09:34:43.846Z"
      },
      {
        "player": "sonu",
        "position": 3,
        "symbol": "O",
        "timestamp": "2025-01-22T09:34:45.826Z"
      },
      {
        "player": "12345",
        "position": 8,
        "symbol": "X",
        "timestamp": "2025-01-22T09:34:48.410Z"
      },
      {
        "player": "sonu",
        "position": 0,
        "symbol": "O",
        "timestamp": "2025-01-22T09:34:49.999Z"
      }
    ],
    "finalBoard": {
      "row1": ["O","X","X"],
      "row2": ["O","X"," "],
      "row3": ["O","O","X"]
    },
    "date": "2025-01-22T09:34:52.628Z"
  }, ...] //All Games Details
  ```
</details>

---

### 6) Update Username
**Method:** PUT  
**API:** `http://localhost:3000/profile/update-username`  
**Content Type:** `application/json`  
**Authorization:** Bearer `JWT_TOKEN` required  
**Body:**  
```json
{
  "newUsername": "SonuSh"
}
```
<details>
  <summary>Response Body</summary>

  ```json
  {
    "message": "Username updated successfully"
  }
  ```
</details>

## WebSocket Connection

1. WebSocket server is running on port `8080`.
2. Connect to WebSocket using the URL: `ws://localhost:8080`
3. To connect two users, they should send the following JSON messages:

   **Player 1:**
   ```json
   {
     "type": "connect",
     "userId": "6790bf84c08f7de1bba9a1f5"  //userId of Player
   }
   ```

   **Player 2:**
   ```json
   {
     "type": "connect",
     "userId": "678e5a1b08857d3f924c7636"   //userId of Player
   }
   ```

4. To start playing, players send their moves:

   **Player 1:**
   ```json
   {
     "type": "move",
     "index": "6"
   }
   ```

   **Player 2:**
   ```json
   {
     "type": "move",
     "index": "1"
   }
   ```

5. If a player disconnects, the other player wins.
6. To request a rematch or reset the game, any player can send:
   ```json
   {
     "type": "reset"
   }
   ```

7. If a game's status is "in-progress" for more than 5 minutes in the database, the game will be deleted automatically.


