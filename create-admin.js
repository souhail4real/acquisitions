import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcrypt';

const sql = neon(process.env.DATABASE_URL);

// Admin credentials - CHANGE THESE!
const adminEmail = 'admin@acquisitions.com';
const adminPassword = 'Admin123!';
const adminName = 'Administrator';

const hashedPassword = await bcrypt.hash(adminPassword, 10);

try {
  // Check if admin already exists
  const existing = await sql`SELECT id FROM users WHERE email = ${adminEmail}`;

  if (existing.length > 0) {
    // Update existing admin password
    await sql`UPDATE users SET password = ${hashedPassword}, role = 'admin' WHERE email = ${adminEmail}`;
    console.log('✅ Admin password updated!');
  } else {
    // Create new admin
    await sql`
      INSERT INTO users (name, email, password, role, created_at, updated_at)
      VALUES (${adminName}, ${adminEmail}, ${hashedPassword}, 'admin', NOW(), NOW())
    `;
    console.log('✅ Admin account created!');
  }

  console.log('\n📧 Email:', adminEmail);
  console.log('🔑 Password:', adminPassword);
  console.log('\n⚠️  Change this password after first login!');
} catch (error) {
  console.error('❌ Error:', error.message);
}
