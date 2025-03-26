import { create } from 'ipfs-http-client';
import { Buffer } from 'buffer';

// Configure IPFS with Infura or other IPFS gateways
const projectId = process.env.INFURA_IPFS_PROJECT_ID || '';
const projectSecret = process.env.INFURA_IPFS_PROJECT_SECRET || '';
const auth = 'Basic ' + Buffer.from(projectId + ':' + projectSecret).toString('base64');

// Log IPFS configuration (without revealing sensitive values)
console.log('IPFS configuration initialized with project ID:', projectId ? '[CONFIGURED]' : '[MISSING]');
console.log('IPFS project secret:', projectSecret ? '[CONFIGURED]' : '[MISSING]');

let ipfsClient: any;

try {
  ipfsClient = create({
    host: 'ipfs.infura.io',
    port: 5001,
    protocol: 'https',
    headers: {
      authorization: auth,
    },
  });
} catch (error) {
  console.error('Error creating IPFS client:', error);
}

/**
 * Upload a file to IPFS
 * @param fileData Buffer or file content
 * @returns IPFS hash (CID)
 */
export const addToIPFS = async (fileData: Buffer): Promise<string> => {
  try {
    if (!ipfsClient) {
      throw new Error('IPFS client not initialized');
    }
    
    const result = await ipfsClient.add(fileData);
    return result.path;
  } catch (error) {
    console.error('Error uploading to IPFS:', error);
    throw new Error('Failed to upload to IPFS');
  }
};

/**
 * Get a file from IPFS
 * @param ipfsHash IPFS hash (CID)
 * @returns File buffer
 */
export const getFromIPFS = async (ipfsHash: string): Promise<Buffer> => {
  try {
    if (!ipfsClient) {
      throw new Error('IPFS client not initialized');
    }
    
    const chunks = [];
    for await (const chunk of ipfsClient.cat(ipfsHash)) {
      chunks.push(chunk);
    }
    
    return Buffer.concat(chunks);
  } catch (error) {
    console.error('Error getting file from IPFS:', error);
    throw new Error('Failed to retrieve file from IPFS');
  }
};
