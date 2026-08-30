# Profile Scraper Utility & Web Dashboard

A production-ready Next.js 15 application built with TypeScript and Tailwind CSS that provides a server-side profile data extraction utility (`POST /api/scrape`) and an interactive Web Dashboard UI to scrape, parse, and visualize LinkedIn and GitHub profiles into structured JSON.

---

## 📍 Table of Contents
- [🚀 1. Setup Instructions](#-1-setup-instructions)
- [📖 2. API Documentation](#-2-api-documentation)
- [🔬 3. Our Approach](#-3-our-approach)
- [⚠️ 4. Challenges I Faced & How I Resolved Them (In Detail)](#%EF%B8%8F-4-challenges-i-faced--how-i-resolved-them-in-detail)
- [🏗 5. Architecture & File Tree](#-5-architecture--file-tree)

---

## 🚀 1. Setup Instructions

### Prerequisites
- Node.js 18.x or higher
- npm 9.x or higher

### Step 1: Clone & Install Dependencies
```bash
git clone https://github.com/DecodeDebangi/linkedin-profile-api.git
cd linkedin-profile-api
npm install
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Edit `.env.local` to provide your active LinkedIn session cookies:
```env
# LinkedIn Session Cookies for Direct HTTP Scraping
LINKEDIN_COOKIE_LI_AT="AQED..."
LINKEDIN_COOKIE_JSESSIONID="ajax:156..."
```

> **How to get your session cookies**:
> 1. Open Google Chrome and log into [https://www.linkedin.com](https://www.linkedin.com).
> 2. Open Developer Tools (`F12` or `Cmd + Option + I`) ➔ **Application** tab ➔ **Cookies** ➔ `https://www.linkedin.com`.
> 3. Copy the values of **`li_at`** and **`JSESSIONID`** and paste them into `.env.local`.

### Step 3: Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📖 2. API Documentation

### Endpoint: `POST /api/scrape`
Scrapes and parses public or authenticated profile payloads from LinkedIn or GitHub URLs and returns a normalized JSON response.

### Authentication Modes
You can supply session cookies via any of the following 3 flexible methods (evaluated in priority order):

1. **HTTP Headers (Recommended for API Clients & Postman)**:
   - `x-linkedin-li-at: <token>` and `x-linkedin-jsessionid: <token>`
   - `Authorization: Bearer JSESSIONID="..."; li_at=...`
2. **JSON Request Body**:
   - `{ "url": "...", "li_at": "...", "jsessionid": "..." }`
   - `{ "url": "...", "cookiesOverride": "li_at=...; JSESSIONID=..." }`
3. **Environment Variables (`.env.local` Default)**:
   - `LINKEDIN_COOKIE_LI_AT` and `LINKEDIN_COOKIE_JSESSIONID`

### Request Headers
| Header | Type | Required | Description |
|---|---|---|---|
| `Content-Type` | `string` | **Yes** | Must be `application/json` |
| `x-linkedin-li-at` | `string` | Optional | Dedicated `li_at` cookie token |
| `x-linkedin-jsessionid` | `string` | Optional | Dedicated `JSESSIONID` cookie token |
| `Authorization` | `string` | Optional | Bearer session cookie string |

### Request Body
```json
{
  "url": "https://www.linkedin.com/in/satyanadella/"
}
```
- `url` *(string, required)*: Target profile URL or LinkedIn ID handle (e.g. `"satyanadella"`, `"in/satyanadella"`, or full URL).

<details>
<summary><b>🧪 Click to expand Example cURL Requests & Sample JSON Response</b></summary>

<br />

#### Example cURL Requests

**1. Using Custom Headers:**
```bash
curl --location 'http://localhost:3000/api/scrape' \
--header 'Content-Type: application/json' \
--header 'x-linkedin-li-at: YOUR_LI_AT_HERE' \
--header 'x-linkedin-jsessionid: YOUR_JSESSIONID_HERE' \
--data '{
    "url": "https://www.linkedin.com/in/satyanadella/"
}'
```

**2. Using Bare Handle:**
```bash
curl --location 'http://localhost:3000/api/scrape' \
--header 'Content-Type: application/json' \
--data '{
    "url": "satyanadella"
}'
```

---

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "name": "Satya Nadella",
    "headline": "Chairman and CEO at Microsoft",
    "location": "Redmond, Washington, United States",
    "about": "Chairman and CEO of Microsoft.",
    "experience": [
      {
        "id": "exp-0",
        "title": "Chairman and CEO",
        "company": "Microsoft",
        "dates": "Feb 2014 - Present",
        "skillsUsed": ["Cloud Computing", "Enterprise Software", "Strategy", "Leadership"]
      },
      {
        "id": "exp-1",
        "title": "Executive Vice President, Cloud and Enterprise",
        "company": "Microsoft",
        "dates": "2011 - 2014",
        "skillsUsed": ["Cloud Computing", "Azure", "Distributed Systems"]
      }
    ],
    "education": [
      {
        "id": "edu-dom-0",
        "school": "University of Chicago Booth School of Business",
        "degree": "Master of Business Administration - MBA",
        "fieldOfStudy": "Business Administration",
        "dates": "1997"
      },
      {
        "id": "edu-dom-1",
        "school": "University of Wisconsin-Milwaukee",
        "degree": "Master of Science - MS",
        "fieldOfStudy": "Computer Science",
        "dates": "1990"
      },
      {
        "id": "edu-dom-2",
        "school": "Manipal Institute of Technology",
        "degree": "Bachelor of Technology - BTech",
        "fieldOfStudy": "Electrical and Electronics Engineering",
        "dates": "1988"
      }
    ],
    "skills": ["Cloud Computing", "Enterprise Software", "Strategy", "Leadership", "Distributed Systems", "AI Integration"],
    "certifications": [],
    "languages": [],
    "profileImageUrls": {
      "avatar": "https://media.licdn.com/dms/image/v2/...",
      "banner": "https://media.licdn.com/dms/image/v2/..."
    }
  },
  "metadata": {
    "scrapedAt": "2026-08-29T18:30:00.000Z",
    "url": "https://www.linkedin.com/in/satyanadella/",
    "platform": "linkedin",
    "statusCode": 200,
    "isMock": false,
    "source": "custom_session",
    "cookiesConfigured": true,
    "parsingStrategy": [
      "Preload & Image Extractor",
      "Mobile SSR Experience DOM Parser",
      "Mobile SSR Education DOM Parser"
    ]
  }
}
```

</details>

---

## 🔬 3. Our Approach

### Zero-Headless Direct Server Scraping
Instead of running heavy Puppeteer or Chromium instances (which consume 500MB+ RAM per request), our engine uses Next.js server-side `fetch` with browser-mimicking headers (`User-Agent`, `Sec-Fetch-*`, `Accept-Language`).

### Mobile Web SSR Engine (`m_flagship3_profile_view_base`)
Desktop LinkedIn renders profiles as Single Page Applications (SPAs), leaving empty lazy-load placeholders in server HTML. By sending Mobile WebKit User-Agents, LinkedIn serves static server-rendered (SSR) HTML containing full `.education-container` and `.experience-container` DOM nodes directly in the initial response.

### Multi-Strategy Cheerio Parser Cascade
1. **Preload & Image Tag Extractor**: Parses high-res avatar and banner images from `<link rel="preload">` tags.
2. **Mobile SSR DOM Parser**: Traverses nested experience timelines and multi-role promotional history (`ul li.role-container`).
3. **JSON-LD Microdata & OpenGraph**: Fallback extraction for standard public profiles.
4. **Dynamic Skills Matcher**: Matches tech keywords against headlines and summaries.

---

## ⚠️ 4. Challenges I Faced & How I Resolved Them (In Detail)

<details>
<summary><b>🛠️ Click to expand Detailed Technical Challenges & Solutions (1–6)</b></summary>

<br />

#### 1. Empty Education Payload (`education: []`) in Desktop HTML
* **The Problem**: Scraping desktop LinkedIn HTML returned empty `education: []` arrays even for completed profiles.
* **Root Cause Analysis**: LinkedIn Desktop Web renders as a Client-Side Single Page Application (SPA). Education & Experience items below the fold are loaded asynchronously via JavaScript lazy-loading anchors (`<div id="profile-education-lazy-load">`). Standard server-side HTTP `fetch()` requests do not execute client JS engines.
* **Detailed Resolution**: Switched the request User-Agent in `lib/scraper/fetcher.ts` to Mobile WebKit (`m_flagship3_profile_view_base`). LinkedIn Mobile Web serves static, pre-rendered Server-Side Rendered (SSR) HTML where `.education-container` and `.experience-container` DOM elements are 100% pre-populated directly in the initial HTML payload.

---

#### 2. Account Session Revocation & Logouts (`Set-Cookie: liap=delete me`)
* **The Problem**: Making automated scraper calls was invalidating active Chrome browser sessions and logging out the user.
* **Root Cause Analysis**: Querying LinkedIn's private internal REST endpoints (`/voyager/api/...`) triggers security gatekeepers that detect non-browser TLS signatures, responding with `Set-Cookie: liap=delete me` and revoking active `li_at` session tokens.
* **Detailed Resolution**: Strictly avoided all internal `/voyager/api` endpoints. All scraping is performed via standard Mobile Web page HTML requests (`/in/username`), mimicking regular browser page navigation to guarantee **zero session revocations** and keep browser sessions logged in indefinitely.

---

#### 3. Loss of Nested Multi-Role Promotional Experience History
* **The Problem**: Profiles with multiple promotional roles under a single company (e.g. SDE 1 ➔ SDE 2 ➔ SWE III at Google) only extracted the topmost single position, discarding previous roles.
* **Root Cause Analysis**: Top-level flat DOM selectors (`.experience-item h3`) only selected the first child heading under company containers, ignoring nested promotional sub-lists (`ul li.role-container`).
* **Detailed Resolution**: Developed a multi-level hierarchical DOM tree parser in `lib/scraper/parser.ts`. The parser inspects whether an experience block is a single-role or multi-role container, recursively traversing `ul li.role-container` nodes to extract every position title, organization name, and date range accurately.

---

#### 4. Undici Node `fetch()` Redirect Loop Crashes
* **The Problem**: Expired cookies or AuthWall redirects caused Node's `undici` HTTP client to throw unhandled `TypeError: fetch failed` due to `redirect count exceeded`.
* **Root Cause Analysis**: Node 18+ native `fetch` follows HTTP 302 redirects automatically up to a maximum limit (20). When redirected to `/authwall`, LinkedIn initiates a redirect loop, causing unhandled process exceptions.
* **Detailed Resolution**: Implemented redirect-safe exception handlers in `lib/scraper/fetcher.ts` using custom timeout abort controllers and try-catch blocks that intercept redirect errors gracefully, returning clean HTTP 302 AuthWall diagnostic responses.

---

#### 5. False Positive AuthWall 500 Errors on Full 190+ KB HTML Payloads
* **The Problem**: API returned HTTP 500 AuthWall errors even though the backend terminal logged 100% complete extracted profile data (name, 5 jobs, education, 23 skills).
* **Root Cause Analysis**: `isAuthWall` checked `html.includes('sign-in')` or `html.includes('login-submit')` globally against the entire raw HTML payload. LinkedIn's Mobile SSR template renders unauthenticated navigation links (`<a href="/login">Sign In</a>`) in the header menu, triggering false positive detections on valid 190+ KB profile pages.
* **Detailed Resolution**: Updated `isAuthWall` in `lib/scraper/fetcher.ts` to enforce payload size checks (`html.length < 15000`). AuthWall detection only evaluates on short error/login redirect pages (< 15 KB) or non-200 HTTP status codes, allowing full profile HTML (> 15 KB) to pass cleanly:
  ```typescript
  const isAuthWall =
    result.isRedirectError ||
    statusCode === 999 || statusCode === 429 || statusCode === 403 || statusCode === 302 ||
    (statusCode === 200 && html.length < 15000 && (html.includes('authwall') || html.includes('sign-in')));
  ```

---

#### 6. Avatar vs Cover Banner Image Cross-Pollination
* **The Problem**: Target profile avatars were returning the logged-in account's header icon or falling back to the cover background banner image.
* **Root Cause Analysis**: Authenticated LinkedIn pages render a `<link rel="preload">` in `<head>` for the logged-in user's navbar icon (`scale_100_100`). Additionally, cover background images (`profile-displaybackgroundimage`) appear higher in the DOM tree than profile photos (`profile-displayphoto`).
* **Detailed Resolution**: Refactored image extraction in `lib/scraper/parser.ts` with strict URL pattern matching. Enforced that `avatar` MUST contain `profile-displayphoto` and explicitly exclude header nav icons (`.nav__user-avatar`), while `banner` MUST contain `profile-displaybackgroundimage`:
  ```typescript
  // Avatar strictly requires 'profile-displayphoto' (face picture)
  $('img[src*="profile-displayphoto"]').not('header img, .nav__user-avatar').first();

  // Banner strictly requires 'profile-displaybackgroundimage' (cover background)
  $('img[src*="profile-displaybackgroundimage"]').not('img[src*="profile-displayphoto"]').first();
  ```

</details>

### ⚠️ Known Limitations
1. **Session Cookie Expiration**: Authenticated session cookies (`li_at`) expire periodically and must be updated in `.env.local` or via UI settings.
2. **Platform Rate Limits & IP Blocks**: Cloud server IPs making rapid consecutive requests without delay may encounter rate limiting (HTTP 429).
3. **DOM Selector Evolution**: Social platforms periodically update CSS class names. The parser mitigates this via a multi-strategy fallback cascade (OpenGraph ➔ JSON-LD ➔ DOM tree selectors).

---

## 🏗 5. Architecture & File Tree

<details>
<summary><b>📂 Click to expand Project Architecture & File Tree</b></summary>

<br />

```text
linkedin-profile-api/
├── app/
│   ├── api/
│   │   └── scrape/
│   │       └── route.ts          # POST /api/scrape route handler
│   ├── globals.css               # Global Tailwind CSS styles
│   ├── layout.tsx                # App Root Layout & SEO metadata
│   └── page.tsx                  # Interactive Web Dashboard UI
├── components/
│   ├── StatusHeader.tsx          # App header & cookie status indicator
│   ├── ProfileForm.tsx           # Profile URL input form & HTTP options
│   ├── ProfileView.tsx           # Visual profile UI & tabbed sections
│   └── RawJsonViewer.tsx         # Searchable, copyable raw JSON viewer
├── lib/
│   └── scraper/
│       ├── fetcher.ts            # Mobile SSR HTTP fetcher engine
│       ├── parser.ts             # Cheerio DOM & multi-strategy parser
│       └── urlNormalizer.ts      # Profile URL normalization utility
├── types/
│   └── profile.ts                # TypeScript interfaces & schema types
├── .env.example                  # Environment template
└── README.md                     # Application documentation
```

</details>

---

## 📄 License

MIT License. Built for assignment demonstration.
