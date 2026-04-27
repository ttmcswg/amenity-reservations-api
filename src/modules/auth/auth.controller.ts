import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ZodError } from 'zod';
import { loginSchema, registerSchema } from './auth.schema';
import { isAuthError, login, register } from './auth.service';

function mapZodIssues(error: ZodError): string[] {
  return error.issues.map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join('.') : 'request';
    return `${path}: ${issue.message}`;
  });
}

export async function registerHandler(req: Request, res: Response): Promise<void> {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(StatusCodes.BAD_REQUEST).json({
      message: 'Validation failed',
      issues: mapZodIssues(parsed.error),
    });
    return;
  }

  try {
    const result = await register(parsed.data);
    res.status(StatusCodes.CREATED).json(result);
  } catch (error) {
    if (isAuthError(error)) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }

    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
  }
}

export async function loginHandler(req: Request, res: Response): Promise<void> {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(StatusCodes.BAD_REQUEST).json({
      message: 'Validation failed',
      issues: mapZodIssues(parsed.error),
    });
    return;
  }

  try {
    const result = await login(parsed.data);
    res.status(StatusCodes.OK).json(result);
  } catch (error) {
    if (isAuthError(error)) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }

    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
  }
}
