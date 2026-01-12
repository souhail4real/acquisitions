import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';

// Crée le client Neon avec la DATABASE_URL
const client = neon(process.env.DATABASE_URL);

// Crée l'instance Drizzle
export const db = drizzle(client);

// Si tu veux l'URL pour d'autres usages
export const sql = process.env.DATABASE_URL;
