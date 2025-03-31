import express from 'express';
import { createServer } from 'http';
import session from 'express-session';
import MemoryStore from 'memorystore';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import multer from 'multer';
import { log, setupVite, serveStatic } from './vite.js';
import { connectToDatabase } from './mongodb.js';
import { storage } from './storage.js';
import { addToIPFS, getFromIPFS, testIPFSConnection } from './ipfs.js';

// Create memory store for sessions
const SessionStore = MemoryStore(session);

// Initialize the app
async function startServer() {
  try {
    // Connect to MongoDB database
    await connectToDatabase();
    
    // Test IPFS connection
    const ipfsTest = await testIPFSConnection();
    if (!ipfsTest.success) {
      console.warn('IPFS Warning:', ipfsTest.message);
      console.warn('IPFS functionality may not work properly.');
    } else {
      console.log('IPFS connection successful, CID:', ipfsTest.hash);
    }
    
    const app = express();
    const server = createServer(app);
    
    // Parse JSON bodies
    app.use(express.json());
    
    // Setup session middleware
    app.use(session({
      secret: process.env.SESSION_SECRET || 'healthdata-secret-key',
      resave: false,
      saveUninitialized: false,
      cookie: { 
        secure: process.env.NODE_ENV === 'production',
        maxAge: 86400000 // 1 day
      },
      store: new SessionStore({
        checkPeriod: 86400000 // 24 hours
      })
    }));
    
    // Setup passport for authentication
    configurePassport();
    app.use(passport.initialize());
    app.use(passport.session());
    
    // Setup file uploads with multer
    const upload = multer({
      storage: multer.memoryStorage(),
      limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
      }
    });
    
    // API routes
    registerRoutes(app, upload);
    
    // Set up Vite for frontend (development)
    const viteSetupPromise = setupVite(app, server);
    
    // For production build
    if (process.env.NODE_ENV === 'production') {
      serveStatic(app);
    }
    
    // Wait for Vite to be set up
    await viteSetupPromise;
    
    const PORT = process.env.PORT || 3000;
    const HOST = process.env.HOST || '0.0.0.0';
    
    server.listen(PORT, HOST, () => {
      console.log(`Server listening on http://${HOST}:${PORT}`);
    });
    
    return server;
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Configure passport authentication
function configurePassport() {
  // Serialize and deserialize user
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await storage.getUser(id);
      // Remove password from user object before sending to client
      if (user) {
        const { password, ...userWithoutPassword } = user;
        done(null, userWithoutPassword);
      } else {
        done(null, null);
      }
    } catch (error) {
      done(error, null);
    }
  });
  
  // Local strategy for username/password login
  passport.use(new LocalStrategy(
    async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        
        if (!user) {
          return done(null, false, { message: 'Invalid username or password' });
        }
        
        // In a real app, use bcrypt to compare passwords
        // For simplicity, direct comparison is used here
        if (user.password !== password) {
          return done(null, false, { message: 'Invalid username or password' });
        }
        
        // Remove password from user object before sending to client
        const { password: _, ...userWithoutPassword } = user;
        return done(null, userWithoutPassword);
      } catch (error) {
        return done(error);
      }
    }
  ));
}

