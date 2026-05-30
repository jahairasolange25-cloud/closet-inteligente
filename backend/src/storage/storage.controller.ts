import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Post, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { DeleteFileDto } from './dto/delete-file.dto';
import { SignedUrlDto } from './dto/signed-url.dto';
import { UploadFileDto } from './dto/upload-file.dto';
import { StorageService } from './storage.service';
import { OrphanCleanupJob } from './orphan-cleanup.job';

@Controller('storage')
@UseGuards(JwtAuthGuard)
export class StorageController {
  constructor(
    private readonly storageService: StorageService,
    private readonly orphanCleanupJob: OrphanCleanupJob,
  ) {}

  @Get('signed-url')
  @HttpCode(HttpStatus.OK)
  async getSignedUrl(@Query() dto: SignedUrlDto) {
    return this.storageService.generateSignedUrl(dto.public_id, dto.expires_in, dto.preset);
  }

  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 50 * 1024 * 1024, fieldNameSize: 100, fields: 1, parts: 2 } }))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadFileDto,
  ) {
    return this.storageService.upload(file, dto.folder, dto.transforms);
  }

  @Delete('delete')
  @HttpCode(HttpStatus.OK)
  async delete(@Body() dto: DeleteFileDto) {
    return this.storageService.delete(dto.public_id);
  }

  @Post('admin/orphan-cleanup')
  @HttpCode(HttpStatus.OK)
  async triggerOrphanCleanup() {
    return this.orphanCleanupJob.run();
  }
}
