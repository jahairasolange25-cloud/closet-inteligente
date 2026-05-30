import { Module } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { DatabaseModule } from '../database/database.module';
import { RedisModule } from '../redis/redis.module';
import { UsersModule } from '../users/users.module';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [
    DatabaseModule,
    UsersModule,
    RedisModule,
    JwtModule.registerAsync({
      global: true,
      useFactory: () => {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
          throw new Error('JWT_SECRET environment variable is required');
        }
        return {
          secret,
          signOptions: { expiresIn: '15m' },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtAuthGuard,
    {
      provide: 'REFRESH_JWT_SERVICE',
      useFactory: () => {
        const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
        if (!secret) {
          throw new Error('JWT_REFRESH_SECRET or JWT_SECRET environment variable is required');
        }
        if (!process.env.JWT_REFRESH_SECRET && process.env.NODE_ENV !== 'production') {
          console.warn('JWT_REFRESH_SECRET not set, falling back to JWT_SECRET');
        }
        return new JwtService({ secret });
      },
    },
  ],
  exports: [AuthService, JwtAuthGuard],
})
export class AuthModule {}
