import { ObjectId } from 'mongodb';
import { connectToDatabase, getDb, sanitizeDocument, sanitizeDocuments } from './mongodb.js';

/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} username
 * @property {string} password
 * @property {string|null} walletAddress
 * @property {Date} createdAt
 */

/**
 * @typedef {Object} InsertUser
 * @property {string} username
 * @property {string} password
 * @property {string|null} [walletAddress]
 */

/**
 * @typedef {Object} HealthRecord
 * @property {string} id
 * @property {string} userId
 * @property {string} recordType
 * @property {string} title
 * @property {string} ipfsHash
 * @property {string|null} blockchainTxHash
 * @property {Date} uploadedAt
 */

/**
 * @typedef {Object} InsertHealthRecord
 * @property {string} userId
 * @property {string} recordType
 * @property {string} title
 * @property {string} ipfsHash
 * @property {string|null} [blockchainTxHash]
 */

/**
 * @typedef {Object} AccessGrant
 * @property {string} id
 * @property {string} patientId
 * @property {string} providerAddress
 * @property {boolean} isActive
 * @property {Date} grantedAt
 * @property {Date|null} revokedAt
 */

/**
 * @typedef {Object} InsertAccessGrant
 * @property {string} patientId
 * @property {string} providerAddress
 * @property {boolean} [isActive]
 */

/**
 * Interface for storage operations
 * @interface
 */
export class IStorage {
  /**
   * Get a user by ID
   * @param {string} id - User ID
   * @returns {Promise<User|undefined>}
   */
  async getUser(id) { throw new Error('Not implemented'); }

  /**
   * Get a user by username
   * @param {string} username - Username
   * @returns {Promise<User|undefined>}
   */
  async getUserByUsername(username) { throw new Error('Not implemented'); }

  /**
   * Create a new user
   * @param {InsertUser} user - User data
   * @returns {Promise<User>}
   */
  async createUser(user) { throw new Error('Not implemented'); }

  /**
   * Get a health record by ID
   * @param {string} id - Record ID
   * @returns {Promise<HealthRecord|undefined>}
   */
  async getHealthRecord(id) { throw new Error('Not implemented'); }

  /**
   * Get all health records for a user
   * @param {string} userId - User ID
   * @returns {Promise<HealthRecord[]>}
   */
  async getHealthRecordsByUser(userId) { throw new Error('Not implemented'); }

  /**
   * Create a new health record
   * @param {InsertHealthRecord} record - Record data
   * @returns {Promise<HealthRecord>}
   */
  async createHealthRecord(record) { throw new Error('Not implemented'); }

  /**
   * Get an access grant by ID
   * @param {string} id - Grant ID
   * @returns {Promise<AccessGrant|undefined>}
   */
  async getAccessGrant(id) { throw new Error('Not implemented'); }

  /**
   * Get all access grants for a patient
   * @param {string} patientId - Patient ID
   * @returns {Promise<AccessGrant[]>}
   */
  async getAccessGrantsByPatient(patientId) { throw new Error('Not implemented'); }

  /**
   * Get all access grants for a provider
   * @param {string} providerAddress - Provider's wallet address
   * @returns {Promise<AccessGrant[]>}
   */
  async getAccessGrantsByProvider(providerAddress) { throw new Error('Not implemented'); }

  /**
   * Create a new access grant
   * @param {InsertAccessGrant} grant - Grant data
   * @returns {Promise<AccessGrant>}
   */
  async createAccessGrant(grant) { throw new Error('Not implemented'); }

  /**
   * Revoke an access grant
   * @param {string} id - Grant ID
   * @returns {Promise<AccessGrant|undefined>}
   */
  async revokeAccess(id) { throw new Error('Not implemented'); }
}

/**
 * MongoDBStorage class that uses MongoDB for persistence
 */
export class MongoDBStorage extends IStorage {
  constructor() {
    super();
    // Ensure database connection is established
    connectToDatabase().catch(err => {
      console.error('Failed to connect to MongoDB:', err);
    });
  }

  /**
   * Get a user by ID
   * @param {string} id - User ID
   * @returns {Promise<User|undefined>}
   */
  async getUser(id) {
    const db = getDb();
    if (!db) throw new Error('Database not connected');
    
    try {
      const user = await db.collection('users').findOne({ _id: new ObjectId(id) });
      return user ? sanitizeDocument(user) : undefined;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      throw error;
    }
  }

  /**
   * Get a user by username
   * @param {string} username - Username
   * @returns {Promise<User|undefined>}
   */
  async getUserByUsername(username) {
    const db = getDb();
    if (!db) throw new Error('Database not connected');
    
    try {
      const user = await db.collection('users').findOne({ username });
      return user ? sanitizeDocument(user) : undefined;
    } catch (error) {
      console.error('Error getting user by username:', error);
      throw error;
    }
  }

