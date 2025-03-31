// Debug startup
console.log('Starting server initialization...');

import express from 'express';
import session from 'express-session';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import bcrypt from 'bcryptjs';
import MemoryStore from 'memorystore';

console.log('Imports completed, loading modules...');

import { connectToDatabase, closeConnection } from './mongodb.js';
import { storage } from './storage.js';
import { testIPFSConnection } from './ipfs.js';
import { registerRoutes, isAuthenticated } from './routes.js';
import { setupVite, log, serveStatic } from './vite.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MemoryStoreSession = MemoryStore(session);

/**
 * Start the server and set up routes
 */
async function startServer() {
  console.log('Starting server function...');
  
  try {
    // Initialize Express app
    const app = express();
    console.log('Express app created');
    
    const server = (await import('http')).createServer(app);
    console.log('HTTP server created');
    
    // Configure CORS
    app.use(cors({
      origin: process.env.NODE_ENV === 'production' 
        ? 'https://health-data-platform.replit.app'
        : ['http://localhost:3000', 'http://localhost:5173'],
      credentials: true
    }));
    console.log('CORS configured');
    
    // Parse JSON requests
    app.use(express.json());
    
    // Set up sessions
    app.use(session({
      secret: process.env.SESSION_SECRET || 'health-data-platform-secret',
      resave: false,
      saveUninitialized: false,
      cookie: { 
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      },
      store: new MemoryStoreSession({
        checkPeriod: 86400000 // Prune expired sessions every 24h
      })
    }));
    console.log('Sessions configured');
    
    // Configure Passport.js
    app.use(passport.initialize());
    app.use(passport.session());
    configurePassport();
    console.log('Passport configured');
    
    // Set up file upload middleware
    const upload = multer({ 
      storage: multer.memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
    });
    
    // Test database and IPFS connections
    console.log('Testing database connection...');
    try {
      await connectToDatabase();
      console.log('MongoDB connection successful');
      
      // Test IPFS connection
      console.log('Testing IPFS connection...');
      const ipfsStatus = await testIPFSConnection();
      console.log(`IPFS connection ${ipfsStatus ? 'successful' : 'failed'}`);
    } catch (error) {
      console.error(`Database connection error: ${error.message}`);
    }
    
    // Register API routes
    console.log('Registering API routes...');
    await registerRoutes(app, upload);
    console.log('API routes registered');
    
    // Serve static files in production
    if (process.env.NODE_ENV === 'production') {
      serveStatic(app);
      
      // Catch-all route for SPA
      app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname, '../dist/index.html'));
      });
    } else {
      // In development, set up Vite middleware
      console.log('Setting up Vite middleware...');
      await setupVite(app, server);
      console.log('Vite middleware setup complete');
    }
    
    // Error handling middleware
    app.use((err, req, res, next) => {
      console.error(err.stack);
      res.status(500).json({ error: 'Something went wrong!' });
    });
    
    // Start the server
    const PORT = process.env.PORT || 3000;
    console.log(`Starting server on port ${PORT}...`);
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    });
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('Shutting down server...');
      await closeConnection();
      process.exit(0);
    });
  } catch (error) {
    console.error('Critical error in server setup:', error);
    throw error;
  }
}

/**
 * Configure Passport.js authentication strategies
 */
function configurePassport() {
  // Serialize user to session
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  
  // Deserialize user from session
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });
  
  // Local strategy (username/password)
  passport.use(new LocalStrategy(async (username, password, done) => {
    try {
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
      }
      
      // Compare passwords
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return done(null, false, { message: 'Incorrect password.' });
      }
      
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }));
}

// Start the server
startServer().catch(error => {
  console.error('Failed to start server:', error);
});