import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from 'multer';
import { addToIPFS, getFromIPFS } from './ipfs';

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // IPFS upload endpoint
  app.post('/api/ipfs/upload', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      
      // Upload encrypted file to IPFS
      const ipfsHash = await addToIPFS(req.file.buffer);
      
      // Return the IPFS hash to the client
      res.status(200).json({ 
        hash: ipfsHash,
        success: true,
        message: 'File uploaded to IPFS successfully',
      });
    } catch (error) {
      console.error('Error in IPFS upload:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to upload file to IPFS',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // IPFS get endpoint
  app.get('/api/ipfs/get/:hash', async (req, res) => {
    try {
      const ipfsHash = req.params.hash;
      
      if (!ipfsHash) {
        return res.status(400).json({ message: 'IPFS hash is required' });
      }
      
      // Get file from IPFS
      const fileBuffer = await getFromIPFS(ipfsHash);
      
      // Set headers for file download
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="file-${ipfsHash}.bin"`);
      
      // Send the file data
      res.send(fileBuffer);
    } catch (error) {
      console.error('Error getting file from IPFS:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to retrieve file from IPFS',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // User routes
  app.post('/api/users/register', async (req, res) => {
    try {
      const { username, password, walletAddress } = req.body;
      
      // Basic validation
      if (!username || !password || !walletAddress) {
        return res.status(400).json({ message: 'Username, password, and wallet address are required' });
      }
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(409).json({ message: 'Username already exists' });
      }
      
      // Create new user
      const newUser = await storage.createUser({
        username,
        password
      });
      
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        user: {
          id: newUser.id,
          username: newUser.username
        }
      });
    } catch (error) {
      console.error('Error registering user:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to register user',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
