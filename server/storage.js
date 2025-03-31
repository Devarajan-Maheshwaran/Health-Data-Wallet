import { getDb, toObjectId, sanitizeDocument, sanitizeDocuments } from './mongodb.js';

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
  /**
   * Get a user by ID
   * @param {string} id - User ID
   * @returns {Promise<User|undefined>}
   */
  async getUser(id) {
    const db = getDb();
    if (!db) throw new Error('Database not connected');
    
    try {
      const user = await db.collection('users').findOne({
        _id: toObjectId(id)
      });
      
      return sanitizeDocument(user);
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
      const user = await db.collection('users').findOne({
        username: username
      });
      
      return sanitizeDocument(user);
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
      const now = new Date();
      const newUser = {
        ...insertUser,
        createdAt: now
      };
      
      const result = await db.collection('users').insertOne(newUser);
      
      return {
        id: result.insertedId.toString(),
        ...insertUser,
        createdAt: now
      };
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
      const record = await db.collection('health_records').findOne({
        _id: toObjectId(id)
      });
      
      return sanitizeDocument(record);
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
      const records = await db.collection('health_records')
        .find({ userId: userId })
        .sort({ uploadedAt: -1 })
        .toArray();
      
      return sanitizeDocuments(records);
    } catch (error) {
      console.error('Error getting health records for user:', error);
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
      const now = new Date();
      const newRecord = {
        ...record,
        blockchainTxHash: record.blockchainTxHash || null,
        uploadedAt: now
      };
      
      const result = await db.collection('health_records').insertOne(newRecord);
      
      return {
        id: result.insertedId.toString(),
        ...newRecord
      };
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
      const grant = await db.collection('access_grants').findOne({
        _id: toObjectId(id)
      });
      
      return sanitizeDocument(grant);
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
      const grants = await db.collection('access_grants')
        .find({ patientId: patientId })
        .sort({ grantedAt: -1 })
        .toArray();
      
      return sanitizeDocuments(grants);
    } catch (error) {
      console.error('Error getting access grants for patient:', error);
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
      const grants = await db.collection('access_grants')
        .find({ 
          providerAddress: providerAddress,
          isActive: true
        })
        .sort({ grantedAt: -1 })
        .toArray();
      
      return sanitizeDocuments(grants);
    } catch (error) {
      console.error('Error getting access grants for provider:', error);
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
      const now = new Date();
      const newGrant = {
        ...grant,
        isActive: grant.isActive !== undefined ? grant.isActive : true,
        grantedAt: now,
        revokedAt: null
      };
      
      // Check if there's an existing grant with the same patient/provider
      const existing = await db.collection('access_grants').findOne({
        patientId: grant.patientId,
        providerAddress: grant.providerAddress
      });
      
      // If one exists but is revoked, update it instead of creating a new one
      if (existing && !existing.isActive) {
        const result = await db.collection('access_grants').updateOne(
          { _id: existing._id },
          { 
            $set: { 
              isActive: true,
              grantedAt: now,
              revokedAt: null
            }
          }
        );
        
        return {
          id: existing._id.toString(),
          patientId: existing.patientId,
          providerAddress: existing.providerAddress,
          isActive: true,
          grantedAt: now,
          revokedAt: null
        };
      }
      
      // Otherwise create a new grant
      const result = await db.collection('access_grants').insertOne(newGrant);
      
      return {
        id: result.insertedId.toString(),
        ...newGrant
      };
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
      const now = new Date();
      
      const result = await db.collection('access_grants').updateOne(
        { _id: toObjectId(id) },
        { 
          $set: { 
            isActive: false,
            revokedAt: now
          }
        }
      );
      
      if (result.modifiedCount === 0) {
        return undefined;
      }
      
      const updatedGrant = await this.getAccessGrant(id);
      return updatedGrant;
    } catch (error) {
      console.error('Error revoking access grant:', error);
      throw error;
    }
  }
}

// Export a singleton instance of the storage class
export const storage = new MongoDBStorage();