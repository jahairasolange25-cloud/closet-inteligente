import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { UpdateConsentDto } from './dto/update-consent.dto';

const CONSENT_TTL = 365 * 24 * 3600;

const DEFAULTS: Record<string, any> = {
  ai_processing: true,
  data_sharing: false,
  marketing_emails: false,
  third_party_integrations: false,
  consent_version: null,
};

@Injectable()
export class ConsentService {
  constructor(private readonly redisService: RedisService) {}

  async getConsent(userId: string): Promise<any> {
    const raw = await this.redisService.get<string>(`consent:${userId}`);

    if (!raw) {
      return { ...DEFAULTS, updated_at: null };
    }

    const data = JSON.parse(raw);
    return { ...DEFAULTS, ...data };
  }

  async updateConsent(userId: string, dto: UpdateConsentDto): Promise<any> {
    const raw = await this.redisService.get<string>(`consent:${userId}`);
    const current = raw ? JSON.parse(raw) : {};

    if (dto.ai_processing !== undefined) current.ai_processing = dto.ai_processing;
    if (dto.data_sharing !== undefined) current.data_sharing = dto.data_sharing;
    if (dto.marketing_emails !== undefined) current.marketing_emails = dto.marketing_emails;
    if (dto.third_party_integrations !== undefined) current.third_party_integrations = dto.third_party_integrations;
    if (dto.consent_version !== undefined) current.consent_version = dto.consent_version;

    current.updated_at = new Date().toISOString();

    await this.redisService.set(`consent:${userId}`, JSON.stringify(current), CONSENT_TTL);

    return { ...DEFAULTS, ...current };
  }
}
