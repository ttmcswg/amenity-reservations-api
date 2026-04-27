import path from 'path';
import { getCachedCsv } from '../../utils/csvCache';
import { minutesToHHMM } from '../../utils/time';

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

export interface AmenityReservationView {
  reservationId: number;
  userId: number;
  startTime: string;
  duration: number;
  amenityName: string;
}

interface ParsedReservation {
  reservationId: number;
  amenityId: number;
  userId: number;
  startTime: number;
  endTime: number;
  date: number;
}

function isSameDate(reservationDate: number, queryDate: number): boolean {
  return reservationDate === queryDate;
}

function mapReservationToDto(
  reservation: ParsedReservation,
  amenityName: string,
): AmenityReservationView {
  return {
    reservationId: reservation.reservationId,
    userId: reservation.userId,
    startTime: minutesToHHMM(reservation.startTime),
    duration: reservation.endTime - reservation.startTime,
    amenityName,
  };
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

export function getAmenityReservationsByDate(
  amenityId: number,
  date: number,
): { amenityExists: boolean; items: AmenityReservationView[] } {
  const amenities = getCachedCsv<AmenityCsvRow>(AMENITIES_CSV_PATH);
  const reservations = getCachedCsv<ReservationCsvRow>(RESERVATIONS_CSV_PATH);

  const amenity = amenities.find((item) => {
    const parsedAmenityId = Number(item.Id);
    return !Number.isNaN(parsedAmenityId) && parsedAmenityId === amenityId;
  });
  if (!amenity) {
    return { amenityExists: false, items: [] };
  }

  const items = reservations
    .map(parseReservationRow)
    .filter((reservation): reservation is ParsedReservation => reservation !== null)
    .filter(
      (reservation) => reservation.amenityId === amenityId && isSameDate(reservation.date, date),
    )
    .sort((a, b) => a.startTime - b.startTime)
    .map((reservation) => mapReservationToDto(reservation, amenity.Name));

  return { amenityExists: true, items };
}
