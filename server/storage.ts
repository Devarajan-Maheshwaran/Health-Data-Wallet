import { 
  users, 
  healthRecords, 
  accessGrants, 
  type User, 
  type InsertUser,
  type HealthRecord,
  type InsertHealthRecord,
  type AccessGrant,
  type InsertAccessGrant
} from "@shared/schema";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Health record operations
  getHealthRecord(id: number): Promise<HealthRecord | undefined>;
  getHealthRecordsByUser(userId: number): Promise<HealthRecord[]>;
  createHealthRecord(record: InsertHealthRecord): Promise<HealthRecord>;
  
  // Access grant operations
  getAccessGrant(id: number): Promise<AccessGrant | undefined>;
  getAccessGrantsByPatient(patientId: number): Promise<AccessGrant[]>;
  getAccessGrantsByProvider(providerAddress: string): Promise<AccessGrant[]>;
  createAccessGrant(grant: InsertAccessGrant): Promise<AccessGrant>;
  revokeAccess(id: number): Promise<AccessGrant | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private healthRecords: Map<number, HealthRecord>;
  private accessGrants: Map<number, AccessGrant>;
  currentId: number;
  private healthRecordId: number;
  private accessGrantId: number;

  constructor() {
    this.users = new Map();
    this.healthRecords = new Map();
    this.accessGrants = new Map();
    this.currentId = 1;
    this.healthRecordId = 1;
    this.accessGrantId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    
    // Create a compliant User object without spreading to avoid type issues
    const user: User = { 
      id,
      username: insertUser.username,
      password: insertUser.password,
      walletAddress: insertUser.walletAddress ?? null,
      createdAt: new Date()
    };
    
    this.users.set(id, user);
    return user;
  }
  
  // Health record operations
  async getHealthRecord(id: number): Promise<HealthRecord | undefined> {
    return this.healthRecords.get(id);
  }

  async getHealthRecordsByUser(userId: number): Promise<HealthRecord[]> {
    return Array.from(this.healthRecords.values()).filter(
      (record) => record.userId === userId
    );
  }

  async createHealthRecord(record: InsertHealthRecord): Promise<HealthRecord> {
    const id = this.healthRecordId++;
    
    const healthRecord: HealthRecord = {
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
  
  // Access grant operations
  async getAccessGrant(id: number): Promise<AccessGrant | undefined> {
    return this.accessGrants.get(id);
  }

  async getAccessGrantsByPatient(patientId: number): Promise<AccessGrant[]> {
    return Array.from(this.accessGrants.values()).filter(
      (grant) => grant.patientId === patientId
    );
  }

  async getAccessGrantsByProvider(providerAddress: string): Promise<AccessGrant[]> {
    return Array.from(this.accessGrants.values()).filter(
      (grant) => grant.providerAddress === providerAddress && grant.isActive
    );
  }

  async createAccessGrant(grant: InsertAccessGrant): Promise<AccessGrant> {
    const id = this.accessGrantId++;
    
    const accessGrant: AccessGrant = {
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

  async revokeAccess(id: number): Promise<AccessGrant | undefined> {
    const accessGrant = this.accessGrants.get(id);
    
    if (accessGrant && accessGrant.isActive) {
      const updatedGrant: AccessGrant = {
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
