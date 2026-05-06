import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from "@/app/generated/prisma/client";

import dotenv from "dotenv";
dotenv.config();
 
// éCrer le client Neon adapter
const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL,
});
 
// éCrer le client Prisma avec l’adaptateur Neon
const prisma = new PrismaClient({
  adapter,
  log: ['query', 'info', 'warn', 'error'],
});

export default prisma
