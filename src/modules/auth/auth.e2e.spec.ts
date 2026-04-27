import request from 'supertest';
import app from '../../app';
import {
  closeTestDatabase,
  ensureTestDatabaseReady,
  truncateUsersTable,
} from '../../test-utils/db';

const validRegisterPayload = {
  username: 'johnsmith',
  email: 'john@example.com',
  password: 'Password123',
};

describe('Auth endpoints', () => {
  const shouldRunDbIntegration = Boolean(process.env.DATABASE_URL_TEST);

  beforeAll(async () => {
    if (!shouldRunDbIntegration) {
      return;
    }
    await ensureTestDatabaseReady();
  });

  beforeEach(async () => {
    if (!shouldRunDbIntegration) {
      return;
    }
    await truncateUsersTable();
  });

  afterAll(async () => {
    if (!shouldRunDbIntegration) {
      return;
    }
    await closeTestDatabase();
  });

  const testOrSkip = shouldRunDbIntegration ? it : it.skip;

  describe('POST /auth/register', () => {
    testOrSkip('returns 201 for valid payload', async () => {
      const response = await request(app).post('/auth/register').send(validRegisterPayload);

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        user: {
          email: 'john@example.com',
          username: 'johnsmith',
        },
        tokenType: 'Bearer',
      });
      expect(typeof response.body.accessToken).toBe('string');
      expect(response.body.user.id).toBeDefined();
      expect(response.body.user.password).toBeUndefined();
      expect(response.body.user.password_hash).toBeUndefined();
    });

    testOrSkip('returns 400 for invalid payload', async () => {
      const response = await request(app).post('/auth/register').send({
        username: 'ab',
        email: 'bad-email',
        password: '123',
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Validation failed');
      expect(Array.isArray(response.body.issues)).toBe(true);
    });

    testOrSkip('returns 409 for duplicate email or username', async () => {
      await request(app).post('/auth/register').send(validRegisterPayload);
      const duplicateResponse = await request(app).post('/auth/register').send({
        username: 'johnsmith',
        email: 'john@example.com',
        password: 'Password123',
      });

      expect(duplicateResponse.status).toBe(409);
      expect(duplicateResponse.body).toEqual({
        message: 'Email or username already exists',
      });
    });
  });

  describe('POST /auth/login', () => {
    testOrSkip('returns 200 with token metadata on valid credentials', async () => {
      await request(app).post('/auth/register').send(validRegisterPayload);

      const response = await request(app).post('/auth/login').send({
        identifier: 'johnsmith',
        password: 'Password123',
      });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        tokenType: 'Bearer',
        user: {
          email: 'john@example.com',
          username: 'johnsmith',
        },
      });
      expect(typeof response.body.accessToken).toBe('string');
      expect(response.body.user.password).toBeUndefined();
      expect(response.body.user.password_hash).toBeUndefined();
    });

    testOrSkip('returns 401 for wrong password with generic message', async () => {
      await request(app).post('/auth/register').send(validRegisterPayload);

      const response = await request(app).post('/auth/login').send({
        identifier: 'johnsmith',
        password: 'WrongPassword1',
      });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        message: 'Invalid credentials',
      });
    });

    testOrSkip('returns 401 for non-existing user with same generic message', async () => {
      const response = await request(app).post('/auth/login').send({
        identifier: 'unknown_user',
        password: 'Password123',
      });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        message: 'Invalid credentials',
      });
    });

    testOrSkip('returns 400 for invalid input shape', async () => {
      const response = await request(app).post('/auth/login').send({
        identifier: '',
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Validation failed');
      expect(Array.isArray(response.body.issues)).toBe(true);
    });
  });
});
