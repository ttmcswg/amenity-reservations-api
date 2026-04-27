import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { login, register } from './auth.service';
import * as authRepository from './auth.repository';

jest.mock('./auth.repository');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

const mockedRepository = authRepository as jest.Mocked<typeof authRepository>;
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockedJwt = jwt as jest.Mocked<typeof jwt>;
const mockedHash = bcrypt.hash as unknown as jest.Mock<Promise<string>, [string, number]>;

describe('auth.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('register success hashes password and returns safe payload', async () => {
    mockedRepository.findUserByEmail.mockResolvedValueOnce(null);
    mockedRepository.findUserByUsername.mockResolvedValueOnce(null);
    mockedHash.mockResolvedValueOnce('hashed_password');
    mockedRepository.createUser.mockResolvedValueOnce({
      id: 'user-1',
      email: 'john@example.com',
      username: 'john',
      passwordHash: 'hashed_password',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    mockedJwt.sign.mockReturnValueOnce('jwt-token' as never);

    const result = await register({
      email: 'John@Example.com',
      username: 'John',
      password: 'Password123',
    });

    expect(mockedBcrypt.hash).toHaveBeenCalledWith('Password123', expect.any(Number));
    expect(mockedRepository.createUser).toHaveBeenCalledWith({
      email: 'john@example.com',
      username: 'john',
      passwordHash: 'hashed_password',
    });
    expect(result).toEqual({
      user: {
        id: 'user-1',
        email: 'john@example.com',
        username: 'john',
      },
      accessToken: 'jwt-token',
      tokenType: 'Bearer',
      expiresIn: expect.any(String),
    });
    expect((result as unknown as { passwordHash?: string }).passwordHash).toBeUndefined();
  });

  it('register duplicate email or username throws conflict', async () => {
    mockedRepository.findUserByEmail.mockResolvedValueOnce({
      id: 'existing',
      email: 'john@example.com',
      username: 'john',
      passwordHash: 'hash',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    mockedRepository.findUserByUsername.mockResolvedValueOnce(null);

    await expect(
      register({
        email: 'john@example.com',
        username: 'john',
        password: 'Password123',
      }),
    ).rejects.toMatchObject({
      message: 'Email or username already exists',
      statusCode: 409,
    });
  });

  it('login success returns token payload', async () => {
    mockedRepository.findUserByIdentifier.mockResolvedValueOnce({
      id: 'user-1',
      email: 'john@example.com',
      username: 'john',
      passwordHash: 'stored-hash',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    mockedBcrypt.compare.mockResolvedValueOnce(true as never);
    mockedJwt.sign.mockReturnValueOnce('jwt-login-token' as never);

    const result = await login({
      identifier: 'john',
      password: 'Password123',
    });

    expect(mockedRepository.findUserByIdentifier).toHaveBeenCalledWith('john');
    expect(mockedBcrypt.compare).toHaveBeenCalledWith('Password123', 'stored-hash');
    expect(result.accessToken).toBe('jwt-login-token');
    expect(result.tokenType).toBe('Bearer');
  });

  it('login unknown user returns generic invalid credentials', async () => {
    mockedRepository.findUserByIdentifier.mockResolvedValueOnce(null);

    await expect(login({ identifier: 'missing', password: 'Password123' })).rejects.toMatchObject({
      message: 'Invalid credentials',
      statusCode: 401,
    });
  });

  it('login wrong password returns generic invalid credentials', async () => {
    mockedRepository.findUserByIdentifier.mockResolvedValueOnce({
      id: 'user-1',
      email: 'john@example.com',
      username: 'john',
      passwordHash: 'stored-hash',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    mockedBcrypt.compare.mockResolvedValueOnce(false as never);

    await expect(login({ identifier: 'john', password: 'WrongPassword1' })).rejects.toMatchObject({
      message: 'Invalid credentials',
      statusCode: 401,
    });
  });

  it('token includes expected payload and expiry config', async () => {
    mockedRepository.findUserByEmail.mockResolvedValueOnce(null);
    mockedRepository.findUserByUsername.mockResolvedValueOnce(null);
    mockedHash.mockResolvedValueOnce('hashed_password');
    mockedRepository.createUser.mockResolvedValueOnce({
      id: 'user-42',
      email: 'user@example.com',
      username: 'user42',
      passwordHash: 'hashed_password',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    mockedJwt.sign.mockReturnValueOnce('jwt-token' as never);

    await register({
      email: 'user@example.com',
      username: 'user42',
      password: 'Password123',
    });

    expect(mockedJwt.sign).toHaveBeenCalledWith(
      {
        sub: 'user-42',
        username: 'user42',
      },
      expect.any(String),
      {
        expiresIn: expect.any(String),
      },
    );
  });
});
