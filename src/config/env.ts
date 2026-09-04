import Constants from 'expo-constants';
import { z } from 'zod';

const envSchema = z.object({
  apiBaseUrl: z.string().url(),
  easProjectId: z.string().min(1).optional(),
});

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, unknown>;

export const env = envSchema.parse({
  apiBaseUrl: extra.apiBaseUrl ?? process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:4000/api/v1',
  easProjectId: extra.easProjectId ?? process.env.EXPO_PUBLIC_EAS_PROJECT_ID ?? undefined,
});
