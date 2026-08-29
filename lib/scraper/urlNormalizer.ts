/**
 * Utility for normalizing profile URLs and user handles across supported platforms.
 */
export interface NormalizedUrl {
  url: string;
  platform: 'linkedin' | 'github' | 'twitter' | 'generic';
  handle: string;
}

export function normalizeProfileUrl(input: string): NormalizedUrl {
  const trimmed = input.trim();
  if (!trimmed) {
    return { url: '', platform: 'generic', handle: '' };
  }

  // Check if full URL
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const parsed = new URL(trimmed);
      const host = parsed.hostname.toLowerCase();
      let platform: 'linkedin' | 'github' | 'twitter' | 'generic' = 'generic';
      let handle = '';

      if (host.includes('linkedin.com')) {
        platform = 'linkedin';
        const parts = parsed.pathname.split('/').filter(Boolean);
        const inIdx = parts.indexOf('in');
        handle = inIdx !== -1 && parts[inIdx + 1] ? parts[inIdx + 1] : parts[0] || '';
      } else if (host.includes('github.com')) {
        platform = 'github';
        handle = parsed.pathname.split('/').filter(Boolean)[0] || '';
      } else if (host.includes('twitter.com') || host.includes('x.com')) {
        platform = 'twitter';
        handle = parsed.pathname.split('/').filter(Boolean)[0] || '';
      }

      return { url: trimmed, platform, handle };
    } catch {
      // Fall through to string manipulation
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

  if (trimmed.includes('github.com/')) {
    const handle = trimmed.replace(/^.*github\.com\//, '').replace(/\/.*$/, '');
    return {
      url: `https://github.com/${handle}`,
      platform: 'github',
      handle,
    };
  }

  // Default assumption for bare handle (e.g. "debangic"): treat as LinkedIn ID
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
