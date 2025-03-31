import { z } from 'zod';
import { storage } from './storage.js';
import { insertUserSchema, insertHealthRecordSchema, insertAccessGrantSchema } from '../shared/schema.js';
import { addToIPFS, getFromIPFS, getIPFSGatewayUrl } from './ipfs.js';

/**
 * Middleware to check if user is authenticated
 */
export function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ error: 'Unauthorized' });
}

/**
 * Register all API routes
 * @param {Express} app - Express application
 * @param {Object} upload - Multer upload middleware
 */
export async function registerRoutes(app, upload) {
  // Auth routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const data = insertUserSchema.parse(req.body);
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(data.username);
      if (existingUser) {
        return res.status(400).json({ error: 'Username already exists' });
      }
      
      const user = await storage.createUser(data);
      res.status(201).json({
        id: user.id,
        username: user.username,
        walletAddress: user.walletAddress
      });
    } catch (error) {
      console.error('Registration error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: 'Registration failed' });
    }
  });

  app.post('/api/auth/login', (req, res, next) => {
    // Passport authentication is handled in index.js
    res.status(200).json({ 
      user: {
        id: req.user.id,
        username: req.user.username,
        walletAddress: req.user.walletAddress
      }
    });
  });

  app.post('/api/auth/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ error: 'Logout failed' });
      }
      res.status(200).json({ message: 'Logged out successfully' });
    });
  });

  app.get('/api/auth/status', (req, res) => {
    if (req.isAuthenticated()) {
      return res.status(200).json({ 
        isAuthenticated: true,
        user: {
          id: req.user.id,
          username: req.user.username,
          walletAddress: req.user.walletAddress
        }
      });
    }
    res.status(200).json({ isAuthenticated: false });
  });

  // User routes
  app.get('/api/users/me', isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.status(200).json({
        id: user.id,
        username: user.username,
        walletAddress: user.walletAddress,
        createdAt: user.createdAt
      });
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  });

  app.patch('/api/users/wallet', isAuthenticated, async (req, res) => {
    try {
      const { walletAddress } = z.object({
        walletAddress: z.string().min(1)
      }).parse(req.body);
      
      // Update user's wallet address in database
      // This is a placeholder - actual implementation would need to update the user record
      
      res.status(200).json({ message: 'Wallet address updated', walletAddress });
    } catch (error) {
      console.error('Error updating wallet address:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: 'Failed to update wallet address' });
    }
  });

  // Health record routes
  app.post('/api/records', isAuthenticated, upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      
      const { recordType, title } = z.object({
        recordType: z.string().min(1),
        title: z.string().min(1)
      }).parse(req.body);
      
      // Upload file to IPFS
      const ipfsHash = await addToIPFS(req.file.buffer);
      
      // Create record in database
      const record = await storage.createHealthRecord({
        userId: req.user.id,
        recordType,
        title,
        ipfsHash,
        blockchainTxHash: null // Will be updated later after blockchain transaction
      });
      
      res.status(201).json({
        id: record.id,
        title: record.title,
        recordType: record.recordType,
        ipfsHash: record.ipfsHash,
        ipfsUrl: getIPFSGatewayUrl(record.ipfsHash),
        uploadedAt: record.uploadedAt
      });
    } catch (error) {
      console.error('Error creating health record:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: 'Failed to create health record' });
    }
  });

  app.get('/api/records', isAuthenticated, async (req, res) => {
    try {
      const records = await storage.getHealthRecordsByUser(req.user.id);
      
      // Enhance records with IPFS URLs
      const enhancedRecords = records.map(record => ({
        id: record.id,
        title: record.title,
        recordType: record.recordType,
        ipfsHash: record.ipfsHash,
        ipfsUrl: getIPFSGatewayUrl(record.ipfsHash),
        blockchainTxHash: record.blockchainTxHash,
        uploadedAt: record.uploadedAt
      }));
      
      res.status(200).json(enhancedRecords);
    } catch (error) {
      console.error('Error fetching health records:', error);
      res.status(500).json({ error: 'Failed to fetch health records' });
    }
  });

  app.get('/api/records/:id', isAuthenticated, async (req, res) => {
    try {
      const record = await storage.getHealthRecord(req.params.id);
      
      if (!record) {
        return res.status(404).json({ error: 'Record not found' });
      }
      
      // Check if user owns the record
      if (record.userId !== req.user.id) {
        // TODO: Check if user has been granted access instead of just returning 403
        return res.status(403).json({ error: 'Access denied' });
      }
      
      // Get file data from IPFS
      const fileData = await getFromIPFS(record.ipfsHash);
      
      res.status(200).json({
        id: record.id,
        title: record.title,
        recordType: record.recordType,
        ipfsHash: record.ipfsHash,
        ipfsUrl: getIPFSGatewayUrl(record.ipfsHash),
        blockchainTxHash: record.blockchainTxHash,
        uploadedAt: record.uploadedAt,
        fileData: fileData.toString('base64')
      });
    } catch (error) {
      console.error('Error fetching health record:', error);
      res.status(500).json({ error: 'Failed to fetch health record' });
    }
  });

  // Access management routes
  app.post('/api/access', isAuthenticated, async (req, res) => {
    try {
      const data = insertAccessGrantSchema.parse(req.body);
      
      // Ensure user is granting access to their own records
      if (data.patientId !== req.user.id) {
        return res.status(403).json({ error: 'Cannot grant access for other users' });
      }
      
      const grant = await storage.createAccessGrant({
        patientId: data.patientId,
        providerAddress: data.providerAddress,
        isActive: true
      });
      
      res.status(201).json({
        id: grant.id,
        patientId: grant.patientId,
        providerAddress: grant.providerAddress,
        isActive: grant.isActive,
        grantedAt: grant.grantedAt
      });
    } catch (error) {
      console.error('Error granting access:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: 'Failed to grant access' });
    }
  });

  app.get('/api/access/granted', isAuthenticated, async (req, res) => {
    try {
      const grants = await storage.getAccessGrantsByPatient(req.user.id);
      res.status(200).json(grants);
    } catch (error) {
      console.error('Error fetching access grants:', error);
      res.status(500).json({ error: 'Failed to fetch access grants' });
    }
  });

  app.get('/api/access/received', isAuthenticated, async (req, res) => {
    try {
      if (!req.user.walletAddress) {
        return res.status(400).json({ error: 'User does not have a wallet address' });
      }
      
      const grants = await storage.getAccessGrantsByProvider(req.user.walletAddress);
      res.status(200).json(grants);
    } catch (error) {
      console.error('Error fetching received access grants:', error);
      res.status(500).json({ error: 'Failed to fetch received access grants' });
    }
  });

  app.patch('/api/access/:id/revoke', isAuthenticated, async (req, res) => {
    try {
      const grant = await storage.getAccessGrant(req.params.id);
      
      if (!grant) {
        return res.status(404).json({ error: 'Access grant not found' });
      }
      
      // Check if user is the patient who granted access
      if (grant.patientId !== req.user.id) {
        return res.status(403).json({ error: 'Cannot revoke access granted by other users' });
      }
      
      const updatedGrant = await storage.revokeAccess(req.params.id);
      
      res.status(200).json({
        id: updatedGrant.id,
        patientId: updatedGrant.patientId,
        providerAddress: updatedGrant.providerAddress,
        isActive: updatedGrant.isActive,
        grantedAt: updatedGrant.grantedAt,
        revokedAt: updatedGrant.revokedAt
      });
    } catch (error) {
      console.error('Error revoking access:', error);
      res.status(500).json({ error: 'Failed to revoke access' });
    }
  });

  // Emergency access via QR code routes
  app.post('/api/emergency/generate', isAuthenticated, async (req, res) => {
    try {
      // Generate a temporary access token for the patient's records
      // This would typically involve creating a time-limited token
      const tempToken = `emergency_${req.user.id}_${Date.now()}`;
      
      // In a real app, this should be stored securely and expire after use
      
      res.status(200).json({ token: tempToken });
    } catch (error) {
      console.error('Error generating emergency token:', error);
      res.status(500).json({ error: 'Failed to generate emergency token' });
    }
  });

  app.post('/api/emergency/validate', isAuthenticated, async (req, res) => {
    try {
      const { token } = z.object({
        token: z.string().min(1)
      }).parse(req.body);
      
      // Validate the emergency token
      if (!token.startsWith('emergency_')) {
        return res.status(400).json({ error: 'Invalid token format' });
      }
      
      // Extract patient ID from token (simple implementation for example)
      const parts = token.split('_');
      if (parts.length !== 3) {
        return res.status(400).json({ error: 'Invalid token format' });
      }
      
      const patientId = parts[1];
      
      // In a real app, verify token validity and expiration
      
      // Get patient info
      const patient = await storage.getUser(patientId);
      if (!patient) {
        return res.status(404).json({ error: 'Patient not found' });
      }
      
      // Get patient's records
      const records = await storage.getHealthRecordsByUser(patientId);
      
      res.status(200).json({
        patient: {
          id: patient.id,
          username: patient.username
        },
        records: records.map(record => ({
          id: record.id,
          title: record.title,
          recordType: record.recordType,
          ipfsHash: record.ipfsHash,
          ipfsUrl: getIPFSGatewayUrl(record.ipfsHash),
          uploadedAt: record.uploadedAt
        }))
      });
    } catch (error) {
      console.error('Error validating emergency token:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: 'Failed to validate emergency token' });
    }
  });

  // Zero-knowledge proof routes
  app.post('/api/zkp/generate', isAuthenticated, async (req, res) => {
    try {
      const { dataHash } = z.object({
        dataHash: z.string().min(1)
      }).parse(req.body);
      
      // In a real app, generate a zero-knowledge proof
      // This is a simplified placeholder
      const proofData = {
        proof: {
          a: ['0x1', '0x2'],
          b: [['0x3', '0x4'], ['0x5', '0x6']],
          c: ['0x7', '0x8']
        },
        inputs: ['0x9', '0xa', dataHash]
      };
      
      res.status(200).json(proofData);
    } catch (error) {
      console.error('Error generating ZK proof:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: 'Failed to generate ZK proof' });
    }
  });

  app.post('/api/zkp/verify', isAuthenticated, async (req, res) => {
    try {
      const { proof, inputs } = z.object({
        proof: z.object({
          a: z.array(z.string()),
          b: z.array(z.array(z.string())),
          c: z.array(z.string())
        }),
        inputs: z.array(z.string())
      }).parse(req.body);
      
      // In a real app, verify the zero-knowledge proof
      // This is a simplified placeholder that always returns true
      const isValid = true;
      
      res.status(200).json({ isValid });
    } catch (error) {
      console.error('Error verifying ZK proof:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: 'Failed to verify ZK proof' });
    }
  });
}