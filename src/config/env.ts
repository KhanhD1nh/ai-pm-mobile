import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { z } from 'zod';

const envSchema = z.object({
  apiBaseUrl: z.string().url(),
  easProjectId: z.string().min(1).optional(),
});

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, unknown>;

const configuredApiBaseUrl = extra.apiBaseUrl ?? process.env.EXPO_PUBLIC_API_BASE_URL;

if (!configuredApiBaseUrl && !__DEV__) {
  throw new Error('EXPO_PUBLIC_API_BASE_URL is required for production builds.');
}

const apiBaseUrlInput = String(
  configuredApiBaseUrl ?? 'http://127.0.0.1:4000/api/v1',
);

function getExpoDevHost() {
  const hostUri = Constants.expoConfig?.hostUri;
  if (!hostUri) return null;

  try {
    const normalized = hostUri.includes('://') ? hostUri : `http://${hostUri}`;
    return new URL(normalized).hostname || null;
  } catch {
    return null;
  }
}

function resolveApiBaseUrl(value: string) {
  if (!__DEV__ || Platform.OS === 'web') return value;

  try {
    const url = new URL(value);
    const pointsToLoopback = ['localhost', '127.0.0.1', '::1'].includes(url.hostname);
    if (!pointsToLoopback) return value;

    const devHost = getExpoDevHost();
    if (!devHost || ['localhost', '127.0.0.1', '::1'].includes(devHost)) {
      return value;
    }

    url.hostname = devHost;
    const resolved = url.toString().replace(/\/$/, '');
    console.log('[ENV] Native API localhost resolved through Expo dev host', {
      platform: Platform.OS,
      configured: value,
      resolved,
    });
    return resolved;
  } catch {
    return value;
  }
}

export const env = envSchema.parse({
  apiBaseUrl: resolveApiBaseUrl(apiBaseUrlInput),
  easProjectId: extra.easProjectId ?? process.env.EXPO_PUBLIC_EAS_PROJECT_ID ?? undefined,
});
