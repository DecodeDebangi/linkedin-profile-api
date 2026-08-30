/**
 * Utility for normalizing profile URLs and user handles across supported platforms.
 */
export interface NormalizedUrl {
  url: string;
  platform: 'linkedin';
  handle: string;
}

export function normalizeProfileUrl(input: string): NormalizedUrl {
  const trimmed = input.trim();
  if (!trimmed) {
    return { url: '', platform: 'linkedin', handle: '' };
  }

  // Check if full URL
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const parsed = new URL(trimmed);
      const host = parsed.hostname.toLowerCase();

      // Must be a LinkedIn domain
      if (!host.includes('linkedin.com')) {
        return { url: '', platform: 'linkedin', handle: '' };
      }

      const parts = parsed.pathname.split('/').filter(Boolean);
      const inIdx = parts.indexOf('in');
      const handle = inIdx !== -1 && parts[inIdx + 1] ? parts[inIdx + 1] : parts[0] || '';

      const normalizedUrl = handle ? `https://www.linkedin.com/in/${handle}` : trimmed;
      return { url: normalizedUrl, platform: 'linkedin', handle };
    } catch {
      return { url: '', platform: 'linkedin', handle: '' };
    }
  }

  // Handle bare inputs like "in/satyanadella" or "linkedin.com/in/satyanadella"
  if (trimmed.includes('linkedin.com/in/') || trimmed.startsWith('in/')) {
    const handle = trimmed.replace(/^.*(?:linkedin\.com\/in\/|in\/)/, '').replace(/\/.*$/, '');
    return {
      url: `https://www.linkedin.com/in/${handle}`,
      platform: 'linkedin',
      handle,
    };
  }

  // Reject external domain inputs (e.g. "github.com/user", "google.com")
  if (trimmed.includes('.') || trimmed.includes('/')) {
    return { url: '', platform: 'linkedin', handle: '' };
  }

  // Handle bare handles (e.g. "satyanadella" or "@satyanadella")
  const cleanHandle = trimmed.replace(/^@/, '').replace(/\/.*$/, '');
  return {
    url: `https://www.linkedin.com/in/${cleanHandle}`,
    platform: 'linkedin',
    handle: cleanHandle,
  };
}

export function formatHandleToDisplayName(handle: string): string {
  if (!handle) return 'Profile Member';

  const parts = handle
    .replace(/[-_.]/g, ' ')
    .replace(/\d+/g, '')
    .trim()
    .split(/\s+/);

  if (parts.length === 0 || !parts[0]) return handle;

  return parts
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
