import { MongoClient, ObjectId } from 'mongodb';

// MongoDB connection URI
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = process.env.MONGODB_DB_NAME || 'healthdata';

let client = null;
let db = null;

/**
 * Connect to MongoDB
 * @returns {Promise<Object>} MongoDB database instance
 */
export async function connectToDatabase() {
  try {
    if (db) return db;
    
    client = new MongoClient(uri);
    await client.connect();
    console.log('Connected to MongoDB');
    
    db = client.db(dbName);
    
    // Initialize collections and indexes
    await initializeCollections();
    
    return db;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

/**
 * Initialize MongoDB collections and indexes
 */
async function initializeCollections() {
  try {
    // Users collection
    const usersCollection = db.collection('users');
    await usersCollection.createIndex({ username: 1 }, { unique: true });
    await usersCollection.createIndex({ walletAddress: 1 }, { sparse: true });
    
    // Health records collection
    const healthRecordsCollection = db.collection('health_records');
    await healthRecordsCollection.createIndex({ userId: 1 });
    await healthRecordsCollection.createIndex({ ipfsHash: 1 });
    
    // Access grants collection
    const accessGrantsCollection = db.collection('access_grants');
    await accessGrantsCollection.createIndex({ patientId: 1 });
    await accessGrantsCollection.createIndex({ providerAddress: 1 });
    await accessGrantsCollection.createIndex({ patientId: 1, providerAddress: 1 }, { unique: true });
    
    console.log('MongoDB collections and indexes initialized');
  } catch (error) {
    console.error('Error initializing MongoDB collections:', error);
    throw error;
  }
}

/**
 * Get MongoDB database instance
 * @returns {Object|null} MongoDB database instance or null if not connected
 */
export function getDb() {
  return db;
}

/**
 * Close MongoDB connection
 */
export async function closeConnection() {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log('MongoDB connection closed');
  }
}

/**
 * Convert a string ID to MongoDB ObjectId
 * @param {string} id - String ID to convert
 * @returns {ObjectId} MongoDB ObjectId
 */
export function toObjectId(id) {
  try {
    return new ObjectId(id);
  } catch (error) {
    console.error('Invalid ObjectId:', id);
    throw new Error(`Invalid ID format: ${id}`);
  }
}

/**
 * Sanitize MongoDB document by converting ObjectId to string
 * @param {Object} doc - MongoDB document
 * @returns {Object} Sanitized document with string IDs
 */
export function sanitizeDocument(doc) {
  if (!doc) return null;
  
  const sanitized = { ...doc };
  
  // Convert _id to id string
  if (sanitized._id) {
    sanitized.id = sanitized._id.toString();
    delete sanitized._id;
  }
  
  // Convert date strings to Date objects
  if (sanitized.createdAt && typeof sanitized.createdAt === 'string') {
    sanitized.createdAt = new Date(sanitized.createdAt);
  }
  
  if (sanitized.uploadedAt && typeof sanitized.uploadedAt === 'string') {
    sanitized.uploadedAt = new Date(sanitized.uploadedAt);
  }
  
  if (sanitized.grantedAt && typeof sanitized.grantedAt === 'string') {
    sanitized.grantedAt = new Date(sanitized.grantedAt);
  }
  
  if (sanitized.revokedAt && typeof sanitized.revokedAt === 'string') {
    sanitized.revokedAt = new Date(sanitized.revokedAt);
  }
  
  return sanitized;
}

/**
 * Sanitize array of MongoDB documents
 * @param {Array} docs - Array of MongoDB documents
 * @returns {Array} Array of sanitized documents
 */
export function sanitizeDocuments(docs) {
  if (!docs) return [];
  return docs.map(sanitizeDocument);
}