const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

app.use(cors());
app.use(express.json());

// Set socket.io instance to app
app.set('io', io);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ayccup', {
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/matches', require('./routes/matches'));
app.use('/api/teams', require('./routes/teams'));
app.use('/api/rounds', require('./routes/rounds'));

// Fallback routes in case reverse proxy (e.g. Nginx) strips the /api prefix
app.use('/auth', require('./routes/auth'));
app.use('/matches', require('./routes/matches'));
app.use('/teams', require('./routes/teams'));
app.use('/rounds', require('./routes/rounds'));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
