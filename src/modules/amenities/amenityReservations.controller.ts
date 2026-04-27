import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { getAmenityReservationsByDate } from './amenityReservations.service';

const DAY_IN_MS = 86_400_000;

export function getAmenityReservations(req: Request, res: Response): void {
  const amenityIdRaw = req.params.id;
  const dateRaw = req.query.date;
  const amenityId = Number(amenityIdRaw);

  if (Number.isNaN(amenityId) || !Number.isFinite(amenityId) || amenityId <= 0) {
    res.status(StatusCodes.BAD_REQUEST).json({
      message: 'Invalid amenity id. It must be a positive number.',
    });
    return;
  }

  if (dateRaw === undefined) {
    res.status(StatusCodes.BAD_REQUEST).json({
      message: 'Missing required query parameter: date.',
    });
    return;
  }

  if (Array.isArray(dateRaw)) {
    res.status(StatusCodes.BAD_REQUEST).json({
      message: 'Invalid date query parameter. Provide a single day-start timestamp.',
    });
    return;
  }

  const date = Number(dateRaw);
  if (Number.isNaN(date) || !Number.isFinite(date) || date <= 0) {
    res.status(StatusCodes.BAD_REQUEST).json({
      message: 'Invalid date query parameter. Use day-start timestamp.',
    });
    return;
  }

  if (!Number.isInteger(date) || date % DAY_IN_MS !== 0) {
    res.status(StatusCodes.BAD_REQUEST).json({
      message: 'Invalid date query parameter. It must be a day-start timestamp in milliseconds.',
    });
    return;
  }

  const result = getAmenityReservationsByDate(amenityId, date);
  if (!result.amenityExists) {
    res.status(StatusCodes.NOT_FOUND).json({
      message: 'Amenity not found.',
    });
    return;
  }

  res.status(StatusCodes.OK).json(result.items);
}