  /**
   * Create a new user
   * @param {InsertUser} insertUser - User data
   * @returns {Promise<User>}
   */
  async createUser(insertUser) {
    const db = getDb();
    if (!db) throw new Error('Database not connected');
    
    try {
      const newUser = {
        ...insertUser,
        createdAt: new Date()
      };
      
      const result = await db.collection('users').insertOne(newUser);
      return sanitizeDocument({ _id: result.insertedId, ...newUser });
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Get a health record by ID
   * @param {string} id - Record ID
   * @returns {Promise<HealthRecord|undefined>}
   */
  async getHealthRecord(id) {
    const db = getDb();
    if (!db) throw new Error('Database not connected');
    
    try {
      const record = await db.collection('healthRecords').findOne({ _id: new ObjectId(id) });
      return record ? sanitizeDocument(record) : undefined;
    } catch (error) {
      console.error('Error getting health record:', error);
      throw error;
    }
  }

  /**
   * Get all health records for a user
   * @param {string} userId - User ID
   * @returns {Promise<HealthRecord[]>}
   */
  async getHealthRecordsByUser(userId) {
    const db = getDb();
    if (!db) throw new Error('Database not connected');
    
    try {
      const records = await db.collection('healthRecords')
        .find({ userId: userId })
        .sort({ uploadedAt: -1 })
        .toArray();
      
      return sanitizeDocuments(records);
    } catch (error) {
      console.error('Error getting health records by user:', error);
      throw error;
    }
  }

  /**
   * Create a new health record
   * @param {InsertHealthRecord} record - Record data
   * @returns {Promise<HealthRecord>}
   */
  async createHealthRecord(record) {
    const db = getDb();
    if (!db) throw new Error('Database not connected');
    
    try {
      const newRecord = {
        ...record,
        uploadedAt: new Date()
      };
      
      const result = await db.collection('healthRecords').insertOne(newRecord);
      return sanitizeDocument({ _id: result.insertedId, ...newRecord });
    } catch (error) {
      console.error('Error creating health record:', error);
      throw error;
    }
  }

  /**
   * Get an access grant by ID
   * @param {string} id - Grant ID
   * @returns {Promise<AccessGrant|undefined>}
   */
  async getAccessGrant(id) {
    const db = getDb();
    if (!db) throw new Error('Database not connected');
    
    try {
      const grant = await db.collection('accessGrants').findOne({ _id: new ObjectId(id) });
      return grant ? sanitizeDocument(grant) : undefined;
    } catch (error) {
      console.error('Error getting access grant:', error);
      throw error;
    }
  }

  /**
   * Get all access grants for a patient
   * @param {string} patientId - Patient ID
   * @returns {Promise<AccessGrant[]>}
   */
  async getAccessGrantsByPatient(patientId) {
    const db = getDb();
    if (!db) throw new Error('Database not connected');
    
    try {
      const grants = await db.collection('accessGrants')
        .find({ patientId: patientId })
        .sort({ grantedAt: -1 })
        .toArray();
      
      return sanitizeDocuments(grants);
    } catch (error) {
      console.error('Error getting access grants by patient:', error);
      throw error;
    }
  }

  /**
   * Get all access grants for a provider
   * @param {string} providerAddress - Provider's wallet address
   * @returns {Promise<AccessGrant[]>}
   */
  async getAccessGrantsByProvider(providerAddress) {
    const db = getDb();
    if (!db) throw new Error('Database not connected');
    
    try {
      const grants = await db.collection('accessGrants')
        .find({ 
          providerAddress, 
          isActive: true 
        })
        .sort({ grantedAt: -1 })
        .toArray();
      
      return sanitizeDocuments(grants);
    } catch (error) {
      console.error('Error getting access grants by provider:', error);
      throw error;
    }
  }

  /**
   * Create a new access grant
   * @param {InsertAccessGrant} grant - Grant data
   * @returns {Promise<AccessGrant>}
   */
  async createAccessGrant(grant) {
    const db = getDb();
    if (!db) throw new Error('Database not connected');
    
    try {
      const newGrant = {
        ...grant,
        isActive: grant.isActive !== undefined ? grant.isActive : true,
        grantedAt: new Date(),
        revokedAt: null
      };
      
      const result = await db.collection('accessGrants').insertOne(newGrant);
      return sanitizeDocument({ _id: result.insertedId, ...newGrant });
    } catch (error) {
      console.error('Error creating access grant:', error);
      throw error;
    }
  }

  /**
   * Revoke an access grant
   * @param {string} id - Grant ID
   * @returns {Promise<AccessGrant|undefined>}
   */
  async revokeAccess(id) {
    const db = getDb();
    if (!db) throw new Error('Database not connected');
    
    try {
      const result = await db.collection('accessGrants').findOneAndUpdate(
        { _id: new ObjectId(id) },
        { 
          $set: { 
            isActive: false,
            revokedAt: new Date() 
          } 
        },
        { returnDocument: 'after' }
      );
      
      return result.value ? sanitizeDocument(result.value) : undefined;
    } catch (error) {
      console.error('Error revoking access grant:', error);
      throw error;
    }
  }
}

// Export a single instance of MongoDBStorage to be used across the application
export const storage = new MongoDBStorage();