// Since we're converting from TypeScript to JavaScript, we'll include simplified type comments
// Import DB connection and schema
import { db } from './db.js';
import { users, healthRecords, accessGrants } from '../shared/schema.js';
import { eq, and } from 'drizzle-orm';

/**
 * @typedef {Object} User
 * @property {number} id
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
 * @property {number} id
 * @property {number} userId
 * @property {string} recordType
 * @property {string} title
 * @property {string} ipfsHash
 * @property {string|null} blockchainTxHash
 * @property {Date} uploadedAt
 */

/**
 * @typedef {Object} InsertHealthRecord
 * @property {number} userId
 * @property {string} recordType
 * @property {string} title
 * @property {string} ipfsHash
 * @property {string|null} [blockchainTxHash]
 */

/**
 * @typedef {Object} AccessGrant
 * @property {number} id
 * @property {number} patientId
 * @property {string} providerAddress
 * @property {boolean} isActive
 * @property {Date} grantedAt
 * @property {Date|null} revokedAt
 */

/**
 * @typedef {Object} InsertAccessGrant
 * @property {number} patientId
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
   * @param {number} id - User ID
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
   * @param {number} id - Record ID
   * @returns {Promise<HealthRecord|undefined>}
   */
  async getHealthRecord(id) { throw new Error('Not implemented'); }

  /**
   * Get all health records for a user
   * @param {number} userId - User ID
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
   * @param {number} id - Grant ID
   * @returns {Promise<AccessGrant|undefined>}
   */
  async getAccessGrant(id) { throw new Error('Not implemented'); }

  /**
   * Get all access grants for a patient
   * @param {number} patientId - Patient ID
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
   * @param {number} id - Grant ID
   * @returns {Promise<AccessGrant|undefined>}
   */
  async revokeAccess(id) { throw new Error('Not implemented'); }
}

/**
 * DatabaseStorage class that uses the Postgres database
 */
export class DatabaseStorage extends IStorage {
  /**
   * Get a user by ID
   * @param {number} id - User ID
   * @returns {Promise<User|undefined>}
   */
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  /**
   * Get a user by username
   * @param {string} username - Username
   * @returns {Promise<User|undefined>}
   */
  async getUserByUsername(username) {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  /**
   * Create a new user
   * @param {InsertUser} insertUser - User data
   * @returns {Promise<User>}
   */
  async createUser(insertUser) {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  /**
   * Get a health record by ID
   * @param {number} id - Record ID
   * @returns {Promise<HealthRecord|undefined>}
   */
  async getHealthRecord(id) {
    const [record] = await db.select().from(healthRecords).where(eq(healthRecords.id, id));
    return record || undefined;
  }

  /**
   * Get all health records for a user
   * @param {number} userId - User ID
   * @returns {Promise<HealthRecord[]>}
   */
  async getHealthRecordsByUser(userId) {
    return await db.select().from(healthRecords).where(eq(healthRecords.userId, userId));
  }

  /**
   * Create a new health record
   * @param {InsertHealthRecord} record - Record data
   * @returns {Promise<HealthRecord>}
   */
  async createHealthRecord(record) {
    const [newRecord] = await db
      .insert(healthRecords)
      .values(record)
      .returning();
    return newRecord;
  }

  /**
   * Get an access grant by ID
   * @param {number} id - Grant ID
   * @returns {Promise<AccessGrant|undefined>}
   */
  async getAccessGrant(id) {
    const [grant] = await db.select().from(accessGrants).where(eq(accessGrants.id, id));
    return grant || undefined;
  }

  /**
   * Get all access grants for a patient
   * @param {number} patientId - Patient ID
   * @returns {Promise<AccessGrant[]>}
   */
  async getAccessGrantsByPatient(patientId) {
    return await db.select().from(accessGrants).where(eq(accessGrants.patientId, patientId));
  }

  /**
   * Get all access grants for a provider
   * @param {string} providerAddress - Provider's wallet address
   * @returns {Promise<AccessGrant[]>}
   */
  async getAccessGrantsByProvider(providerAddress) {
    return await db.select().from(accessGrants).where(eq(accessGrants.providerAddress, providerAddress));
  }

  /**
   * Create a new access grant
   * @param {InsertAccessGrant} grant - Grant data
   * @returns {Promise<AccessGrant>}
   */
  async createAccessGrant(grant) {
    const [newGrant] = await db
      .insert(accessGrants)
      .values(grant)
      .returning();
    return newGrant;
  }

  /**
   * Revoke an access grant
   * @param {number} id - Grant ID
   * @returns {Promise<AccessGrant|undefined>}
   */
  async revokeAccess(id) {
    const [updatedGrant] = await db
      .update(accessGrants)
      .set({ 
        isActive: false,
        revokedAt: new Date()
      })
      .where(eq(accessGrants.id, id))
      .returning();
    
    return updatedGrant || undefined;
  }
}

// Use the DatabaseStorage implementation
export const storage = new DatabaseStorage();