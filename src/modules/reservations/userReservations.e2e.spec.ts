import request from 'supertest';
import app from '../../app';

describe('GET /users/:id/reservations', () => {
  it('returns user reservations grouped by date', async () => {
    const response = await request(app).get('/users/2/reservations');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      {
        date: 1593648000000,
        reservations: [
          {
            reservationId: 1,
            amenityId: 1,
            amenityName: 'Massage room',
            startTime: '05:00',
            duration: 180,
          },
        ],
      },
    ]);
  });

  it('keeps reservations sorted by startTime inside each day', async () => {
    const response = await request(app).get('/users/2/reservations');

    expect(response.status).toBe(200);
    const dayReservations = response.body[0]?.reservations ?? [];
    const startTimes = dayReservations.map((item: { startTime: string }) => item.startTime);
    const sorted = [...startTimes].sort();
    expect(startTimes).toEqual(sorted);
  });

  it('returns 400 for invalid user id', async () => {
    const response = await request(app).get('/users/invalid/reservations');

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Validation failed');
    expect(Array.isArray(response.body.issues)).toBe(true);
  });
});
