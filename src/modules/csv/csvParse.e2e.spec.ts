import request from 'supertest';
import app from '../../app';

describe('POST /csv/parse', () => {
  it('returns parsed JSON for valid CSV file upload', async () => {
    const csvContent = ['Id,Name', '1,Massage room', '2,Gym'].join('\n');

    const response = await request(app)
      .post('/csv/parse')
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
    const response = await request(app).post('/csv/parse');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: 'File is required. Use multipart/form-data with field name "file".',
    });
  });

  it('returns 400 for invalid file type', async () => {
    const response = await request(app)
      .post('/csv/parse')
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
