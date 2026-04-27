import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ZodError } from 'zod';
import { userReservationsParamsSchema } from './userReservations.schema';
import { getUserReservationsGroupedByDay } from './userReservations.service';

function mapZodIssues(error: ZodError): string[] {
  return error.issues.map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join('.') : 'request';
    return `${path}: ${issue.message}`;
  });
}

export function getUserReservations(req: Request, res: Response): void {
  const paramsValidation = userReservationsParamsSchema.safeParse(req.params);
  if (!paramsValidation.success) {
    res.status(StatusCodes.BAD_REQUEST).json({
      message: 'Validation failed',
      issues: mapZodIssues(paramsValidation.error),
    });
    return;
  }

  const result = getUserReservationsGroupedByDay(paramsValidation.data.id);
  res.status(StatusCodes.OK).json(result);
}
