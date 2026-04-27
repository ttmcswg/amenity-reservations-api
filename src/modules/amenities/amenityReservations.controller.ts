import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ZodError } from 'zod';
import { getAmenityReservationsByDate } from './amenityReservations.service';
import {
  amenityReservationsParamsSchema,
  amenityReservationsQuerySchema,
} from './amenityReservations.schema';

function mapZodIssues(error: ZodError): string[] {
  return error.issues.map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join('.') : 'request';
    return `${path}: ${issue.message}`;
  });
}

export function getAmenityReservations(req: Request, res: Response): void {
  const paramsValidation = amenityReservationsParamsSchema.safeParse(req.params);
  if (!paramsValidation.success) {
    res.status(StatusCodes.BAD_REQUEST).json({
      message: 'Validation failed',
      issues: mapZodIssues(paramsValidation.error),
    });
    return;
  }

  const queryValidation = amenityReservationsQuerySchema.safeParse(req.query);
  if (!queryValidation.success) {
    res.status(StatusCodes.BAD_REQUEST).json({
      message: 'Validation failed',
      issues: mapZodIssues(queryValidation.error),
    });
    return;
  }

  const amenityId = paramsValidation.data.id;
  const date = queryValidation.data.date;

  const result = getAmenityReservationsByDate(amenityId, date);
  if (!result.amenityExists) {
    res.status(StatusCodes.NOT_FOUND).json({
      message: 'Amenity not found.',
    });
    return;
  }

  res.status(StatusCodes.OK).json(result.items);
}
