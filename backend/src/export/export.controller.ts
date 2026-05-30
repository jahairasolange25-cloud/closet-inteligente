import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ExportRequestDto } from './dto/export-request.dto';
import { ExportService } from './export.service';

@Controller('export')
@UseGuards(JwtAuthGuard)
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Post('data')
  @HttpCode(HttpStatus.CREATED)
  async requestExport(@CurrentUser('id') userId: string, @Body() dto: ExportRequestDto) {
    return this.exportService.requestExport(userId, dto);
  }

  @Get('status/:id')
  @HttpCode(HttpStatus.OK)
  async getExportStatus(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.exportService.getExportStatus(id, userId);
  }
}
