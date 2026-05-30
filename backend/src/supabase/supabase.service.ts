import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private readonly logger = new Logger(SupabaseService.name);
  private publicClient!: SupabaseClient;
  private adminClient!: SupabaseClient;

  onModuleInit(): void {
    const url = process.env.SUPABASE_URL;
    const anonKey = process.env.SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !anonKey) {
      this.logger.warn(
        'SUPABASE_URL or SUPABASE_ANON_KEY not set — Supabase client disabled. ' +
        'Storage and auth features requiring Supabase will be unavailable.',
      );
      return;
    }

    this.publicClient = createClient(url, anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: true,
      },
    });

    if (serviceRoleKey) {
      this.adminClient = createClient(url, serviceRoleKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
    } else {
      this.logger.warn('SUPABASE_SERVICE_ROLE_KEY not set, admin client will not be available');
    }

    this.logger.log('Supabase clients initialized');
  }

  getPublicClient(): SupabaseClient {
    if (!this.publicClient) {
      throw new Error('Supabase public client not available: SUPABASE_URL and SUPABASE_ANON_KEY are required');
    }
    return this.publicClient;
  }

  getAdminClient(): SupabaseClient {
    if (!this.adminClient) {
      throw new Error('Admin client not available: SUPABASE_SERVICE_ROLE_KEY is not configured');
    }
    return this.adminClient;
  }

  getClient(useAdmin: boolean = false): SupabaseClient {
    return useAdmin ? this.getAdminClient() : this.getPublicClient();
  }

  isConfigured(): boolean {
    return !!this.publicClient;
  }

  async healthCheck(): Promise<{ connected: boolean; latency_ms?: number; error?: string }> {
    try {
      const start = Date.now();
      const { error } = await (this.adminClient || this.publicClient)
        .from('users')
        .select('id', { count: 'exact', head: true })
        .limit(1);

      const latencyMs = Date.now() - start;

      if (error) {
        return { connected: false, latency_ms: latencyMs, error: error.message };
      }

      return { connected: true, latency_ms: latencyMs };
    } catch (err) {
      return { connected: false, error: (err as Error).message };
    }
  }
}
