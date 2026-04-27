import { query } from '../../config/db';

export interface AuthUserRecord {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

interface DbUserRow {
  id: string;
  email: string;
  username: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
}

interface CreateUserInput {
  email: string;
  username: string;
  passwordHash: string;
}

function mapDbUser(row: DbUserRow): AuthUserRecord {
  return {
    id: row.id,
    email: row.email,
    username: row.username,
    passwordHash: row.password_hash,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normalizeIdentifier(value: string): string {
  return value.trim().toLowerCase();
}

export async function findUserByEmail(email: string): Promise<AuthUserRecord | null> {
  const result = await query<DbUserRow>(
    `
      SELECT id, email, username, password_hash, created_at, updated_at
      FROM users
      WHERE email = $1
      LIMIT 1
    `,
    [normalizeIdentifier(email)],
  );

  return result.rows[0] ? mapDbUser(result.rows[0]) : null;
}

export async function findUserByUsername(username: string): Promise<AuthUserRecord | null> {
  const result = await query<DbUserRow>(
    `
      SELECT id, email, username, password_hash, created_at, updated_at
      FROM users
      WHERE username = $1
      LIMIT 1
    `,
    [normalizeIdentifier(username)],
  );

  return result.rows[0] ? mapDbUser(result.rows[0]) : null;
}

export async function findUserByIdentifier(identifier: string): Promise<AuthUserRecord | null> {
  const normalized = normalizeIdentifier(identifier);
  const result = await query<DbUserRow>(
    `
      SELECT id, email, username, password_hash, created_at, updated_at
      FROM users
      WHERE email = $1 OR username = $1
      LIMIT 1
    `,
    [normalized],
  );

  return result.rows[0] ? mapDbUser(result.rows[0]) : null;
}

export async function createUser(input: CreateUserInput): Promise<AuthUserRecord> {
  const result = await query<DbUserRow>(
    `
      INSERT INTO users (email, username, password_hash)
      VALUES ($1, $2, $3)
      RETURNING id, email, username, password_hash, created_at, updated_at
    `,
    [
      normalizeIdentifier(input.email),
      normalizeIdentifier(input.username),
      input.passwordHash,
    ],
  );

  return mapDbUser(result.rows[0]);
}
