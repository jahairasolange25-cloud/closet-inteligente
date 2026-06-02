import { Module } from '@nestjs/common';
import { RedisModule } from '../redis/redis.module';
import { CascadeService } from './cascade.service';

@Module({
  imports: [RedisModule],
  providers: [CascadeService],
  exports: [CascadeService],
})
export class AiModule {}
