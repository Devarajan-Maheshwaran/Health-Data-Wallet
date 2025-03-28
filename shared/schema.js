import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table for authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  walletAddress: text("wallet_address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Health records metadata table (actual data stored on IPFS and blockchain)
export const healthRecords = pgTable("health_records", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  recordType: text("record_type").notNull(),
  title: text("title").notNull(),
  ipfsHash: text("ipfs_hash").notNull().unique(),
  blockchainTxHash: text("blockchain_tx_hash"),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

// Access control table - to track which providers have access to which patients
export const accessGrants = pgTable("access_grants", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").references(() => users.id).notNull(),
  providerAddress: text("provider_address").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  grantedAt: timestamp("granted_at").defaultNow().notNull(),
  revokedAt: timestamp("revoked_at"),
});

// Schemas for insertions
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  walletAddress: true,
});

export const insertHealthRecordSchema = createInsertSchema(healthRecords).omit({
  id: true,
  uploadedAt: true,
});

export const insertAccessGrantSchema = createInsertSchema(accessGrants).omit({
  id: true,
  grantedAt: true,
  revokedAt: true,
});

// Export plain objects for JavaScript usage
export const userSchema = {
  insertSchema: insertUserSchema,
  model: users
};

export const healthRecordSchema = {
  insertSchema: insertHealthRecordSchema,
  model: healthRecords
};

export const accessGrantSchema = {
  insertSchema: insertAccessGrantSchema,
  model: accessGrants
};