/**
 * This file serves as a reference schema for the MongoDB collections
 * and provides validation schemas for the API requests.
 */

import { z } from 'zod';

export const userSchema = {
  id: z.string(),
  username: z.string().min(3).max(50),
  password: z.string().min(6).max(100),
  walletAddress: z.string().nullable().optional(),
  createdAt: z.date()
};

export const healthRecordSchema = {
  id: z.string(),
  userId: z.string(),
  recordType: z.string(),
  title: z.string().min(1).max(255),
  ipfsHash: z.string(),
  blockchainTxHash: z.string().nullable().optional(),
  uploadedAt: z.date()
};

export const accessGrantSchema = {
  id: z.string(),
  patientId: z.string(),
  providerAddress: z.string(),
  isActive: z.boolean(),
  grantedAt: z.date(),
  revokedAt: z.date().nullable()
};

export const insertUserSchema = z.object({
  username: userSchema.username,
  password: userSchema.password,
  walletAddress: userSchema.walletAddress
});

export const insertHealthRecordSchema = z.object({
  userId: healthRecordSchema.userId,
  recordType: healthRecordSchema.recordType,
  title: healthRecordSchema.title,
  ipfsHash: healthRecordSchema.ipfsHash,
  blockchainTxHash: healthRecordSchema.blockchainTxHash
});

export const insertAccessGrantSchema = z.object({
  patientId: accessGrantSchema.patientId,
  providerAddress: accessGrantSchema.providerAddress,
  isActive: z.boolean().optional()
});