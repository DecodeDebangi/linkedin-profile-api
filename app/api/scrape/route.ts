import { NextRequest, NextResponse } from 'next/server';
import { fetchProfilePayload } from '@/lib/scraper/fetcher';
import { parseProfileHtml } from '@/lib/scraper/parser';
import { normalizeProfileUrl } from '@/lib/scraper/urlNormalizer';
import { ScrapeResponse, ScrapeMetadata } from '@/types/profile';

// API Route for profile scraping with dynamic cookie support
export async function POST(req: NextRequest): Promise<NextResponse<ScrapeResponse>> {
  try {
    const body = await req.json().catch(() => ({}));
    const { url, userAgentOverride } = body;

    // 1. Extract Credentials from HTTP Headers (Preferred RESTful Standard for API Clients / Postman)
    const authHeader = req.headers.get('authorization') || '';
    const headerLiAt = req.headers.get('x-linkedin-li-at') || req.headers.get('x-li-at') || '';
    const headerJSession = req.headers.get('x-linkedin-jsessionid') || req.headers.get('x-jsessionid') || '';
    const customCookieHeader = req.headers.get('x-scraper-cookies') || req.headers.get('x-cookies') || '';

    let dynamicCookies = customCookieHeader;

    if (!dynamicCookies && headerLiAt && headerJSession) {
      dynamicCookies = `JSESSIONID="${headerJSession.replace(/^"|"$/g, '')}"; li_at=${headerLiAt.trim()}`;
    } else if (!dynamicCookies && headerLiAt) {
      dynamicCookies = `li_at=${headerLiAt.trim()}`;
    } else if (!dynamicCookies && authHeader) {
      dynamicCookies = authHeader.replace(/^Bearer\s+/i, '').trim();
    }

    // 2. Fallback to Request Body keys if HTTP Headers are not provided
    if (!dynamicCookies) {
      const { cookiesOverride, cookies, li_at, jsessionid } = body;
      const bodyLiAt = (li_at || '').trim();
      const bodyJSession = (jsessionid || '').trim();

      if (bodyLiAt && bodyJSession) {
        dynamicCookies = `JSESSIONID="${bodyJSession.replace(/^"|"$/g, '')}"; li_at=${bodyLiAt}`;
      } else if (bodyLiAt) {
        dynamicCookies = `li_at=${bodyLiAt}`;
      } else {
        dynamicCookies = cookiesOverride || cookies || '';
      }
    }

    const cookiesConfigured = Boolean(
      process.env.LINKEDIN_COOKIE_LI_AT ||
      process.env.LINKEDIN_COOKIE_JSESSIONID ||
      dynamicCookies
    );

    console.log('\n======================================================================');
    console.log('[SCRAPER API ROUTE] Incoming Scrape Request');
    console.log('Target Input:', url);
    console.log('Cookies Configured:', cookiesConfigured);
    console.log('----------------------------------------------------------------------');

    // 1. Validate & Normalize Input URL / Handle
    if (!url || typeof url !== 'string' || !url.trim()) {
      return NextResponse.json(
        {
          success: false,
          data: {
            name: '',
            headline: '',
            location: '',
            about: '',
            experience: [],
            education: [],
            skills: [],
            certifications: [],
            languages: [],
            profileImageUrls: {},
          },
          metadata: {
            scrapedAt: new Date().toISOString(),
            url: '',
            platform: 'generic',
            statusCode: 400,
            isMock: false,
            source: 'live_http',
            cookiesConfigured,
            parsingStrategy: [],
          },
          error: 'Please enter a valid profile URL or LinkedIn ID (e.g. "https://www.linkedin.com/in/debangic/").',
        },
        { status: 400 }
      );
    }

    const normalized = normalizeProfileUrl(url.trim());
    const cleanUrl = normalized.url;
    const platform = normalized.platform;

    console.log('Normalized URL:', cleanUrl);
    console.log('Platform:', platform);

    if (!cleanUrl) {
      return NextResponse.json(
        {
          success: false,
          data: {
            name: '',
            headline: '',
            location: '',
            about: '',
            experience: [],
            education: [],
            skills: [],
            certifications: [],
            languages: [],
            profileImageUrls: {},
          },
          metadata: {
            scrapedAt: new Date().toISOString(),
            url,
            platform: 'generic',
            statusCode: 400,
            isMock: false,
            source: 'live_http',
            cookiesConfigured,
            parsingStrategy: [],
          },
          error: 'Could not normalize profile URL. Please check the URL format.',
        },
        { status: 400 }
      );
    }

    // 2. Perform direct HTTP server-to-server request
    console.log('[HTTP FETCHER] Initiating direct server-to-server HTTP request...');
    const fetchResult = await fetchProfilePayload({
      url: cleanUrl,
      cookiesOverride: dynamicCookies,
      userAgentOverride,
    });

    console.log(`[HTTP FETCHER] Response Status: ${fetchResult.statusCode} ${fetchResult.ok ? 'OK' : 'BLOCKED/AUTHWALL'}`);
    console.log(`[HTTP FETCHER] HTML Payload Received Length: ${fetchResult.html.length} bytes`);

    // 3. Parse HTML content if request returned HTML
    if (fetchResult.html) {
      const parsed = parseProfileHtml(fetchResult.html, cleanUrl, fetchResult.secondaryPayloads);

      console.log('----------------------------------------------------------------------');
      console.log('[PARSER ENGINE] Extracted Profile Data Summary:');
      console.log('- Name:', parsed.data.name);
      console.log('- Headline:', parsed.data.headline);
      console.log('- Location:', parsed.data.location);
      console.log('- Avatar Image URL:', parsed.data.profileImageUrls?.avatar || 'None');
      console.log('- Banner Image URL:', parsed.data.profileImageUrls?.banner || 'None');
      console.log('- Education Extracted:', parsed.data.education.map((e) => e.school));
      console.log('- Experience Extracted:', parsed.data.experience.map((e) => `${e.title} @ ${e.company}`));
      console.log('- Skills Extracted:', parsed.data.skills);
      console.log('- Strategies Used:', parsed.strategiesUsed);
      console.log('======================================================================\n');

      if (parsed.isParsedSuccessfully && parsed.data.name !== 'Profile Member' && !fetchResult.isAuthWall) {
        const metadata: ScrapeMetadata = {
          scrapedAt: new Date().toISOString(),
          url: cleanUrl,
          platform,
          statusCode: fetchResult.statusCode,
          isMock: false,
          source: fetchResult.cookiesUsed ? 'custom_session' : 'live_http',
          cookiesConfigured,
          responseHeaders: {
            'content-type': fetchResult.headers['content-type'] || 'text/html',
            'server': fetchResult.headers['server'] || 'Unknown',
          },
          parsingStrategy: parsed.strategiesUsed,
        };

        return NextResponse.json({
          success: true,
          data: parsed.data,
          metadata,
        });
      }
    }

    // 4. Handle Auth Walls / Anti-Bot blocks gracefully
    let errorMessage = 'Failed to extract profile payload.';
    if (fetchResult.isAuthWall) {
      errorMessage = cookiesConfigured
        ? `LinkedIn returned an AuthWall (HTTP ${fetchResult.statusCode}). The provided session cookie may be expired or invalid.`
        : `LinkedIn restricts unauthenticated HTTP requests (HTTP ${fetchResult.statusCode} AuthWall). Please provide valid session cookies in .env.local (LINKEDIN_COOKIE_LI_AT & LINKEDIN_COOKIE_JSESSIONID) or via Advanced Settings.`;
    } else if (fetchResult.error) {
      errorMessage = `Network request error: ${fetchResult.error}`;
    }

    const metadata: ScrapeMetadata = {
      scrapedAt: new Date().toISOString(),
      url: cleanUrl,
      platform,
      statusCode: fetchResult.statusCode,
      isMock: false,
      source: 'live_http',
      warningMessage: errorMessage,
      cookiesConfigured,
      responseHeaders: fetchResult.headers,
      parsingStrategy: ['HTTP Direct Fetcher', 'AuthWall Detection'],
    };

    return NextResponse.json(
      {
        success: false,
        data: {
          name: '',
          headline: '',
          location: '',
          about: '',
          experience: [],
          education: [],
          skills: [],
          certifications: [],
          languages: [],
          profileImageUrls: {},
        },
        metadata,
        error: errorMessage,
      },
      { status: fetchResult.statusCode === 999 || fetchResult.statusCode === 403 ? 403 : 500 }
    );
  } catch (err: unknown) {
    console.error('[SCRAPER API ROUTE] Error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error while processing extraction request.';
    return NextResponse.json(
      {
        success: false,
        data: {
          name: '',
          headline: '',
          location: '',
          about: '',
          experience: [],
          education: [],
          skills: [],
          certifications: [],
          languages: [],
          profileImageUrls: {},
        },
        metadata: {
          scrapedAt: new Date().toISOString(),
          url: '',
          platform: 'generic',
          statusCode: 500,
          isMock: false,
          source: 'live_http',
          cookiesConfigured: Boolean(process.env.LINKEDIN_COOKIE_LI_AT || process.env.LINKEDIN_COOKIE_JSESSIONID),
          parsingStrategy: [],
        },
        error: message,
      },
      { status: 500 }
    );
  }
}
