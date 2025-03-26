import { users, type User, type InsertUser } from "@shared/schema";

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
  currentId: number;

  constructor() {
    this.users = new Map();
    this.currentId = 1;
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
}

export const storage = new MemStorage();
