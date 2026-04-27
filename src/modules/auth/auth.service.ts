import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from '../../config/env';
import {
  createUser,
  findUserByEmail,
  findUserByIdentifier,
  findUserByUsername,
} from './auth.repository';
import { LoginInput, RegisterInput } from './auth.schema';

class AuthError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

interface AuthUserSafe {
  id: string;
  email: string;
  username: string;
}

interface AuthTokenPayload {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: string;
}

export interface AuthSuccessResponse extends AuthTokenPayload {
  user: AuthUserSafe;
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function toSafeUser(user: { id: string; email: string; username: string }): AuthUserSafe {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
  };
}

function issueAccessToken(user: { id: string; username: string }): AuthTokenPayload {
  const expiresIn = config.jwtAccessExpiresIn as jwt.SignOptions['expiresIn'];
  const accessToken = jwt.sign(
    {
      sub: user.id,
      username: user.username,
    },
    config.jwtAccessSecret,
    {
      expiresIn,
    },
  );

  return {
    accessToken,
    tokenType: 'Bearer',
    expiresIn: config.jwtAccessExpiresIn,
  };
}

export async function register(input: RegisterInput): Promise<AuthSuccessResponse> {
  const normalizedEmail = normalize(input.email);
  const normalizedUsername = normalize(input.username);

  const [existingByEmail, existingByUsername] = await Promise.all([
    findUserByEmail(normalizedEmail),
    findUserByUsername(normalizedUsername),
  ]);

  if (existingByEmail || existingByUsername) {
    throw new AuthError('Email or username already exists', 409);
  }

  const passwordHash = await bcrypt.hash(input.password, config.bcryptSaltRounds);

  const createdUser = await createUser({
    email: normalizedEmail,
    username: normalizedUsername,
    passwordHash,
  });

  return {
    user: toSafeUser(createdUser),
    ...issueAccessToken(createdUser),
  };
}

export async function login(input: LoginInput): Promise<AuthSuccessResponse> {
  const user = await findUserByIdentifier(input.identifier);
  if (!user) {
    throw new AuthError('Invalid credentials', 401);
  }

  const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);
  if (!isPasswordValid) {
    throw new AuthError('Invalid credentials', 401);
  }

  return {
    user: toSafeUser(user),
    ...issueAccessToken(user),
  };
}

export function isAuthError(error: unknown): error is AuthError {
  return error instanceof AuthError;
}
