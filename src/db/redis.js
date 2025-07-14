import { Redis } from "ioredis";
import 'dotenv/config';

const redisClient = process.env.REDIS_URL || "redis://localhost:6379";
export const redis = new Redis(redisClient);
