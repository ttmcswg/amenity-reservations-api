import jwt from 'jsonwebtoken';
import { config } from '../../config/env';

export interface AuthTokenClaims {
  sub: string;
  username?: string;
}

export function signAccessToken(user: { id: string; username: string }): {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: string;
} {
  const expiresIn = config.jwtAccessExpiresIn as jwt.SignOptions['expiresIn'];
  const accessToken = jwt.sign(
    {
      sub: user.id,
      username: user.username,
    },
    config.jwtAccessSecret,
    { expiresIn },
  );

  return {
    accessToken,
    tokenType: 'Bearer',
    expiresIn: config.jwtAccessExpiresIn,
  };
}

export function verifyAccessToken(token: string): AuthTokenClaims {
  const decoded = jwt.verify(token, config.jwtAccessSecret);
  if (typeof decoded !== 'object' || decoded === null || typeof decoded.sub !== 'string') {
    throw new Error('Invalid token payload');
  }

  return {
    sub: decoded.sub,
    username: typeof decoded.username === 'string' ? decoded.username : undefined,
  };
}
