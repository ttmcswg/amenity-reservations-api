import { getUserReservationsGroupedByDay } from './userReservations.service';
import { readCsv } from '../../utils/csvReader';
import { invalidateCsvCache } from '../../utils/csvCache';

jest.mock('../../utils/csvReader', () => ({
  readCsv: jest.fn(),
}));

const mockReadCsv = readCsv as jest.MockedFunction<typeof readCsv>;

describe('userReservations service', () => {
  beforeEach(() => {
    mockReadCsv.mockReset();
    invalidateCsvCache();
  });

  it('filters by userId, groups by date, sorts groups and reservations, enriches amenity names', () => {
    mockReadCsv
      .mockReturnValueOnce([
        { Id: '1', Name: 'Massage room' },
        { Id: '2', Name: 'Gym' },
      ] as never[])
      .mockReturnValueOnce([
        { Id: '3', 'Amenity id': '2', 'User id': '5', 'Start time': '200', 'End time': '260', Date: '20' },
        { Id: '2', 'Amenity id': '1', 'User id': '5', 'Start time': '100', 'End time': '160', Date: '10' },
        { Id: '1', 'Amenity id': '2', 'User id': '5', 'Start time': '50', 'End time': '80', Date: '10' },
        { Id: '9', 'Amenity id': '1', 'User id': '6', 'Start time': '70', 'End time': '120', Date: '10' },
      ] as never[]);

    const result = getUserReservationsGroupedByDay(5);

    expect(result).toEqual([
      {
        date: 10,
        reservations: [
          {
            reservationId: 1,
            amenityId: 2,
            amenityName: 'Gym',
            startTime: '00:50',
            duration: 30,
          },
          {
            reservationId: 2,
            amenityId: 1,
            amenityName: 'Massage room',
            startTime: '01:40',
            duration: 60,
          },
        ],
      },
      {
        date: 20,
        reservations: [
          {
            reservationId: 3,
            amenityId: 2,
            amenityName: 'Gym',
            startTime: '03:20',
            duration: 60,
          },
        ],
      },
    ]);
  });

  it('skips malformed/invalid rows and uses Unknown amenity fallback', () => {
    mockReadCsv
      .mockReturnValueOnce([{ Id: '1', Name: 'Massage room' }] as never[])
      .mockReturnValueOnce([
        { Id: '1', 'Amenity id': '999', 'User id': '7', 'Start time': '60', 'End time': '120', Date: '100' },
        { Id: 'bad', 'Amenity id': '1', 'User id': '7', 'Start time': '70', 'End time': '130', Date: '100' },
        { Id: '3', 'Amenity id': '1', 'User id': '7', 'Start time': '500', 'End time': '400', Date: '100' },
        { Id: '4', 'Amenity id': '1', 'User id': '7', 'Start time': '-1', 'End time': '20', Date: '100' },
      ] as never[]);

    const result = getUserReservationsGroupedByDay(7);

    expect(result).toEqual([
      {
        date: 100,
        reservations: [
          {
            reservationId: 1,
            amenityId: 999,
            amenityName: 'Unknown amenity',
            startTime: '01:00',
            duration: 60,
          },
        ],
      },
    ]);
  });
});
