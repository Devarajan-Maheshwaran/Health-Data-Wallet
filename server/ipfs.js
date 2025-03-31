import { create } from 'ipfs-http-client';
import { Buffer } from 'buffer';

// Infura IPFS credentials
const PROJECT_ID = process.env.INFURA_IPFS_PROJECT_ID;
const PROJECT_SECRET = process.env.INFURA_IPFS_PROJECT_SECRET;

// IPFS Gateway URL
const IPFS_GATEWAY = 'https://ipfs.io/ipfs/';

// Create IPFS client
const createIPFSClient = () => {
  if (!PROJECT_ID || !PROJECT_SECRET) {
    console.warn('IPFS credentials not found. Some functionality may not work.');
    return null;
  }
  
  const auth = 'Basic ' + Buffer.from(PROJECT_ID + ':' + PROJECT_SECRET).toString('base64');
  
  return create({
    host: 'ipfs.infura.io',
    port: 5001,
    protocol: 'https',
    headers: {
      authorization: auth
    }
  });
};

let ipfsClient;

try {
  ipfsClient = createIPFSClient();
} catch (error) {
  console.error('Failed to create IPFS client:', error);
}

/**
 * Upload a file to IPFS
 * @param {Buffer} fileData - Buffer or file content
 * @returns {Promise<string>} IPFS hash (CID)
 */
export const addToIPFS = async (fileData) => {
  if (!ipfsClient) {
    throw new Error('IPFS client not initialized. Check your credentials.');
  }
  
  try {
    const added = await ipfsClient.add(fileData);
    return added.path;
  } catch (error) {
    console.error('Error uploading to IPFS:', error);
    throw new Error('Failed to upload to IPFS');
  }
};

/**
 * Get a file from IPFS
 * @param {string} ipfsHash - IPFS hash (CID)
 * @returns {Promise<Buffer>} File buffer
 */
export const getFromIPFS = async (ipfsHash) => {
  if (!ipfsClient) {
    throw new Error('IPFS client not initialized. Check your credentials.');
  }
  
  try {
    const chunks = [];
    
    for await (const chunk of ipfsClient.cat(ipfsHash)) {
      chunks.push(chunk);
    }
    
    return Buffer.concat(chunks);
  } catch (error) {
    console.error('Error retrieving from IPFS:', error);
    throw new Error('Failed to retrieve from IPFS');
  }
};

/**
 * Get the public gateway URL for an IPFS hash
 * @param {string} cid - IPFS hash (CID)
 * @returns {string} Gateway URL
 */
export const getIPFSGatewayUrl = (cid) => {
  return `${IPFS_GATEWAY}${cid}`;
};

/**
 * Test IPFS connection
 * @returns {Promise<boolean>} Connection status
 */
export const testIPFSConnection = async () => {
  if (!ipfsClient) {
    return false;
  }
  
  try {
    // Simple test to verify connectivity
    await ipfsClient.id();
    return true;
  } catch (error) {
    console.error('IPFS connection test failed:', error);
    return false;
  }
};