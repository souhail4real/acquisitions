import { pgTable, serial, varchar, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 256 }).notNull(),
    email: varchar('email', { length: 256 }).notNull(),
    password: varchar('password', { length: 256 }).notNull(),
    role: varchar('role', { length: 50 }).notNull(),
    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at').defaultNow().notNull()
});
