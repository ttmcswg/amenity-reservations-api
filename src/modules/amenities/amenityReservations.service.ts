import path from 'path';
import { readCsv } from '../../utils/csvReader';

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

export function minutesToHHMM(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60)
    .toString()
    .padStart(2, '0');
  const minutes = (totalMinutes % 60).toString().padStart(2, '0');

  return `${hours}:${minutes}`;
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
  const amenities = readCsv<AmenityCsvRow>(AMENITIES_CSV_PATH);
  const reservations = readCsv<ReservationCsvRow>(RESERVATIONS_CSV_PATH);

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
