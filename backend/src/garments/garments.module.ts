import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { DatabaseModule } from '../database/database.module';
import { PipelineModule } from '../pipeline/pipeline.module';
import { StorageModule } from '../storage/storage.module';
import { WebSocketModule } from '../websocket/websocket.module';
import { GarmentsController } from './garments.controller';
import { GarmentsService } from './garments.service';

@Module({
  imports: [
    DatabaseModule,
    PipelineModule,
    StorageModule,
    WebSocketModule,
    MulterModule.register({
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  ],
  controllers: [GarmentsController],
  providers: [GarmentsService],
  exports: [GarmentsService],
})
export class GarmentsModule {}
