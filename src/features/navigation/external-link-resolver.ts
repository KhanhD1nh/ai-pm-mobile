export function resolveExternalPath(rawUrl: string): string | null {
  try {
    const url = new URL(rawUrl, 'aipm://app');
    if (url.protocol !== 'aipm:') return null;
    const host = url.hostname.toLowerCase();
    const parts = url.pathname.split('/').filter(Boolean);

    // External links have no existing tab context. Resolve them to a concrete
    // native-tab stack so a cold launch never relies on Expo Router choosing
    // between duplicated shared routes.
    if (host === 'issue' && parts[0]) return `/(tabs)/(home)/issue/${encodeURIComponent(parts[0])}`;
    if (host === 'project' && parts[0]) return `/(tabs)/(projects)/project/${encodeURIComponent(parts[0])}`;
    if (parts[0] === 'issue' && parts[1]) return `/(tabs)/(home)/issue/${encodeURIComponent(parts[1])}`;
    if (parts[0] === 'project' && parts[1]) return `/(tabs)/(projects)/project/${encodeURIComponent(parts[1])}`;
    return null;
  } catch {
    return null;
  }
}
