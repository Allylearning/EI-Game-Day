import { pgTable, serial, text, integer, timestamp } from 'drizzle-orm/pg-core';

export const players = pgTable('players', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  club: text('club'),
  score: integer('score').notNull(),
  selfie: text('selfie'), // Storing selfie as a data URL (text)
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
