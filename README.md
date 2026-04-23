# AYC CUP 2026 - Cricket Tournament Management & Live Scoring

A full-stack MERN web application for managing cricket tournaments and broadcasting live scores.

## Folder Structure

```
AYC CUP 2026/
├── backend/                  # Node.js + Express + MongoDB + Socket.IO server
│   ├── models/               # Mongoose schema definitions (Match.js)
│   ├── routes/               # API endpoints (auth.js, matches.js)
│   ├── middleware/           # Auth middleware for protected routes
│   ├── .env                  # Environment variables for backend
│   ├── server.js             # Entry point for backend server
│   └── package.json          # Backend dependencies
└── frontend/                 # React.js + Tailwind CSS + Vite frontend
    ├── src/
    │   ├── components/       # Reusable components (Navbar)
    │   ├── context/          # React Context (AuthContext)
    │   ├── pages/            # Application views (Home, AdminLogin, AdminDashboard, MatchesList, MatchDetails)
    │   ├── App.jsx           # Main routing component
    │   ├── main.jsx          # Entry point for React app
    │   └── index.css         # Main stylesheet with Tailwind CSS v4 directives
    ├── vite.config.js        # Vite & Tailwind configuration
    └── package.json          # Frontend dependencies
```

## Setup Instructions (Local Development)

### Prerequisites
- Node.js (v18+)
- MongoDB running locally (default: `mongodb://127.0.0.1:27017/ayccup2026`) or replace with MongoDB Atlas URI in backend `.env`.

### 1. Backend Setup

1. Open a terminal and navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create or update the `.env` file (already provided with defaults):
   ```env
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/ayccup2026
   JWT_SECRET=supersecretjwt2026
   ADMIN_EMAIL=admin@ayccup.com
   ADMIN_PASSWORD=adminpassword
   ```
4. Start the backend server:
   ```bash
   node server.js
   ```

### 2. Frontend Setup

1. Open a new terminal and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open the displayed local URL (typically `http://localhost:5173/`) in your browser.

## API Routes

### Authentication
- `POST /api/auth/login` - Authenticate admin & get token (checks against `.env`).
- `GET /api/auth/me` - Verify JWT token and get user role (Protected).

### Matches
- `GET /api/matches` - Get all matches (Public).
- `GET /api/matches/:id` - Get specific match details & scorecard (Public).
- `POST /api/matches` - Create a new match (Protected/Admin).
- `PUT /api/matches/:id/start` - Initialize playing XI, toss, and set match to "live" (Protected/Admin).
- `PUT /api/matches/:id/ball` - Add ball-by-ball score data (runs, extras, wickets) and emit live update (Protected/Admin).
