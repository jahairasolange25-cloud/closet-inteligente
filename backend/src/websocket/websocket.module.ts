import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { WsAuthGuard } from '../common/guards/ws-auth.guard';
import { DatabaseModule } from '../database/database.module';
import { WebSocketGatewayImpl } from './websocket.gateway';

@Module({
  imports: [
    DatabaseModule,
    JwtModule.registerAsync({
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
  providers: [WebSocketGatewayImpl, WsAuthGuard],
  exports: [WebSocketGatewayImpl, WsAuthGuard],
})
export class WebSocketModule {}
