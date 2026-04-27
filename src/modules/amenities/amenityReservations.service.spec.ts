import { getAmenityReservationsByDate } from './amenityReservations.service';
import { minutesToHHMM } from '../../utils/time';
import { readCsv } from '../../utils/csvReader';

jest.mock('../../utils/csvReader', () => ({
  readCsv: jest.fn(),
}));

const mockReadCsv = readCsv as jest.MockedFunction<typeof readCsv>;

describe('amenityReservations service', () => {
  beforeEach(() => {
    mockReadCsv.mockReset();
  });

  describe('minutesToHHMM', () => {
    it('formats midnight correctly', () => {
      expect(minutesToHHMM(0)).toBe('00:00');
    });

    it('formats early morning correctly', () => {
      expect(minutesToHHMM(300)).toBe('05:00');
    });

    it('formats last minute of day correctly', () => {
      expect(minutesToHHMM(1439)).toBe('23:59');
    });
  });

  it('maps reservations with duration/startTime and sorts by startTime asc', () => {
    mockReadCsv
      .mockReturnValueOnce([
        { Id: '1', Name: 'Massage room' },
        { Id: '2', Name: 'Gym' },
      ] as never[])
      .mockReturnValueOnce([
        { Id: '10', 'Amenity id': '1', 'User id': '7', 'Start time': '480', 'End time': '540', Date: '1' },
        { Id: '11', 'Amenity id': '1', 'User id': '8', 'Start time': '300', 'End time': '360', Date: '1' },
      ] as never[]);

    const result = getAmenityReservationsByDate(1, 1);

    expect(result.amenityExists).toBe(true);
    expect(result.items).toEqual([
      {
        reservationId: 11,
        userId: 8,
        startTime: '05:00',
        duration: 60,
        amenityName: 'Massage room',
      },
      {
        reservationId: 10,
        userId: 7,
        startTime: '08:00',
        duration: 60,
        amenityName: 'Massage room',
      },
    ]);
  });

  it('ignores malformed numeric rows and invalid time ranges', () => {
    mockReadCsv
      .mockReturnValueOnce([{ Id: '1', Name: 'Massage room' }] as never[])
      .mockReturnValueOnce([
        { Id: '1', 'Amenity id': '1', 'User id': '1', 'Start time': '100', 'End time': '200', Date: '2' },
        { Id: 'x', 'Amenity id': '1', 'User id': '1', 'Start time': '120', 'End time': '180', Date: '2' },
        { Id: '3', 'Amenity id': '1', 'User id': '1', 'Start time': '-1', 'End time': '50', Date: '2' },
        { Id: '4', 'Amenity id': '1', 'User id': '1', 'Start time': '500', 'End time': '500', Date: '2' },
        { Id: '5', 'Amenity id': '1', 'User id': '1', 'Start time': '1500', 'End time': '1560', Date: '2' },
      ] as never[]);

    const result = getAmenityReservationsByDate(1, 2);

    expect(result.items).toEqual([
      {
        reservationId: 1,
        userId: 1,
        startTime: '01:40',
        duration: 100,
        amenityName: 'Massage room',
      },
    ]);
  });
});
