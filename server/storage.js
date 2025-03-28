// Since we're converting from TypeScript to JavaScript, we'll include simplified type comments

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

export class MemStorage {
  constructor() {
    this.users = new Map();
    this.healthRecords = new Map();
    this.accessGrants = new Map();
    this.currentId = 1;
    this.healthRecordId = 1;
    this.accessGrantId = 1;
  }

  async getUser(id) {
    return this.users.get(id);
  }

  async getUserByUsername(username) {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser) {
    const id = this.currentId++;
    
    const user = { 
      id,
      username: insertUser.username,
      password: insertUser.password,
      walletAddress: insertUser.walletAddress ?? null,
      createdAt: new Date()
    };
    
    this.users.set(id, user);
    return user;
  }
  
  async getHealthRecord(id) {
    return this.healthRecords.get(id);
  }

  async getHealthRecordsByUser(userId) {
    return Array.from(this.healthRecords.values()).filter(
      (record) => record.userId === userId
    );
  }

  async createHealthRecord(record) {
    const id = this.healthRecordId++;
    
    const healthRecord = {
      id,
      userId: record.userId,
      recordType: record.recordType,
      title: record.title,
      ipfsHash: record.ipfsHash,
      blockchainTxHash: record.blockchainTxHash ?? null,
      uploadedAt: new Date()
    };
    
    this.healthRecords.set(id, healthRecord);
    return healthRecord;
  }
  
  async getAccessGrant(id) {
    return this.accessGrants.get(id);
  }

  async getAccessGrantsByPatient(patientId) {
    return Array.from(this.accessGrants.values()).filter(
      (grant) => grant.patientId === patientId
    );
  }

  async getAccessGrantsByProvider(providerAddress) {
    return Array.from(this.accessGrants.values()).filter(
      (grant) => grant.providerAddress === providerAddress && grant.isActive
    );
  }

  async createAccessGrant(grant) {
    const id = this.accessGrantId++;
    
    const accessGrant = {
      id,
      patientId: grant.patientId,
      providerAddress: grant.providerAddress,
      isActive: grant.isActive ?? true,
      grantedAt: new Date(),
      revokedAt: null
    };
    
    this.accessGrants.set(id, accessGrant);
    return accessGrant;
  }

  async revokeAccess(id) {
    const accessGrant = this.accessGrants.get(id);
    
    if (accessGrant && accessGrant.isActive) {
      const updatedGrant = {
        ...accessGrant,
        isActive: false,
        revokedAt: new Date()
      };
      
      this.accessGrants.set(id, updatedGrant);
      return updatedGrant;
    }
    
    return accessGrant;
  }
}

export const storage = new MemStorage();