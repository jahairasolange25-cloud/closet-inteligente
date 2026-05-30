import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PipelineService } from '../pipeline/pipeline.service';
import { CreateGarmentDto } from './dto/create-garment.dto';
import { QueryGarmentsDto } from './dto/query-garments.dto';
import { SearchGarmentsDto } from './dto/search-garments.dto';
import { UpdateGarmentDto } from './dto/update-garment.dto';
import { GarmentsService } from './garments.service';

@Controller('garments')
@UseGuards(JwtAuthGuard)
export class GarmentsController {
  constructor(
    private readonly garmentsService: GarmentsService,
    private readonly pipelineService: PipelineService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@CurrentUser('id') userId: string, @Body() dto: CreateGarmentDto) {
    return this.garmentsService.create(userId, dto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(@CurrentUser('id') userId: string, @Query() query: QueryGarmentsDto) {
    return this.garmentsService.findAll(userId, query);
  }

  @Get(':id/status')
  @HttpCode(HttpStatus.OK)
  async getStatus(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.garmentsService.findOne(userId, id);
    return this.pipelineService.getPipelineStatus(id);
  }

  @Post(':id/upload')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024, fieldNameSize: 100, fields: 1, parts: 2 } }))
  async upload(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.garmentsService.upload(userId, id, file);
  }

  @Get('search')
  @HttpCode(HttpStatus.OK)
  async search(@CurrentUser('id') userId: string, @Query() dto: SearchGarmentsDto) {
    return this.garmentsService.search(userId, dto);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.garmentsService.findOne(userId, id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateGarmentDto,
  ) {
    return this.garmentsService.update(userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.garmentsService.softDelete(userId, id);
  }
}
