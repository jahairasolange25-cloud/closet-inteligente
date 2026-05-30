export interface Avatar {
  id: string;
  user_id: string;
  full_body_url: string | null;
  head_url: string | null;
  height_cm: number | null;
  chest_cm: number | null;
  waist_cm: number | null;
  hips_cm: number | null;
  inseam_cm: number | null;
  shoulder_width_cm: number | null;
  arm_length_cm: number | null;
  leg_length_cm: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateAvatarDto {
  full_body_url?: string;
  head_url?: string;
  height_cm?: number;
  chest_cm?: number;
  waist_cm?: number;
  hips_cm?: number;
  inseam_cm?: number;
  shoulder_width_cm?: number;
  arm_length_cm?: number;
  leg_length_cm?: number;
}

export interface GenerateAvatarResponse {
  generation_id: string;
  status: 'pending';
}

export type GenerationStatus = 'idle' | 'pending' | 'generating' | 'completed' | 'failed';
