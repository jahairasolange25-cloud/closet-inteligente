# NestJS Module Creation Example — GarmentModule

> **Purpose:** Reference implementation for creating NestJS modules in the Closet Inteligente Digital project.
> **Pattern:** Module → Controller → Service → Repository → Entity → DTO → Guards → Tests
> **Stack:** NestJS, TypeScript, Prisma, class-validator, Jest

---

## Directory Structure

```
backend/src/modules/garment/
├── controllers/
│   └── garment.controller.ts
│   └── garment.controller.spec.ts
├── services/
│   └── garment.service.ts
│   └── garment.service.spec.ts
├── repositories/
│   └── garment.repository.ts
├── dto/
│   ├── create-garment.dto.ts
│   └── update-garment.dto.ts
├── guards/
│   └── garment-owner.guard.ts
├── interfaces/
│   └── garment.interface.ts
├── garment.module.ts
└── garment.entity.ts
```

---

## File 1: garment.entity.ts

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum GarmentState {
  Pending = 'pending',
  Processing = 'processing',
  Ready = 'ready',
  Archived = 'archived',
  Error = 'error',
}

export enum GarmentType {
  Top = 'top',
  Bottom = 'bottom',
  Outerwear = 'outerwear',
  Footwear = 'footwear',
  Accessory = 'accessory',
  Dress = 'dress',
  FullBody = 'full_body',
}

export enum GarmentCategory {
  TShirt = 't_shirt',
  Blouse = 'blouse',
  Shirt = 'shirt',
  Sweater = 'sweater',
  Hoodie = 'hoodie',
  Jacket = 'jacket',
  Coat = 'coat',
  Jeans = 'jeans',
  Trousers = 'trousers',
  Shorts = 'shorts',
  Skirt = 'skirt',
  Dress = 'dress',
  Sneakers = 'sneakers',
  Boots = 'boots',
  Sandals = 'sandals',
  Hat = 'hat',
  Bag = 'bag',
  Scarf = 'scarf',
  Belt = 'belt',
  Jewelry = 'jewelry',
}

@Entity('garments')
@Index(['userId', 'state'])
@Index(['userId', 'type'])
@Index(['userId', 'category'])
export class Garment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  @Index()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({
    type: 'enum',
    enum: GarmentType,
  })
  type: GarmentType;

  @Column({
    type: 'enum',
    enum: GarmentCategory,
  })
  category: GarmentCategory;

  @Column({
    type: 'enum',
    enum: GarmentState,
    default: GarmentState.Pending,
  })
  state: GarmentState;

  @Column({ length: 100, nullable: true })
  brand: string | null;

  @Column({ length: 50, nullable: true })
  color: string | null;

  @Column({ name: 'color_hex', length: 7, nullable: true })
  colorHex: string | null;

  @Column({ length: 20, nullable: true })
  size: string | null;

  @Column({ type: 'text', nullable: true })
  material: string | null;

  @Column({ name: 'image_url', length: 2048 })
  imageUrl: string;

  @Column({ name: 'thumbnail_url', length: 2048, nullable: true })
  thumbnailUrl: string | null;

  @Column({ name: 'mask_url', length: 2048, nullable: true })
  maskUrl: string | null;

  @Column({ name: 'ai_tags', type: 'jsonb', nullable: true })
  aiTags: Record<string, unknown> | null;

  @Column({ name: 'pipeline_status', type: 'jsonb', nullable: true })
  pipelineStatus: Record<string, unknown> | null;

  @Column({ type: 'int', default: 0 })
  position: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  constructor(partial: Partial<Garment>) {
    Object.assign(this, partial);
  }
}
```

---

## File 2: garment.interface.ts

```typescript
import { GarmentState, GarmentType, GarmentCategory } from '../entities/garment.entity';

