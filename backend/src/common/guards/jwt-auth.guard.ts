import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { createHash } from 'crypto';
import { RedisService } from '../../redis/redis.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('MISSING_TOKEN');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);

      if (!payload.sub || !payload.email) {
        throw new UnauthorizedException('INVALID_TOKEN');
      }

      const tokenHash = createHash('sha256').update(token).digest('hex');
      const isBlacklisted = await this.redisService.isTokenBlacklisted(tokenHash);
      if (isBlacklisted) {
        throw new UnauthorizedException('TOKEN_REVOKED');
      }

      request.user = { id: payload.sub, email: payload.email };
      return true;
    } catch (error: any) {
      if (error?.name === 'TokenExpiredError') {
        throw new UnauthorizedException('TOKEN_EXPIRED');
      }
      if (error?.name === 'JsonWebTokenError' || error?.name === 'NotBeforeError') {
        throw new UnauthorizedException('INVALID_TOKEN');
      }
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('INVALID_TOKEN');
    }
  }

  private extractTokenFromHeader(request: Request): string | null {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return null;
    }
    const [type, token] = authHeader.split(' ');
    if (type?.toLowerCase() !== 'bearer' || !token) {
      return null;
    }
    return token.trim();
  }
}
