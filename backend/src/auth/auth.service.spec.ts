import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { RedisService } from '../redis/redis.service';
import { DATABASE_POOL } from '../database/database.module';

const mockPool = {
  query: jest.fn(),
};

const mockUsersService = {
  findByEmail: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  updateProfile: jest.fn(),
  toSafeUser: jest.fn((u) => ({ id: u.id, email: u.email, name: u.name })),
};

const mockRedisService = {
  isTokenBlacklisted: jest.fn().mockResolvedValue(false),
  blacklistToken: jest.fn().mockResolvedValue(undefined),
  revokeAllUserTokens: jest.fn().mockResolvedValue(undefined),
  incrementTokenVersion: jest.fn().mockResolvedValue(1),
};

const mockJwtService = {
  sign: jest.fn().mockReturnValue('mock.access.token'),
  verifyAsync: jest.fn(),
  decode: jest.fn(),
};

const mockRefreshJwtService = {
  sign: jest.fn().mockReturnValue('mock.refresh.token'),
  verifyAsync: jest.fn(),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: mockJwtService },
        { provide: 'REFRESH_JWT_SERVICE', useValue: mockRefreshJwtService },
        { provide: UsersService, useValue: mockUsersService },
        { provide: RedisService, useValue: mockRedisService },
        { provide: DATABASE_POOL, useValue: mockPool },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('throws ConflictException if email already registered', async () => {
      mockUsersService.findByEmail.mockResolvedValue({ id: '1', email: 'test@test.com' });

      await expect(
        service.register({ email: 'test@test.com', password: 'pass123!', name: 'Test' }),
      ).rejects.toThrow(ConflictException);
    });

    it('returns auth response on successful registration', async () => {
      const newUser = { id: 'uuid-1', email: 'new@test.com', password_hash: 'hash', name: 'New User' };
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.create.mockResolvedValue(newUser);

      const result = await service.register({
        email: 'new@test.com',
        password: 'StrongPass1!',
        name: 'New User',
      });

      expect(result).toHaveProperty('tokens.accessToken');
      expect(result).toHaveProperty('tokens.refreshToken');
      expect(result).toHaveProperty('user');
    });
  });

  describe('login', () => {
    it('throws UnauthorizedException for invalid credentials', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockPool.query.mockResolvedValue({ rows: [] });

      await expect(
        service.login({ email: 'bad@test.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('returns success and revokes user tokens', async () => {
      mockJwtService.decode.mockReturnValue({ exp: Math.floor(Date.now() / 1000) + 900 });

      const result = await service.logout('user-id', 'some.access.token');

      expect(result).toEqual({ success: true });
      expect(mockRedisService.revokeAllUserTokens).toHaveBeenCalledWith('user-id');
    });
  });
});
