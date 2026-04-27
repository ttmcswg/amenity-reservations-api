import { AuthTokenClaims } from '../modules/auth/auth.token';

declare global {
  namespace Express {
    interface Request {
      auth?: AuthTokenClaims;
    }
  }
}

export {};
