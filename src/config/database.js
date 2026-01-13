import 'dotenv/config';

import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../models/user.model.js';

// Configure Neon Local if enabled (for Docker development environment)
const useNeonLocal = process.env.USE_NEON_LOCAL === 'true';
const neonLocalHost = process.env.NEON_LOCAL_HOST || 'localhost';
const neonLocalPort = process.env.NEON_LOCAL_PORT || '5432';

if (useNeonLocal) {
  // Configure Neon serverless driver for Neon Local proxy
  // Neon Local only supports HTTP-based communication, not websockets
  neonConfig.fetchEndpoint = `http://${neonLocalHost}:${neonLocalPort}/sql`;
  neonConfig.useSecureWebSocket = false;
  neonConfig.poolQueryViaFetch = true;

  console.log(
    `🔧 Configured for Neon Local at ${neonLocalHost}:${neonLocalPort}`
  );
}

const sql = neon(process.env.DATABASE_URL, {
  // For Neon Local with self-signed certificates
  ...(useNeonLocal && {
    fetchOptions: {
      // Neon Local uses HTTP, not HTTPS
    },
  }),
});

const db = drizzle(sql, { schema });

// Log database connection mode
console.log(
  `📦 Database mode: ${useNeonLocal ? 'Neon Local (Development)' : 'Neon Cloud (Production)'}`
);

export { db, sql };
