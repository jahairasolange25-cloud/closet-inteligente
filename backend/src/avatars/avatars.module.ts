import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { DatabaseModule } from '../database/database.module';
import { StorageModule } from '../storage/storage.module';
import { QueueModule } from '../queue/queue.module';
import { RedisModule } from '../redis/redis.module';
import { WebSocketModule } from '../websocket/websocket.module';
import { AvatarsController } from './avatars.controller';
import { AvatarsService } from './avatars.service';
import { AvatarGenerationService } from './avatar-generation.service';

@Module({
  imports: [
    DatabaseModule,
    StorageModule,
    QueueModule,
    RedisModule,
    WebSocketModule,
    MulterModule.register({
      limits: { fileSize: 200 * 1024 * 1024 },
    }),
  ],
  controllers: [AvatarsController],
  providers: [AvatarsService, AvatarGenerationService],
  exports: [AvatarsService],
})
export class AvatarsModule {}
