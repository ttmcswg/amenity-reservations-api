import path from 'path';
import { getCachedCsv } from '../../utils/csvCache';
import { minutesToHHMM } from '../../utils/time';
import { UserDayReservations, UserReservationDto } from './userReservations.types';

const AMENITIES_CSV_PATH = path.resolve(process.cwd(), 'data/amenity.csv');
const RESERVATIONS_CSV_PATH = path.resolve(process.cwd(), 'data/reservations.csv');
const MINUTES_IN_DAY = 1440;

interface AmenityCsvRow {
  Id: string;
  Name: string;
}

interface ReservationCsvRow {
  Id: string;
  'Amenity id': string;
  'User id': string;
  'Start time': string;
  'End time': string;
  Date: string;
}

interface ParsedReservation {
  reservationId: number;
  amenityId: number;
  userId: number;
  startTime: number;
  endTime: number;
  date: number;
}

function parseReservationRow(row: ReservationCsvRow): ParsedReservation | null {
  const reservationId = Number(row.Id);
  const amenityId = Number(row['Amenity id']);
  const userId = Number(row['User id']);
  const startTime = Number(row['Start time']);
  const endTime = Number(row['End time']);
  const date = Number(row.Date);

  const hasInvalidNumber = [
    reservationId,
    amenityId,
    userId,
    startTime,
    endTime,
    date,
  ].some((value) => Number.isNaN(value));

  if (hasInvalidNumber) {
    return null;
  }

  if (
    startTime < 0 ||
    endTime < 0 ||
    startTime > MINUTES_IN_DAY ||
    endTime > MINUTES_IN_DAY ||
    endTime <= startTime
  ) {
    return null;
  }

  return {
    reservationId,
    amenityId,
    userId,
    startTime,
    endTime,
    date,
  };
}

function mapReservationToDto(
  reservation: ParsedReservation,
  amenityNameById: Map<number, string>,
): UserReservationDto {
  return {
    reservationId: reservation.reservationId,
    amenityId: reservation.amenityId,
    amenityName: amenityNameById.get(reservation.amenityId) ?? 'Unknown amenity',
    startTime: minutesToHHMM(reservation.startTime),
    duration: reservation.endTime - reservation.startTime,
  };
}

export function getUserReservationsGroupedByDay(userId: number): UserDayReservations[] {
  const amenities = getCachedCsv<AmenityCsvRow>(AMENITIES_CSV_PATH);
  const reservations = getCachedCsv<ReservationCsvRow>(RESERVATIONS_CSV_PATH);

  const amenityNameById = new Map<number, string>();
  amenities.forEach((amenity) => {
    const amenityId = Number(amenity.Id);
    if (!Number.isNaN(amenityId)) {
      amenityNameById.set(amenityId, amenity.Name);
    }
  });

  const userReservations = reservations
    .map(parseReservationRow)
    .filter((reservation): reservation is ParsedReservation => reservation !== null)
    .filter((reservation) => reservation.userId === userId)
    .sort((a, b) => a.startTime - b.startTime);

  const groupedByDate = new Map<number, UserReservationDto[]>();
  userReservations.forEach((reservation) => {
    const current = groupedByDate.get(reservation.date) ?? [];
    current.push(mapReservationToDto(reservation, amenityNameById));
    groupedByDate.set(reservation.date, current);
  });

  return [...groupedByDate.entries()]
    .sort(([dateA], [dateB]) => dateA - dateB)
    .map(([date, dayReservations]) => ({
      date,
      reservations: dayReservations,
    }));
}
