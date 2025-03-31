// Simple test server to debug issues
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import cors from 'cors';

console.log('Starting simplified server...');

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Express app
const app = express();

// Configure CORS
app.use(cors());

// Parse JSON requests
app.use(express.json());

// Basic health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Serve static files from client/src if in development
app.use(express.static(resolve(__dirname, 'client/src')));

// Catch-all route for SPA
app.get('*', (req, res) => {
  res.sendFile(resolve(__dirname, 'client/index.html'));
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Simple server running on http://localhost:${PORT}`);
});