// Register API routes
function registerRoutes(app, upload) {
  // Authentication routes
  app.post('/api/auth/login', passport.authenticate('local'), (req, res) => {
    res.json({ success: true, user: req.user });
  });
  
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { username, password, walletAddress } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ 
          success: false, 
          message: 'Username and password are required' 
        });
      }
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(409).json({ 
          success: false, 
          message: 'Username already exists' 
        });
      }
      
      // Create new user
      const newUser = await storage.createUser({
        username,
        password, // In a real app, hash the password
        walletAddress: walletAddress || null
      });
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = newUser;
      
      // Log in the new user
      req.login(userWithoutPassword, (err) => {
        if (err) {
          return res.status(500).json({ 
            success: false, 
            message: 'Failed to login after registration' 
          });
        }
        
        return res.status(201).json({ 
          success: true, 
          user: userWithoutPassword 
        });
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to register user'
      });
    }
  });
  
  app.post('/api/auth/logout', (req, res) => {
    req.logout(() => {
      res.json({ success: true });
    });
  });
  
  app.get('/api/auth/user', isAuthenticated, (req, res) => {
    res.json({ success: true, user: req.user });
  });
  
  // Health records routes
  app.get('/api/records', isAuthenticated, async (req, res) => {
    try {
      const records = await storage.getHealthRecordsByUser(req.user.id);
      res.json({ success: true, records });
    } catch (error) {
      console.error('Error fetching records:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch health records' 
      });
    }
  });
  
  app.get('/api/records/:id', isAuthenticated, async (req, res) => {
    try {
      const record = await storage.getHealthRecord(req.params.id);
      
      if (!record) {
        return res.status(404).json({ 
          success: false, 
          message: 'Record not found' 
        });
      }
      
      // Check if user has access to this record
      if (record.userId !== req.user.id) {
        // TODO: Check if user has been granted access by the record owner
        return res.status(403).json({ 
          success: false, 
          message: 'You do not have access to this record' 
        });
      }
      
      res.json({ success: true, record });
    } catch (error) {
      console.error('Error fetching record:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch health record' 
      });
    }
  });
  
  app.post('/api/records', isAuthenticated, upload.single('file'), async (req, res) => {
    try {
      let ipfsHash;
      let recordData = req.body;
      
      // Handle file upload to IPFS
      if (req.file) {
        ipfsHash = await addToIPFS(req.file.buffer);
      } 
      // Handle JSON data upload to IPFS
      else if (req.body.data) {
        const dataBuffer = Buffer.from(req.body.data);
        ipfsHash = await addToIPFS(dataBuffer);
      } else {
        return res.status(400).json({ 
          success: false, 
          message: 'No file or data provided' 
        });
      }
      
      // Create health record in database
      const record = await storage.createHealthRecord({
        userId: req.user.id,
        recordType: recordData.recordType || 'general',
        title: recordData.title || 'Untitled Record',
        ipfsHash,
        blockchainTxHash: null // Will be updated when blockchain transaction completes
      });
      
      res.status(201).json({ success: true, record });
    } catch (error) {
      console.error('Error creating record:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to create health record: ' + error.message 
      });
    }
  });
  
  app.delete('/api/records/:id', isAuthenticated, async (req, res) => {
    try {
      const record = await storage.getHealthRecord(req.params.id);
      
      if (!record) {
        return res.status(404).json({ 
          success: false, 
          message: 'Record not found' 
        });
      }
      
      // Check if user is the owner of this record
      if (record.userId !== req.user.id) {
        return res.status(403).json({ 
          success: false, 
          message: 'You do not have permission to delete this record' 
        });
      }
      
      // TODO: Implement delete functionality in storage class
      // await storage.deleteHealthRecord(req.params.id);
      
      res.json({ 
        success: true, 
        message: 'Record deleted successfully' 
      });
    } catch (error) {
      console.error('Error deleting record:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to delete health record' 
      });
    }
  });
  
  // Access management routes
  app.get('/api/access', isAuthenticated, async (req, res) => {
    try {
      const grants = await storage.getAccessGrantsByPatient(req.user.id);
      res.json({ success: true, grants });
    } catch (error) {
      console.error('Error fetching access grants:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch access grants' 
      });
    }
  });
  
  app.post('/api/access/grant', isAuthenticated, async (req, res) => {
    try {
      const { providerAddress } = req.body;
      
      if (!providerAddress) {
        return res.status(400).json({ 
          success: false, 
          message: 'Provider address is required' 
        });
      }
      
      const grant = await storage.createAccessGrant({
        patientId: req.user.id,
        providerAddress
      });
      
      res.status(201).json({ success: true, grant });
    } catch (error) {
      console.error('Error granting access:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to grant access' 
      });
    }
  });
  
  app.post('/api/access/:id/revoke', isAuthenticated, async (req, res) => {
    try {
      const grantId = req.params.id;
      
      // Get the grant to check ownership
      const grant = await storage.getAccessGrant(grantId);
      
      if (!grant) {
        return res.status(404).json({ 
          success: false, 
          message: 'Access grant not found' 
        });
      }
      
      // Check if user is the patient who granted access
      if (grant.patientId !== req.user.id) {
        return res.status(403).json({ 
          success: false, 
          message: 'You do not have permission to revoke this access' 
        });
      }
      
      const updatedGrant = await storage.revokeAccess(grantId);
      
      res.json({ success: true, grant: updatedGrant });
    } catch (error) {
      console.error('Error revoking access:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to revoke access' 
      });
    }
  });
  
  // Emergency access routes
  app.get('/api/emergency/generate', isAuthenticated, (req, res) => {
    try {
      // Generate a secure emergency access token
      const token = Math.random().toString(36).substring(2, 15) + 
                    Math.random().toString(36).substring(2, 15);
      
      // In a real implementation, this token would be stored with an expiry time
      // and linked to the patient's ID
      
      // Generate a URL or data for the QR code
      const qrData = {
        token,
        patientId: req.user.id,
        timestamp: Date.now(),
        url: `${req.protocol}://${req.get('host')}/emergency/access/${token}`
      };
      
      res.json({ success: true, qrData });
    } catch (error) {
      console.error('Error generating emergency access:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to generate emergency access QR code' 
      });
    }
  });
  
  app.post('/api/emergency/verify', async (req, res) => {
    try {
      const { qrData, providerAddress } = req.body;
      
      if (!qrData || !qrData.token || !qrData.patientId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid QR code data' 
        });
      }
      
      if (!providerAddress) {
        return res.status(400).json({ 
          success: false, 
          message: 'Provider address is required' 
        });
      }
      
      // Verify the token and check if it's still valid
      // In a real implementation, this would check a database of valid tokens
      
      // Get patient data
      const patient = await storage.getUser(qrData.patientId);
      
      if (!patient) {
        return res.status(404).json({ 
          success: false, 
          message: 'Patient not found' 
        });
      }
      
      // Get critical health records
      const records = await storage.getHealthRecordsByUser(qrData.patientId);
      const emergencyRecords = records.filter(r => r.recordType === 'emergency');
      
      // Return patient info and emergency records
      res.json({
        success: true,
        patientData: {
          id: patient.id,
          name: patient.username, // In a real app, would have proper name fields
          walletAddress: patient.walletAddress,
          emergencyRecords
        }
      });
    } catch (error) {
      console.error('Error verifying emergency access:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to verify emergency access' 
      });
    }
  });
  
  // IPFS direct access routes
  app.get('/api/ipfs/:hash', async (req, res) => {
    try {
      const hash = req.params.hash;
      
      // Get the data from IPFS
      const data = await getFromIPFS(hash);
      
      // Set appropriate content type
      // In a production app, would determine content type from the data
      res.set('Content-Type', 'application/octet-stream');
      res.send(data);
    } catch (error) {
      console.error('Error fetching from IPFS:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch data from IPFS' 
      });
    }
  });
}

// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  
  res.status(401).json({ 
    success: false, 
    message: 'Not authenticated' 
  });
}

// Start the server
const server = startServer();

export default server;