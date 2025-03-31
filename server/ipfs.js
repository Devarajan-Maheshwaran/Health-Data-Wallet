import { create } from 'ipfs-http-client';

// Configure IPFS client with Infura
const projectId = process.env.INFURA_IPFS_PROJECT_ID;
const projectSecret = process.env.INFURA_IPFS_PROJECT_SECRET;
const auth = 'Basic ' + Buffer.from(projectId + ':' + projectSecret).toString('base64');

// Initialize IPFS client
const ipfsClient = create({
  host: 'ipfs.infura.io',
  port: 5001,
  protocol: 'https',
  headers: {
    authorization: auth
  }
});

/**
 * Upload a file to IPFS
 * @param {Buffer} fileData - Buffer or file content
 * @returns {Promise<string>} IPFS hash (CID)
 */
export const addToIPFS = async (fileData) => {
  try {
    // Check if credentials are available
    if (!projectId || !projectSecret) {
      throw new Error('IPFS credentials not configured. Please set INFURA_IPFS_PROJECT_ID and INFURA_IPFS_PROJECT_SECRET environment variables.');
    }
    
    const result = await ipfsClient.add(fileData);
    console.log('File uploaded to IPFS with hash:', result.path);
    return result.path;
  } catch (error) {
    console.error('IPFS upload error:', error);
    throw new Error(`Failed to upload to IPFS: ${error.message}`);
  }
};

/**
 * Get a file from IPFS
 * @param {string} ipfsHash - IPFS hash (CID)
 * @returns {Promise<Buffer>} File buffer
 */
export const getFromIPFS = async (ipfsHash) => {
  try {
    // Check if credentials are available
    if (!projectId || !projectSecret) {
      throw new Error('IPFS credentials not configured. Please set INFURA_IPFS_PROJECT_ID and INFURA_IPFS_PROJECT_SECRET environment variables.');
    }
    
    const chunks = [];
    
    // For newer IPFS versions, use client.cat
    for await (const chunk of ipfsClient.cat(ipfsHash)) {
      chunks.push(chunk);
    }
    
    // Concatenate chunks into a single buffer
    return Buffer.concat(chunks);
  } catch (error) {
    console.error('IPFS fetch error:', error);
    throw new Error(`Failed to fetch from IPFS: ${error.message}`);
  }
};

// Get the gateway URL for a CID
export const getIPFSGatewayUrl = (cid) => {
  if (!cid) return null;
  return `https://ipfs.io/ipfs/${cid}`;
};

// Test if IPFS connection is working
export const testIPFSConnection = async () => {
  try {
    if (!projectId || !projectSecret) {
      return { success: false, message: 'IPFS credentials not configured' };
    }
    
    // Try to add a small test file
    const testData = Buffer.from('IPFS Connection Test');
    const result = await ipfsClient.add(testData);
    
    return { 
      success: true, 
      message: 'IPFS connection successful',
      hash: result.path
    };
  } catch (error) {
    console.error('IPFS connection test failed:', error);
    return { 
      success: false, 
      message: `IPFS connection failed: ${error.message}` 
    };
  }
};