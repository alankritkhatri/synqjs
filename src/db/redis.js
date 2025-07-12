import { Redis } from "ioredis";
import 'dotenv/config';

const redisClient = process.env.REDIS_URL || "redis://localhost:6379";
export const redis = new Redis(redisClient);

// TTL after save to mongo db
export const JOB_TTL = parseInt(process.env.JOB_TTL) || 3600; // 1 hour
