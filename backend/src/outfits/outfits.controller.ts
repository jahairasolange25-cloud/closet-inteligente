import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CreateOutfitDto } from './dto/create-outfit.dto';
import { QueryOutfitsDto } from './dto/query-outfits.dto';
import { RecommendOutfitDto } from './dto/recommend-outfit.dto';
import { RecommendationFeedbackDto, RecordWearDto } from './dto/recommendation-feedback.dto';
import { UpdateOutfitDto } from './dto/update-outfit.dto';
import { OutfitsService } from './outfits.service';
import { RecommendationService } from './recommendation.service';
import { VectorSearchService } from './vector-search.service';

@Controller('outfits')
@UseGuards(JwtAuthGuard)
export class OutfitsController {
  constructor(
    private readonly outfitsService: OutfitsService,
    private readonly recommendationService: RecommendationService,
    private readonly vectorSearchService: VectorSearchService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@CurrentUser('id') userId: string, @Body() dto: CreateOutfitDto) {
    return this.outfitsService.create(userId, dto);
  }

  @Post('recommend')
  @HttpCode(HttpStatus.OK)
  async recommend(@CurrentUser('id') userId: string, @Body() dto: RecommendOutfitDto) {
    return this.recommendationService.recommend(userId, {
      excludeGarmentIds: dto.exclude_garment_ids,
      occasion: dto.occasion,
      season: dto.season,
      temperature: dto.temperature,
      count: dto.count,
      preferRecentlyWorn: dto.prefer_recently_worn,
    });
  }

  @Post('recommend/feedback')
  @HttpCode(HttpStatus.OK)
  async recordFeedback(
    @CurrentUser('id') userId: string,
    @Body() dto: RecommendationFeedbackDto,
  ) {
    await this.recommendationService.recordFeedback(userId, {
      outfitId: dto.outfit_id,
      garmentIds: dto.garment_ids,
      action: dto.action,
      confidenceScore: dto.confidence_score,
      sessionId: dto.session_id,
    });
    return { success: true };
  }

  @Post('recommend/metrics')
  @HttpCode(HttpStatus.OK)
  async getRecommendationMetrics(@CurrentUser('id') userId: string) {
    return this.recommendationService.getRecommendationMetrics(userId);
  }

  @Post('wear')
  @HttpCode(HttpStatus.OK)
  async recordWear(
    @CurrentUser('id') userId: string,
    @Body() dto: RecordWearDto,
  ) {
    await this.recommendationService.recordWear(userId, {
      outfitId: dto.outfit_id,
      garmentIds: dto.garment_ids,
      source: dto.source,
    });
    return { success: true };
  }

  @Get('daily')
  @HttpCode(HttpStatus.OK)
  async getDailyOutfit(@CurrentUser('id') userId: string) {
    return this.outfitsService.getDailyOutfit(userId);
  }

  @Get('search/semantic')
  @HttpCode(HttpStatus.OK)
  async semanticSearch(
    @CurrentUser('id') userId: string,
    @Query('q') query: string,
    @Query('type') type?: string,
    @Query('color') color?: string,
  ) {
    return this.vectorSearchService.semanticSearch(userId, [], type, color);
  }

  @Get('search/similar/:garmentId')
  @HttpCode(HttpStatus.OK)
  async findSimilar(
    @CurrentUser('id') userId: string,
    @Param('garmentId', ParseUUIDPipe) garmentId: string,
  ) {
    const garment = await this.outfitsService.findOne(userId, garmentId);
    return this.vectorSearchService.findSimilarByCategory(
      userId,
      garment.garments[0]?.type || '',
    );
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(@CurrentUser('id') userId: string, @Query() query: QueryOutfitsDto) {
    return this.outfitsService.findAll(userId, query);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.outfitsService.findOne(userId, id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOutfitDto,
  ) {
    return this.outfitsService.update(userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.outfitsService.softDelete(userId, id);
  }
}