export interface GarmentData {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  type: GarmentType;
  category: GarmentCategory;
  state: GarmentState;
  brand: string | null;
  color: string | null;
  colorHex: string | null;
  size: string | null;
  material: string | null;
  imageUrl: string;
  thumbnailUrl: string | null;
  maskUrl: string | null;
  aiTags: Record<string, unknown> | null;
  pipelineStatus: Record<string, unknown> | null;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface GarmentListOptions {
  userId: string;
  type?: GarmentType;
  category?: GarmentCategory;
  state?: GarmentState;
  search?: string;
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export interface StateTransition {
  from: GarmentState;
  to: GarmentState;
  valid: boolean;
}

export const VALID_STATE_TRANSITIONS: Record<GarmentState, GarmentState[]> = {
  [GarmentState.Pending]: [GarmentState.Processing, GarmentState.Archived, GarmentState.Error],
  [GarmentState.Processing]: [GarmentState.Ready, GarmentState.Error],
  [GarmentState.Ready]: [GarmentState.Archived],
  [GarmentState.Archived]: [GarmentState.Ready],
  [GarmentState.Error]: [GarmentState.Processing, GarmentState.Archived],
};

export function isValidStateTransition(from: GarmentState, to: GarmentState): boolean {
  const allowed = VALID_STATE_TRANSITIONS[from];
  if (!allowed) return false;
  return allowed.includes(to);
}
```

---

## File 3: create-garment.dto.ts

```typescript
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsUrl,
  MinLength,
  MaxLength,
  IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GarmentType, GarmentCategory } from '../entities/garment.entity';

export class CreateGarmentDto {
  @ApiProperty({ description: 'Garment name', example: 'Blue Denim Jacket' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ description: 'Garment description' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({ enum: GarmentType, example: GarmentType.Outerwear })
  @IsEnum(GarmentType)
  type: GarmentType;

  @ApiProperty({ enum: GarmentCategory, example: GarmentCategory.Jacket })
  @IsEnum(GarmentCategory)
  category: GarmentCategory;

  @ApiPropertyOptional({ description: 'Brand name', example: 'Levi' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  brand?: string;

  @ApiPropertyOptional({ description: 'Color name', example: 'Blue' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  color?: string;

  @ApiPropertyOptional({ description: 'Hex color code', example: '#1a5c8a' })
  @IsOptional()
  @IsString()
  @MaxLength(7)
  colorHex?: string;

  @ApiPropertyOptional({ description: 'Size', example: 'M' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  size?: string;

  @ApiPropertyOptional({ description: 'Material', example: 'Denim' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  material?: string;

  @ApiProperty({ description: 'Image URL' })
  @IsUrl({ require_tld: false })
  @IsNotEmpty()
  imageUrl: string;

  @ApiPropertyOptional({ description: 'Initial metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
```

---

## File 4: update-garment.dto.ts

```typescript
import {
  IsString,
  IsOptional,
  IsEnum,
  IsUrl,
  MinLength,
  MaxLength,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { GarmentType, GarmentCategory, GarmentState } from '../entities/garment.entity';

class PipelineStatusDto {
  @IsString()
  @IsOptional()
  segmentation?: string;

  @IsString()
  @IsOptional()
  colorAnalysis?: string;

  @IsString()
  @IsOptional()
  tagging?: string;

  @IsString()
  @IsOptional()
  qualityCheck?: string;
}

export class UpdateGarmentDto {
  @ApiPropertyOptional({ description: 'Garment name' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ description: 'Garment description' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ enum: GarmentType })
  @IsOptional()
  @IsEnum(GarmentType)
  type?: GarmentType;

  @ApiPropertyOptional({ enum: GarmentCategory })
  @IsOptional()
  @IsEnum(GarmentCategory)
  category?: GarmentCategory;

  @ApiPropertyOptional({ enum: GarmentState })
  @IsOptional()
  @IsEnum(GarmentState)
  state?: GarmentState;

  @ApiPropertyOptional({ description: 'Brand name' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  brand?: string;

  @ApiPropertyOptional({ description: 'Color name' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  color?: string;

  @ApiPropertyOptional({ description: 'Hex color code' })
  @IsOptional()
  @IsString()
  @MaxLength(7)
  colorHex?: string;

  @ApiPropertyOptional({ description: 'Size' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  size?: string;

  @ApiPropertyOptional({ description: 'Material' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  material?: string;

  @ApiPropertyOptional({ description: 'Image URL' })
  @IsOptional()
  @IsUrl({ require_tld: false })
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'Thumbnail URL' })
  @IsOptional()
  @IsUrl({ require_tld: false })
  thumbnailUrl?: string;

  @ApiPropertyOptional({ description: 'Mask URL' })
  @IsOptional()
  @IsUrl({ require_tld: false })
  maskUrl?: string;

  @ApiPropertyOptional({ description: 'AI tags' })
  @IsOptional()
  @IsObject()
  aiTags?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Pipeline status' })
  @IsOptional()
  @ValidateNested()
  @Type(() => PipelineStatusDto)
  pipelineStatus?: PipelineStatusDto;

  @ApiPropertyOptional({ description: 'Display position' })
  @IsOptional()
  position?: number;
}
```

---

## File 5: garment.repository.ts

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, ILike } from 'typeorm';
import { Logger } from '@nestjs/common';
import { Garment } from '../entities/garment.entity';
import { GarmentListOptions, PaginatedResult } from '../interfaces/garment.interface';

@Injectable()
export class GarmentRepository {
  private readonly logger = new Logger(GarmentRepository.name);

  constructor(
    @InjectRepository(Garment)
    private readonly repo: Repository<Garment>,
  ) {}

  async findById(id: string): Promise<Garment | null> {
    this.logger.debug(`Finding garment by id: ${id}`);
    return this.repo.findOne({ where: { id } });
  }

  async findByIdAndUser(id: string, userId: string): Promise<Garment | null> {
    this.logger.debug(`Finding garment by id: ${id} and userId: ${userId}`);
    return this.repo.findOne({ where: { id, userId } });
  }

  async findAll(options: GarmentListOptions): Promise<PaginatedResult<Garment>> {
    const { userId, type, category, state, search, page, pageSize, sortBy, sortOrder } = options;

    const where: FindOptionsWhere<Garment> = { userId };

    if (type) where.type = type;
    if (category) where.category = category;
    if (state) where.state = state;
    if (search) {
      where.name = ILike(`%${search}%`);
    }

    const order: Record<string, 'asc' | 'desc'> = {};
    if (sortBy) {
      order[sortBy] = sortOrder ?? 'asc';
    } else {
      order.position = 'asc';
      order.createdAt = 'desc';
    }

    const skip = (page - 1) * pageSize;

    const [data, total] = await this.repo.findAndCount({
      where,
      order,
      skip,
      take: pageSize,
    });

    const totalPages = Math.ceil(total / pageSize);

    return {
      data,
      meta: {
        page,
        pageSize,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
    };
  }

  async create(garment: Partial<Garment>): Promise<Garment> {
    this.logger.debug(`Creating garment: ${garment.name}`);
    const entity = this.repo.create(garment);
    return this.repo.save(entity);
  }

  async update(id: string, data: Partial<Garment>): Promise<Garment | null> {
    this.logger.debug(`Updating garment: ${id}`);
    await this.repo.update(id, data);
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    this.logger.debug(`Deleting garment: ${id}`);
    const result = await this.repo.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async countByUser(userId: string): Promise<number> {
    return this.repo.count({ where: { userId } });
  }

  async countByUserAndState(userId: string, state: Garment['state']): Promise<number> {
    return this.repo.count({ where: { userId, state } });
  }
}
```

---

## File 6: garment.service.ts

```typescript
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { GarmentRepository } from '../repositories/garment.repository';
import { Garment, GarmentState } from '../entities/garment.entity';
import {
  GarmentData,
  GarmentListOptions,
  PaginatedResult,
  isValidStateTransition,
} from '../interfaces/garment.interface';
import { CreateGarmentDto } from '../dto/create-garment.dto';
import { UpdateGarmentDto } from '../dto/update-garment.dto';

@Injectable()
export class GarmentService {
  private readonly logger = new Logger(GarmentService.name);

  constructor(
    private readonly garmentRepository: GarmentRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async getGarment(id: string, userId: string): Promise<GarmentData> {
    this.logger.log(`Getting garment ${id} for user ${userId}`);

    const garment = await this.garmentRepository.findByIdAndUser(id, userId);
    if (!garment) {
      throw new NotFoundException(`Garment with id "${id}" not found`);
    }

    return this.toData(garment);
  }

  async listGarments(options: GarmentListOptions): Promise<PaginatedResult<GarmentData>> {
    this.logger.log(`Listing garments for user ${options.userId}`);

    const result = await this.garmentRepository.findAll(options);

    return {
      data: result.data.map((g) => this.toData(g)),
      meta: result.meta,
    };
  }

  async createGarment(
    userId: string,
    dto: CreateGarmentDto,
  ): Promise<GarmentData> {
    this.logger.log(`Creating garment for user ${userId}: ${dto.name}`);

    const existingCount = await this.garmentRepository.countByUser(userId);
    if (existingCount >= 1000) {
      throw new BadRequestException('Maximum garment limit (1000) reached');
    }

    const garment = await this.garmentRepository.create({
      userId,
      name: dto.name,
      description: dto.description ?? null,
      type: dto.type,
      category: dto.category,
      brand: dto.brand ?? null,
      color: dto.color ?? null,
      colorHex: dto.colorHex ?? null,
      size: dto.size ?? null,
      material: dto.material ?? null,
      imageUrl: dto.imageUrl,
      state: GarmentState.Pending,
      position: existingCount,
    });

    this.eventEmitter.emit('garment:created', {
      garmentId: garment.id,
      userId,
      timestamp: new Date(),
    });

    this.logger.log(`Garment created: ${garment.id}`);
    return this.toData(garment);
  }

  async updateGarment(
    id: string,
    userId: string,
    dto: UpdateGarmentDto,
  ): Promise<GarmentData> {
    this.logger.log(`Updating garment ${id} for user ${userId}`);

    const garment = await this.garmentRepository.findByIdAndUser(id, userId);
    if (!garment) {
      throw new NotFoundException(`Garment with id "${id}" not found`);
    }

    if (dto.state !== undefined && dto.state !== garment.state) {
      if (!isValidStateTransition(garment.state, dto.state)) {
        throw new BadRequestException(
          `Invalid state transition from "${garment.state}" to "${dto.state}"`,
        );
      }
    }

    const updateData: Partial<Garment> = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.type !== undefined) updateData.type = dto.type;
    if (dto.category !== undefined) updateData.category = dto.category;
    if (dto.state !== undefined) updateData.state = dto.state;
    if (dto.brand !== undefined) updateData.brand = dto.brand;
    if (dto.color !== undefined) updateData.color = dto.color;
    if (dto.colorHex !== undefined) updateData.colorHex = dto.colorHex;
    if (dto.size !== undefined) updateData.size = dto.size;
    if (dto.material !== undefined) updateData.material = dto.material;
    if (dto.imageUrl !== undefined) updateData.imageUrl = dto.imageUrl;
    if (dto.thumbnailUrl !== undefined) updateData.thumbnailUrl = dto.thumbnailUrl;
    if (dto.maskUrl !== undefined) updateData.maskUrl = dto.maskUrl;
    if (dto.aiTags !== undefined) updateData.aiTags = dto.aiTags;
    if (dto.pipelineStatus !== undefined) updateData.pipelineStatus = dto.pipelineStatus;
    if (dto.position !== undefined) updateData.position = dto.position;

    const updated = await this.garmentRepository.update(id, updateData);
    if (!updated) {
      throw new NotFoundException(`Garment with id "${id}" not found after update`);
    }

    this.eventEmitter.emit('garment:updated', {
      garmentId: id,
      userId,
      changes: Object.keys(updateData),
      timestamp: new Date(),
    });

    this.logger.log(`Garment updated: ${id}`);
    return this.toData(updated);
  }

  async deleteGarment(id: string, userId: string): Promise<void> {
    this.logger.log(`Deleting garment ${id} for user ${userId}`);

    const garment = await this.garmentRepository.findByIdAndUser(id, userId);
    if (!garment) {
      throw new NotFoundException(`Garment with id "${id}" not found`);
    }

    const deleted = await this.garmentRepository.delete(id);
    if (!deleted) {
      throw new ConflictException(`Failed to delete garment ${id}`);
    }

    this.eventEmitter.emit('garment:deleted', {
      garmentId: id,
      userId,
      timestamp: new Date(),
    });

    this.logger.log(`Garment deleted: ${id}`);
  }

  async updateGarmentState(
    id: string,
    userId: string,
    newState: GarmentState,
  ): Promise<GarmentData> {
    this.logger.log(`Updating garment ${id} state to ${newState}`);

    const garment = await this.garmentRepository.findByIdAndUser(id, userId);
    if (!garment) {
      throw new NotFoundException(`Garment with id "${id}" not found`);
    }

    if (!isValidStateTransition(garment.state, newState)) {
      throw new BadRequestException(
        `Cannot transition from "${garment.state}" to "${newState}"`,
      );
    }

    const updated = await this.garmentRepository.update(id, { state: newState });
    if (!updated) {
      throw new ConflictException(`Failed to update garment ${id} state`);
    }

    this.eventEmitter.emit('garment:state:changed', {
      garmentId: id,
      userId,
      from: garment.state,
      to: newState,
      timestamp: new Date(),
    });

    return this.toData(updated);
  }

  async getGarmentCount(userId: string): Promise<{ total: number; byState: Record<string, number> }> {
    const total = await this.garmentRepository.countByUser(userId);
    const states = Object.values(GarmentState);
    const byState: Record<string, number> = {};

    for (const state of states) {
      byState[state] = await this.garmentRepository.countByUserAndState(userId, state);
    }

    return { total, byState };
  }

  private toData(garment: Garment): GarmentData {
    return {
      id: garment.id,
      userId: garment.userId,
      name: garment.name,
      description: garment.description,
      type: garment.type,
      category: garment.category,
      state: garment.state,
      brand: garment.brand,
      color: garment.color,
      colorHex: garment.colorHex,
      size: garment.size,
      material: garment.material,
      imageUrl: garment.imageUrl,
      thumbnailUrl: garment.thumbnailUrl,
      maskUrl: garment.maskUrl,
      aiTags: garment.aiTags,
      pipelineStatus: garment.pipelineStatus,
      position: garment.position,
      createdAt: garment.createdAt,
      updatedAt: garment.updatedAt,
    };
  }
}
```

---

## File 7: garment-owner.guard.ts

```typescript
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Garment } from '../entities/garment.entity';

@Injectable()
export class GarmentOwnerGuard implements CanActivate {
  constructor(
    @InjectRepository(Garment)
    private readonly garmentRepository: Repository<Garment>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;
    const garmentId = request.params.id;

    if (!userId || !garmentId) {
      return false;
    }

    const garment = await this.garmentRepository.findOne({
      where: { id: garmentId, userId },
    });

    if (!garment) {
      throw new NotFoundException(`Garment with id "${garmentId}" not found`);
    }

    request.garment = garment;
    return true;
  }
}
```

---

## File 8: garment.controller.ts

```typescript
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Logger } from '@nestjs/common';
import { GarmentService } from '../services/garment.service';
import { CreateGarmentDto } from '../dto/create-garment.dto';
import { UpdateGarmentDto } from '../dto/update-garment.dto';
import { GarmentOwnerGuard } from '../guards/garment-owner.guard';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { GarmentState } from '../entities/garment.entity';

@ApiTags('Garments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'garments', version: '1' })
export class GarmentController {
  private readonly logger = new Logger(GarmentController.name);

  constructor(private readonly garmentService: GarmentService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new garment' })
  @ApiResponse({ status: 201, description: 'Garment created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateGarmentDto,
  ) {
    this.logger.log(`POST /garments - user: ${userId}`);
    const garment = await this.garmentService.createGarment(userId, dto);
    return { data: garment, meta: { timestamp: new Date().toISOString() } };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List garments with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Garments retrieved successfully' })
  async findAll(
    @CurrentUser('id') userId: string,
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '20',
    @Query('type') type?: string,
    @Query('category') category?: string,
    @Query('state') state?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    this.logger.log(`GET /garments - user: ${userId}, page: ${page}`);

    const result = await this.garmentService.listGarments({
      userId,
      type: type as any,
      category: category as any,
      state: state as any,
      search,
      page: Math.max(1, parseInt(page, 10) || 1),
      pageSize: Math.min(100, Math.max(1, parseInt(pageSize, 10) || 20)),
      sortBy,
      sortOrder,
    });

    return result;
  }

  @Get('count')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get garment count by state' })
  async getCount(@CurrentUser('id') userId: string) {
    this.logger.log(`GET /garments/count - user: ${userId}`);
    const counts = await this.garmentService.getGarmentCount(userId);
    return { data: counts };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get garment by ID' })
  @ApiResponse({ status: 200, description: 'Garment found' })
  @ApiResponse({ status: 404, description: 'Garment not found' })
  async findOne(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    this.logger.log(`GET /garments/${id} - user: ${userId}`);
    const garment = await this.garmentService.getGarment(id, userId);
    return { data: garment };
  }

  @Patch(':id')
  @UseGuards(GarmentOwnerGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update garment' })
  @ApiResponse({ status: 200, description: 'Garment updated successfully' })
  @ApiResponse({ status: 400, description: 'Validation error or invalid state transition' })
  @ApiResponse({ status: 404, description: 'Garment not found' })
  async update(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateGarmentDto,
  ) {
    this.logger.log(`PATCH /garments/${id} - user: ${userId}`);
    const garment = await this.garmentService.updateGarment(id, userId, dto);
    return { data: garment };
  }

  @Patch(':id/state')
  @UseGuards(GarmentOwnerGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update garment state' })
  async updateState(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('state') state: GarmentState,
  ) {
    this.logger.log(`PATCH /garments/${id}/state - user: ${userId}, state: ${state}`);
    const garment = await this.garmentService.updateGarmentState(id, userId, state);
    return { data: garment };
  }

  @Delete(':id')
  @UseGuards(GarmentOwnerGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete garment' })
  @ApiResponse({ status: 204, description: 'Garment deleted successfully' })
  @ApiResponse({ status: 404, description: 'Garment not found' })
  async remove(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    this.logger.log(`DELETE /garments/${id} - user: ${userId}`);
    await this.garmentService.deleteGarment(id, userId);
  }
}
```

---

## File 9: garment.module.ts

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { GarmentController } from './controllers/garment.controller';
import { GarmentService } from './services/garment.service';
import { GarmentRepository } from './repositories/garment.repository';
import { Garment } from './entities/garment.entity';
import { GarmentOwnerGuard } from './guards/garment-owner.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Garment]),
    EventEmitterModule,
  ],
  controllers: [GarmentController],
  providers: [
    GarmentService,
    GarmentRepository,
    GarmentOwnerGuard,
  ],
  exports: [GarmentService, GarmentRepository],
})
export class GarmentModule {}
```

---

## File 10: garment.service.spec.ts

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { GarmentService } from './garment.service';
import { GarmentRepository } from '../repositories/garment.repository';
import { Garment, GarmentState, GarmentType, GarmentCategory } from '../entities/garment.entity';

describe('GarmentService', () => {
  let service: GarmentService;
  let repository: jest.Mocked<GarmentRepository>;
  let eventEmitter: jest.Mocked<EventEmitter2>;

  const mockGarment: Garment = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    userId: 'user-1',
    name: 'Blue Denim Jacket',
    description: 'A stylish blue denim jacket',
    type: GarmentType.Outerwear,
    category: GarmentCategory.Jacket,
    state: GarmentState.Pending,
    brand: 'Levi',
    color: 'Blue',
    colorHex: '#1a5c8a',
    size: 'M',
    material: 'Denim',
    imageUrl: 'https://example.com/jacket.jpg',
    thumbnailUrl: null,
    maskUrl: null,
    aiTags: null,
    pipelineStatus: null,
    position: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    user: null as any,
  };

  beforeEach(async () => {
    const repositoryMock = {
      findById: jest.fn(),
      findByIdAndUser: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      countByUser: jest.fn(),
      countByUserAndState: jest.fn(),
    };

    const eventEmitterMock = {
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GarmentService,
        { provide: GarmentRepository, useValue: repositoryMock },
        { provide: EventEmitter2, useValue: eventEmitterMock },
      ],
    }).compile();

    service = module.get<GarmentService>(GarmentService);
    repository = module.get(GarmentRepository) as jest.Mocked<GarmentRepository>;
    eventEmitter = module.get(EventEmitter2) as jest.Mocked<EventEmitter2>;
  });

  describe('getGarment', () => {
    it('should return garment when found and owned by user', async () => {
      repository.findByIdAndUser.mockResolvedValue(mockGarment);

      const result = await service.getGarment(mockGarment.id, mockGarment.userId);

      expect(result.id).toEqual(mockGarment.id);
      expect(result.name).toEqual(mockGarment.name);
      expect(repository.findByIdAndUser).toHaveBeenCalledWith(
        mockGarment.id,
        mockGarment.userId,
      );
    });

    it('should throw NotFoundException when garment not found', async () => {
      repository.findByIdAndUser.mockResolvedValue(null);

      await expect(
        service.getGarment('nonexistent', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when garment belongs to different user', async () => {
      repository.findByIdAndUser.mockResolvedValue(null);

      await expect(
        service.getGarment(mockGarment.id, 'other-user'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('createGarment', () => {
    const createDto = {
      name: 'New Jacket',
      type: GarmentType.Outerwear,
      category: GarmentCategory.Jacket,
      imageUrl: 'https://example.com/new.jpg',
      brand: 'Nike',
      color: 'Black',
    };

    it('should create a garment successfully', async () => {
      repository.countByUser.mockResolvedValue(5);
      repository.create.mockResolvedValue({
        ...mockGarment,
        id: 'new-id',
        name: createDto.name,
        brand: createDto.brand,
        color: createDto.color,
        position: 5,
        state: GarmentState.Pending,
      });

      const result = await service.createGarment('user-1', createDto as any);

      expect(result.name).toEqual(createDto.name);
      expect(result.state).toEqual(GarmentState.Pending);
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          name: createDto.name,
          state: GarmentState.Pending,
        }),
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'garment:created',
        expect.objectContaining({
          garmentId: 'new-id',
          userId: 'user-1',
        }),
      );
    });

    it('should throw BadRequestException when limit reached', async () => {
      repository.countByUser.mockResolvedValue(1000);

      await expect(
        service.createGarment('user-1', createDto as any),
      ).rejects.toThrow(BadRequestException);

      expect(repository.create).not.toHaveBeenCalled();
    });
  });

  describe('updateGarment', () => {
    it('should update garment fields successfully', async () => {
      repository.findByIdAndUser.mockResolvedValue(mockGarment);
      repository.update.mockResolvedValue({
        ...mockGarment,
        name: 'Updated Name',
        brand: 'New Brand',
      });

      const result = await service.updateGarment(mockGarment.id, mockGarment.userId, {
        name: 'Updated Name',
        brand: 'New Brand',
      });

      expect(result.name).toEqual('Updated Name');
      expect(result.brand).toEqual('New Brand');
      expect(repository.update).toHaveBeenCalledWith(
        mockGarment.id,
        expect.objectContaining({
          name: 'Updated Name',
          brand: 'New Brand',
        }),
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'garment:updated',
        expect.objectContaining({
          garmentId: mockGarment.id,
          changes: expect.arrayContaining(['name', 'brand']),
        }),
      );
    });

    it('should reject invalid state transitions', async () => {
      repository.findByIdAndUser.mockResolvedValue({
        ...mockGarment,
        state: GarmentState.Ready,
      });

      await expect(
        service.updateGarment(mockGarment.id, mockGarment.userId, {
          state: GarmentState.Pending,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when garment not found', async () => {
      repository.findByIdAndUser.mockResolvedValue(null);

      await expect(
        service.updateGarment('nonexistent', 'user-1', { name: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteGarment', () => {
    it('should delete garment successfully', async () => {
      repository.findByIdAndUser.mockResolvedValue(mockGarment);
      repository.delete.mockResolvedValue(true);

      await service.deleteGarment(mockGarment.id, mockGarment.userId);

      expect(repository.delete).toHaveBeenCalledWith(mockGarment.id);
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'garment:deleted',
        expect.objectContaining({ garmentId: mockGarment.id }),
      );
    });

    it('should throw NotFoundException when garment not found', async () => {
      repository.findByIdAndUser.mockResolvedValue(null);

      await expect(
        service.deleteGarment('nonexistent', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when delete fails', async () => {
      repository.findByIdAndUser.mockResolvedValue(mockGarment);
      repository.delete.mockResolvedValue(false);

      await expect(
        service.deleteGarment(mockGarment.id, mockGarment.userId),
      ).rejects.toThrow(expect.objectContaining({
        response: expect.objectContaining({ statusCode: 409 }),
      }));
    });
  });

  describe('updateGarmentState', () => {
    it('should transition state correctly', async () => {
      repository.findByIdAndUser.mockResolvedValue({
        ...mockGarment,
        state: GarmentState.Pending,
      });
      repository.update.mockResolvedValue({
        ...mockGarment,
        state: GarmentState.Processing,
      });

      const result = await service.updateGarmentState(
        mockGarment.id,
        mockGarment.userId,
        GarmentState.Processing,
      );

      expect(result.state).toEqual(GarmentState.Processing);
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'garment:state:changed',
        expect.objectContaining({
          from: GarmentState.Pending,
          to: GarmentState.Processing,
        }),
      );
    });

    it('should reject invalid transition', async () => {
      repository.findByIdAndUser.mockResolvedValue({
        ...mockGarment,
        state: GarmentState.Processing,
      });

      await expect(
        service.updateGarmentState(
          mockGarment.id,
          mockGarment.userId,
          GarmentState.Pending,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
```

---

## File 11: garment.controller.spec.ts

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { GarmentController } from './garment.controller';
import { GarmentService } from '../services/garment.service';
import { GarmentState, GarmentType, GarmentCategory } from '../entities/garment.entity';

describe('GarmentController', () => {
  let controller: GarmentController;
  let service: jest.Mocked<GarmentService>;

  const mockGarmentData = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    userId: 'user-1',
    name: 'Blue Denim Jacket',
    description: null,
    type: GarmentType.Outerwear,
    category: GarmentCategory.Jacket,
    state: GarmentState.Pending,
    brand: null,
    color: null,
    colorHex: null,
    size: null,
    material: null,
    imageUrl: 'https://example.com/jacket.jpg',
    thumbnailUrl: null,
    maskUrl: null,
    aiTags: null,
    pipelineStatus: null,
    position: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPaginatedResult = {
    data: [mockGarmentData],
    meta: {
      page: 1,
      pageSize: 20,
      total: 1,
      totalPages: 1,
      hasNext: false,
      hasPrevious: false,
    },
  };

  beforeEach(async () => {
    const serviceMock = {
      getGarment: jest.fn(),
      listGarments: jest.fn(),
      createGarment: jest.fn(),
      updateGarment: jest.fn(),
      deleteGarment: jest.fn(),
      updateGarmentState: jest.fn(),
      getGarmentCount: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GarmentController],
      providers: [
        { provide: GarmentService, useValue: serviceMock },
      ],
    }).compile();

    controller = module.get<GarmentController>(GarmentController);
    service = module.get(GarmentService) as jest.Mocked<GarmentService>;
  });

  describe('create', () => {
    it('should create a garment and return response', async () => {
      const dto = {
        name: 'New Jacket',
        type: GarmentType.Outerwear,
        category: GarmentCategory.Jacket,
        imageUrl: 'https://example.com/new.jpg',
      };

      service.createGarment.mockResolvedValue(mockGarmentData);

      const result = await controller.create('user-1', dto as any);

      expect(result.data).toEqual(mockGarmentData);
      expect(result.meta.timestamp).toBeDefined();
      expect(service.createGarment).toHaveBeenCalledWith('user-1', dto);
    });
  });

  describe('findAll', () => {
    it('should return paginated garments', async () => {
      service.listGarments.mockResolvedValue(mockPaginatedResult);

      const result = await controller.findAll('user-1');

      expect(result.data).toHaveLength(1);
      expect(result.meta.page).toEqual(1);
      expect(service.listGarments).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user-1', page: 1, pageSize: 20 }),
      );
    });

    it('should pass query parameters as filters', async () => {
      service.listGarments.mockResolvedValue(mockPaginatedResult);

      await controller.findAll(
        'user-1',
        '2',
        '10',
        GarmentType.Outerwear,
        GarmentCategory.Jacket,
        GarmentState.Ready,
        'jacket',
        'name',
        'asc',
      );

      expect(service.listGarments).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          page: 2,
          pageSize: 10,
          type: GarmentType.Outerwear,
          category: GarmentCategory.Jacket,
          state: GarmentState.Ready,
          search: 'jacket',
          sortBy: 'name',
          sortOrder: 'asc',
        }),
      );
    });

    it('should clamp page and pageSize to valid ranges', async () => {
      service.listGarments.mockResolvedValue(mockPaginatedResult);

      await controller.findAll('user-1', '0', '200');

      expect(service.listGarments).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, pageSize: 100 }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a single garment', async () => {
      service.getGarment.mockResolvedValue(mockGarmentData);

      const result = await controller.findOne('user-1', mockGarmentData.id);

      expect(result.data).toEqual(mockGarmentData);
      expect(service.getGarment).toHaveBeenCalledWith(mockGarmentData.id, 'user-1');
    });
  });

  describe('update', () => {
    it('should update and return the garment', async () => {
      const dto = { name: 'Updated Name' };
      const updated = { ...mockGarmentData, name: 'Updated Name' };
      service.updateGarment.mockResolvedValue(updated);

      const result = await controller.update('user-1', mockGarmentData.id, dto);

      expect(result.data.name).toEqual('Updated Name');
      expect(service.updateGarment).toHaveBeenCalledWith(
        mockGarmentData.id,
        'user-1',
        dto,
      );
    });
  });

  describe('updateState', () => {
    it('should update state and return garment', async () => {
      const updated = { ...mockGarmentData, state: GarmentState.Processing };
      service.updateGarmentState.mockResolvedValue(updated);

      const result = await controller.updateState(
        'user-1',
        mockGarmentData.id,
        GarmentState.Processing,
      );

      expect(result.data.state).toEqual(GarmentState.Processing);
      expect(service.updateGarmentState).toHaveBeenCalledWith(
        mockGarmentData.id,
        'user-1',
        GarmentState.Processing,
      );
    });
  });

  describe('remove', () => {
    it('should delete garment and return void', async () => {
      service.deleteGarment.mockResolvedValue(undefined);

      await controller.remove('user-1', mockGarmentData.id);

      expect(service.deleteGarment).toHaveBeenCalledWith(
        mockGarmentData.id,
        'user-1',
      );
    });
  });

  describe('getCount', () => {
    it('should return garment counts', async () => {
      const counts = { total: 10, byState: { pending: 5, ready: 5 } };
      service.getGarmentCount.mockResolvedValue(counts);

      const result = await controller.getCount('user-1');

      expect(result.data).toEqual(counts);
    });
  });
});
```

---

## Key Patterns Demonstrated

| Pattern | Implementation |
|---------|---------------|
| **Dependency Injection** | Constructor injection via `@Injectable()` decorators |
| **DTO Validation** | `class-validator` decorators on DTOs with `ValidationPipe` |
| **Service-Repository Pattern** | `GarmentService` → `GarmentRepository` → TypeORM |
| **Controller Routing** | RESTful endpoints with `@Controller`, `@Get`, `@Post`, etc. |
| **Error Handling** | Typed exceptions (`NotFoundException`, `BadRequestException`) |
| **Guards** | `@UseGuards(JwtAuthGuard)` for auth, `GarmentOwnerGuard` for ownership |
| **Event Emission** | `EventEmitter2` for decoupled event-driven communication |
| **Swagger/OpenAPI** | `@ApiTags`, `@ApiOperation`, `@ApiResponse` decorators |
| **Logging** | `Logger` from NestJS common with context |
| **Testing** | Jest with mocked repository and event emitter |
