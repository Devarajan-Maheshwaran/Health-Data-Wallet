import { createServer } from "http";
import { storage } from "./storage.js";
import multer from 'multer';
import { addToIPFS, getFromIPFS } from './ipfs.js';

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

export async function registerRoutes(app) {
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
        password,
        walletAddress
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

  // Health record routes
  app.post('/api/health-records', async (req, res) => {
    try {
      const { userId, recordType, title, ipfsHash, blockchainTxHash } = req.body;
      
      // Basic validation
      if (!userId || !recordType || !title || !ipfsHash) {
        return res.status(400).json({ 
          success: false,
          message: 'User ID, record type, title, and IPFS hash are required' 
        });
      }
      
      // Create new health record
      const newRecord = await storage.createHealthRecord({
        userId,
        recordType,
        title,
        ipfsHash,
        blockchainTxHash
      });
      
      res.status(201).json({
        success: true,
        message: 'Health record created successfully',
        record: newRecord
      });
    } catch (error) {
      console.error('Error creating health record:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to create health record',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.get('/api/health-records/user/:userId', async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ 
          success: false,
          message: 'Invalid user ID' 
        });
      }
      
      const records = await storage.getHealthRecordsByUser(userId);
      
      res.status(200).json({
        success: true,
        count: records.length,
        records
      });
    } catch (error) {
      console.error('Error fetching health records:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to fetch health records',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.get('/api/health-records/:id', async (req, res) => {
    try {
      const recordId = parseInt(req.params.id);
      
      if (isNaN(recordId)) {
        return res.status(400).json({ 
          success: false,
          message: 'Invalid record ID' 
        });
      }
      
      const record = await storage.getHealthRecord(recordId);
      
      if (!record) {
        return res.status(404).json({ 
          success: false,
          message: 'Health record not found' 
        });
      }
      
      res.status(200).json({
        success: true,
        record
      });
    } catch (error) {
      console.error('Error fetching health record:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to fetch health record',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Access grant routes
  app.post('/api/access-grants', async (req, res) => {
    try {
      const { patientId, providerAddress } = req.body;
      
      // Basic validation
      if (!patientId || !providerAddress) {
        return res.status(400).json({ 
          success: false,
          message: 'Patient ID and provider address are required' 
        });
      }
      
      // Create new access grant
      const newGrant = await storage.createAccessGrant({
        patientId,
        providerAddress,
        isActive: true
      });
      
      res.status(201).json({
        success: true,
        message: 'Access granted successfully',
        grant: newGrant
      });
    } catch (error) {
      console.error('Error granting access:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to grant access',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.get('/api/access-grants/patient/:patientId', async (req, res) => {
    try {
      const patientId = parseInt(req.params.patientId);
      
      if (isNaN(patientId)) {
        return res.status(400).json({ 
          success: false,
          message: 'Invalid patient ID' 
        });
      }
      
      const grants = await storage.getAccessGrantsByPatient(patientId);
      
      res.status(200).json({
        success: true,
        count: grants.length,
        grants
      });
    } catch (error) {
      console.error('Error fetching access grants:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to fetch access grants',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.get('/api/access-grants/provider/:providerAddress', async (req, res) => {
    try {
      const { providerAddress } = req.params;
      
      if (!providerAddress) {
        return res.status(400).json({ 
          success: false,
          message: 'Provider address is required' 
        });
      }
      
      const grants = await storage.getAccessGrantsByProvider(providerAddress);
      
      res.status(200).json({
        success: true,
        count: grants.length,
        grants
      });
    } catch (error) {
      console.error('Error fetching access grants:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to fetch access grants',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.patch('/api/access-grants/:id/revoke', async (req, res) => {
    try {
      const grantId = parseInt(req.params.id);
      
      if (isNaN(grantId)) {
        return res.status(400).json({ 
          success: false,
          message: 'Invalid grant ID' 
        });
      }
      
      const updatedGrant = await storage.revokeAccess(grantId);
      
      if (!updatedGrant) {
        return res.status(404).json({ 
          success: false,
          message: 'Access grant not found' 
        });
      }
      
      res.status(200).json({
        success: true,
        message: 'Access revoked successfully',
        grant: updatedGrant
      });
    } catch (error) {
      console.error('Error revoking access:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to revoke access',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}