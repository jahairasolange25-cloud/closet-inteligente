import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { PipelineService } from './pipeline.service';
import { AI_PIPELINE_ADAPTER, SimulatedAIPipelineAdapter } from './ai-pipeline.adapter';
import { HttpAIPipelineAdapter } from './http-ai-pipeline.adapter';

@Module({
  imports: [DatabaseModule],
  providers: [
    PipelineService,
    {
      provide: AI_PIPELINE_ADAPTER,
      useClass:
        process.env.AI_ADAPTER === 'simulated'
          ? SimulatedAIPipelineAdapter
          : HttpAIPipelineAdapter,
    },
  ],
  exports: [PipelineService],
})
export class PipelineModule {}
