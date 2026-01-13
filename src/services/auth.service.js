import logger from '#config/logger.js';
import bcrypt from 'bcrypt';
import { sql } from '#config/database.js';

export const hashPassword = async password => {
  try {
    return await bcrypt.hash(password, 10);
  } catch (e) {
    logger.error(`Error hashing the password: ${e}`);
    throw new Error('Error hashing');
  }
};

export const comparePassword = async (password, hashedPassword) => {
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (e) {
    logger.error(`Error comparing password: ${e}`);
    throw new Error('Error comparing password');
  }
};

export const createUser = async ({ name, email, password, role = 'user' }) => {
  try {
    logger.info(`Checking if user exists: ${email}`);

    const existingUsers =
      await sql`SELECT id FROM users WHERE email = ${email} LIMIT 1`;

    if (existingUsers && existingUsers.length > 0)
      throw new Error('User with this email already exists');

    const password_hash = await hashPassword(password);

    logger.info(`Creating user: ${email}`);
    const result = await sql`
            INSERT INTO users (name, email, password, role, created_at, updated_at)
            VALUES (${name}, ${email}, ${password_hash}, ${role}, NOW(), NOW())
            RETURNING id, name, email, role, created_at
        `;

    const newUser = result[0];
    if (!newUser) {
      throw new Error('Failed to create user');
    }

    logger.info(`User ${newUser.email} created successfully`);
    return newUser;
  } catch (e) {
    logger.error(`Error creating the user: ${e}`);
    throw e;
  }
};

export const authenticateUser = async ({ email, password }) => {
  try {
    const result = await sql`
            SELECT id, name, email, password, role, created_at
            FROM users WHERE email = ${email} LIMIT 1
        `;

    const existingUser = result && result[0];

    if (!existingUser) {
      throw new Error('User not found');
    }

    const isPasswordValid = await comparePassword(
      password,
      existingUser.password
    );

    if (!isPasswordValid) {
      throw new Error('Invalid password');
    }

    logger.info(`User ${existingUser.email} authenticated successfully`);
    return {
      id: existingUser.id,
      name: existingUser.name,
      email: existingUser.email,
      role: existingUser.role,
      created_at: existingUser.created_at,
    };
  } catch (e) {
    logger.error(`Error authenticating user: ${e}`);
    throw e;
  }
};
