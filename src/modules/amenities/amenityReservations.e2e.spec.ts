import request from 'supertest';
import app from '../../app';

describe('GET /amenities/:id/reservations', () => {
  it('returns reservations for amenity and date sorted by startTime', async () => {
    const response = await request(app).get('/amenities/1/reservations').query({
      date: '1593648000000',
    });

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(1);

    expect(response.body[0]).toEqual({
      reservationId: 1,
      userId: 2,
      startTime: '05:00',
      duration: 180,
      amenityName: 'Massage room',
    });

    const startTimes = response.body.map((item: { startTime: string }) => item.startTime);
    const sorted = [...startTimes].sort();
    expect(startTimes).toEqual(sorted);
  });

  it('returns 400 for invalid amenity id', async () => {
    const response = await request(app).get('/amenities/not-a-number/reservations').query({
      date: '1593648000000',
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Validation failed');
    expect(Array.isArray(response.body.issues)).toBe(true);
  });

  it('returns 400 for invalid date', async () => {
    const response = await request(app).get('/amenities/1/reservations').query({
      date: '123',
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Validation failed');
    expect(Array.isArray(response.body.issues)).toBe(true);
  });

  it('returns 404 for non-existing amenity', async () => {
    const response = await request(app).get('/amenities/999/reservations').query({
      date: '1593648000000',
    });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      message: 'Amenity not found.',
    });
  });
});
