// Simple in-memory server without MongoDB
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { createServer } from 'http';

console.log('Starting simplified in-memory server...');

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Express app
const app = express();
const server = createServer(app);

// Configure CORS
app.use(cors({
  origin: '*',
  credentials: true
}));

// Parse JSON requests
app.use(express.json());

// In-memory data storage
const users = [];
const records = [];
const accessGrants = [];

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

app.get('/api/users', (req, res) => {
  res.json(users);
});

app.post('/api/users', (req, res) => {
  const newUser = {
    id: Date.now().toString(),
    ...req.body,
    createdAt: new Date()
  };
  users.push(newUser);
  res.status(201).json(newUser);
});

app.get('/api/records', (req, res) => {
  res.json(records);
});

app.post('/api/records', (req, res) => {
  const newRecord = {
    id: Date.now().toString(),
    ...req.body,
    uploadedAt: new Date()
  };
  records.push(newRecord);
  res.status(201).json(newRecord);
});

// IPFS mock endpoint
app.post('/api/ipfs/upload', (req, res) => {
  const mockHash = `Qm${Math.random().toString(36).substring(2, 15)}`;
  res.json({ hash: mockHash });
});

// Setup Vite for development
async function setupViteMiddleware() {
  try {
    const { createServer } = await import('vite');
    
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
      root: resolve(__dirname, 'client')
    });
    
    app.use(vite.middlewares);
    console.log('Vite middleware configured');
  } catch (error) {
    console.error('Error setting up Vite:', error);
  }
}

// Start the server
async function startServer() {
  try {
    await setupViteMiddleware();
    
    // Catch-all route for SPA
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/')) {
        return next();
      }
      
      res.sendFile(resolve(__dirname, 'client/index.html'));
    });
    
    const PORT = process.env.PORT || 3000;
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`Simple in-memory server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
  }
}

startServer();