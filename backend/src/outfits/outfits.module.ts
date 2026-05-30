import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { WebSocketModule } from '../websocket/websocket.module';
import { OutfitsController } from './outfits.controller';
import { OutfitsService } from './outfits.service';
import { RecommendationService } from './recommendation.service';
import { VectorSearchService } from './vector-search.service';

@Module({
  imports: [DatabaseModule, WebSocketModule],
  controllers: [OutfitsController],
  providers: [OutfitsService, RecommendationService, VectorSearchService],
  exports: [OutfitsService, RecommendationService, VectorSearchService],
})
export class OutfitsModule {}
