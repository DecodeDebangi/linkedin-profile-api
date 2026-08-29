export interface FetchOptions {
  url: string;
  cookiesOverride?: string;
  userAgentOverride?: string;
  timeoutMs?: number;
}

export interface FetchResult {
  ok: boolean;
  statusCode: number;
  html: string;
  headers: Record<string, string>;
  isAuthWall: boolean;
  redirectUrl?: string;
  cookiesUsed: boolean;
  error?: string;
  secondaryPayloads?: Record<string, string>;
}

// Mobile WebKit User-Agent forces LinkedIn to render static SSR HTML with pre-filled Education & Experience markup!
const MOBILE_USER_AGENT =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';

const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36';

function cleanToken(str: string): string {
  if (!str) return '';
  return str.replace(/[\"\'\\]/g, '').trim();
}

async function executeSingleFetch(
  targetUrl: string,
  cookieStr: string,
  userAgentStr: string,
  timeoutMs: number
) {
  const requestHeaders: Record<string, string> = {
    'User-Agent': userAgentStr,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Upgrade-Insecure-Requests': '1',
  };

  if (cookieStr) {
    requestHeaders['Cookie'] = cookieStr;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let statusCode = 500;
  let html = '';
  let responseHeaders: Record<string, string> = {};
  let isRedirectError = false;

  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: requestHeaders,
      signal: controller.signal,
      redirect: 'follow',
      cache: 'no-store',
    });

    clearTimeout(timer);
    statusCode = response.status;
    response.headers.forEach((val, key) => {
      responseHeaders[key.toLowerCase()] = val;
    });

    html = await response.text();
  } catch (err: any) {
    clearTimeout(timer);
    if (err.message?.includes('redirect') || err.cause?.message?.includes('redirect')) {
      isRedirectError = true;
      statusCode = 302;
    }
  }

  return { statusCode, html, responseHeaders, isRedirectError };
}

export async function fetchProfilePayload(options: FetchOptions): Promise<FetchResult> {
  const { url, cookiesOverride, userAgentOverride, timeoutMs = 12000 } = options;

  const envCookies = process.env.SCRAPER_COOKIES || process.env.LINKEDIN_COOKIE_LI_AT || '';
  let rawCookie = (cookiesOverride || envCookies).trim();

  // Extract li_at and JSESSIONID dynamically
  const liAtMatch = rawCookie.match(/li_at=([^;\s]+)/i);
  const cleanLiAt = liAtMatch ? cleanToken(liAtMatch[1]) : cleanToken(rawCookie);

  const jsessionMatch = rawCookie.match(/JSESSIONID=([^;\s]+)/i);
  const rawJsession = jsessionMatch ? jsessionMatch[1] : (process.env.LINKEDIN_COOKIE_JSESSIONID || process.env.JSESSIONID || '');
  const cleanJsession = cleanToken(rawJsession);

  // Build full Cookie string with BOTH JSESSIONID and li_at if present
  let cookieHeader = '';
  if (cleanJsession && cleanLiAt) {
    cookieHeader = `JSESSIONID="${cleanJsession}"; li_at=${cleanLiAt}`;
  } else if (cleanLiAt) {
    cookieHeader = `li_at=${cleanLiAt}`;
  } else if (rawCookie) {
    cookieHeader = rawCookie;
  }

  // Use Mobile User-Agent by default for complete SSR Education & Experience extraction
  const userAgent = userAgentOverride || MOBILE_USER_AGENT;

  console.log('[HTTP FETCHER] Initiating SSR Mobile HTML profile fetch (Cookies configured:', Boolean(cookieHeader), ')...');

  let result = await executeSingleFetch(url, cookieHeader, userAgent, timeoutMs);

  // Fallback to desktop User-Agent if mobile fetch returns error or empty payload
  if ((result.statusCode !== 200 || result.html.length < 1500) && userAgent === MOBILE_USER_AGENT) {
    console.log('[HTTP FETCHER] Retrying with desktop User-Agent fallback...');
    result = await executeSingleFetch(url, cookieHeader, DEFAULT_USER_AGENT, timeoutMs);
  }

  const statusCode = result.statusCode;
  const html = result.html;
  const responseHeaders = result.responseHeaders;

  // An authentic AuthWall is a redirect or a short error page (< 15 KB) with sign-in prompts.
  // Full SSR profile pages (> 20 KB) contain header "Sign In" buttons but are valid profile responses!
  const isAuthWall =
    result.isRedirectError ||
    statusCode === 999 ||
    statusCode === 429 ||
    statusCode === 403 ||
    statusCode === 302 ||
    (statusCode === 200 && html.length < 15000 && (html.includes('authwall') || html.includes('sign-in') || html.includes('login-submit')));

  return {
    ok: statusCode === 200 && !isAuthWall,
    statusCode,
    html,
    headers: responseHeaders,
    isAuthWall,
    cookiesUsed: Boolean(cookieHeader),
  };
}
