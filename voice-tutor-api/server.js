const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = 3001;

// Enable CORS
app.use(cors({
  origin: ['http://localhost:3000'],
  methods: ['POST', 'OPTIONS'],
  credentials: true,
}));

app.use(express.json());

// Import API handlers
const transcribeHandler = require('./api/transcribe.ts');
const chatHandler = require('./api/chat.ts');

// API routes
app.post('/api/transcribe', (req, res) => transcribeHandler(req, res));
app.post('/api/chat', (req, res) => chatHandler(req, res));

app.listen(PORT, () => {
  console.log(`API server running at http://localhost:${PORT}`);
}); 