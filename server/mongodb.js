import { MongoClient, ObjectId } from 'mongodb';

let client = null;
let db = null;

const DB_NAME = 'health_records_db';
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';

/**
 * Connect to MongoDB
 * @returns {Promise<Object>} MongoDB database instance
 */
export async function connectToDatabase() {
  if (db) return db;
  
  try {
    client = new MongoClient(MONGO_URI);
    await client.connect();
    console.log('Connected to MongoDB');
    
    db = client.db(DB_NAME);
    
    // Initialize collections and indexes
    await initializeCollections();
    
    return db;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }
}

/**
 * Initialize MongoDB collections and indexes
 */
async function initializeCollections() {
  // Create users collection if it doesn't exist
  const collections = await db.listCollections().toArray();
  const collectionNames = collections.map(c => c.name);
  
  // Users collection
  if (!collectionNames.includes('users')) {
    await db.createCollection('users');
    await db.collection('users').createIndex({ username: 1 }, { unique: true });
    await db.collection('users').createIndex({ walletAddress: 1 }, { sparse: true });
  }
  
  // Health records collection
  if (!collectionNames.includes('healthRecords')) {
    await db.createCollection('healthRecords');
    await db.collection('healthRecords').createIndex({ userId: 1 });
    await db.collection('healthRecords').createIndex({ ipfsHash: 1 });
  }
  
  // Access grants collection
  if (!collectionNames.includes('accessGrants')) {
    await db.createCollection('accessGrants');
    await db.collection('accessGrants').createIndex({ patientId: 1 });
    await db.collection('accessGrants').createIndex({ providerAddress: 1 });
    await db.collection('accessGrants').createIndex({ isActive: 1 });
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
    console.log('MongoDB connection closed');
    client = null;
    db = null;
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
    throw new Error('Invalid ID format');
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
  if (doc._id) {
    sanitized.id = doc._id.toString();
    delete sanitized._id;
  }
  
  return sanitized;
}

/**
 * Sanitize array of MongoDB documents
 * @param {Array} docs - Array of MongoDB documents
 * @returns {Array} Array of sanitized documents
 */
export function sanitizeDocuments(docs) {
  if (!docs || !Array.isArray(docs)) return [];
  return docs.map(sanitizeDocument);
}