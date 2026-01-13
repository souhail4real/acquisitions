import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function test() {
  try {
    const result = await sql`SELECT 1 as test`;
    console.log('Connection successful:', result);

    const tables =
      await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
    console.log('Tables:', tables);

    const users = await sql`SELECT * FROM users LIMIT 1`;
    console.log('Users:', users);
  } catch (e) {
    console.error('Error:', e.message);
    console.error('Full error:', e);
  }
}

test();
