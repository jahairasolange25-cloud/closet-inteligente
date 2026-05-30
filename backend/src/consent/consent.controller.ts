import { Body, Controller, Get, HttpCode, HttpStatus, Patch, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ConsentService } from './consent.service';
import { UpdateConsentDto } from './dto/update-consent.dto';

@Controller('consent')
@UseGuards(JwtAuthGuard)
export class ConsentController {
  constructor(private readonly consentService: ConsentService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getConsent(@CurrentUser('id') userId: string) {
    return this.consentService.getConsent(userId);
  }

  @Patch()
  @HttpCode(HttpStatus.OK)
  async updateConsent(@CurrentUser('id') userId: string, @Body() dto: UpdateConsentDto) {
    return this.consentService.updateConsent(userId, dto);
  }
}
