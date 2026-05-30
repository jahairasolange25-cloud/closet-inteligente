import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { StorageController } from './storage.controller';
import { StorageService } from './storage.service';
import { OrphanCleanupJob } from './orphan-cleanup.job';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [
    MulterModule.register({
      limits: { fileSize: 50 * 1024 * 1024 },
    }),
    DatabaseModule,
  ],
  controllers: [StorageController],
  providers: [StorageService, OrphanCleanupJob],
  exports: [StorageService, OrphanCleanupJob],
})
export class StorageModule {}
