import request from 'supertest';
import app from '../../app';
import { signAccessToken } from '../auth/auth.token';

describe('POST /csv/parse', () => {
  function getAuthHeader(): string {
    const token = signAccessToken({ id: 'test-user-id', username: 'test-user' }).accessToken;
    return `Bearer ${token}`;
  }

  it('returns 401 when auth header is missing', async () => {
    const response = await request(app).post('/csv/parse');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      message: 'Unauthorized',
    });
  });

  it('returns 401 for invalid token', async () => {
    const response = await request(app)
      .post('/csv/parse')
      .set('Authorization', 'Bearer invalid.token.value');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      message: 'Unauthorized',
    });
  });

  it('returns parsed JSON for valid CSV file upload with auth token', async () => {
    const csvContent = ['Id,Name', '1,Massage room', '2,Gym'].join('\n');

    const response = await request(app)
      .post('/csv/parse')
      .set('Authorization', getAuthHeader())
      .attach('file', Buffer.from(csvContent, 'utf-8'), {
        filename: 'amenities.csv',
        contentType: 'text/csv',
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      { Id: '1', Name: 'Massage room' },
      { Id: '2', Name: 'Gym' },
    ]);
  });

  it('returns 400 when file is missing', async () => {
    const response = await request(app).post('/csv/parse').set('Authorization', getAuthHeader());

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: 'File is required. Use multipart/form-data with field name "file".',
    });
  });

  it('returns 400 for invalid file type', async () => {
    const response = await request(app)
      .post('/csv/parse')
      .set('Authorization', getAuthHeader())
      .attach('file', Buffer.from('not,csv', 'utf-8'), {
        filename: 'invalid.txt',
        contentType: 'text/plain',
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: 'Invalid file type. Only CSV files are allowed.',
    });
  });
});
