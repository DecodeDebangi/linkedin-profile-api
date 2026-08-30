import * as cheerio from 'cheerio';
import {
  ProfileData,
  ExperienceItem,
  EducationItem,
  CertificationItem,
  ProfileImageUrls,
} from '@/types/profile';

export interface ParseResult {
  data: ProfileData;
  strategiesUsed: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rawJsonLd?: any[];
  openGraph?: Record<string, string>;
  isParsedSuccessfully: boolean;
}

function cleanHtmlEntities(str: string): string {
  if (!str) return '';
  return str
    .replace(/^Someone\s+at\s+/i, '')
    .replace(/^logo\s+of\s+/i, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\\u0026/g, '&')
    .replace(/\\u0027/g, "'")
    .replace(/\\.*$/, '')
    .replace(/".*$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Universal dictionary of skills for dynamic extraction from headline/bio
 */
const COMMON_SKILLS_DICTIONARY = [
  'TypeScript', 'JavaScript', 'React', 'Next.js', 'NestJS', 'Node.js', 'Python',
  'PyTorch', 'TensorFlow', 'Vector Search', 'Distributed Systems', 'Full-Stack',
  'AI Integration', 'Machine Learning', 'GraphQL', 'REST API', 'PostgreSQL',
  'MongoDB', 'Redis', 'Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure', 'C++',
  'Rust', 'Go', 'Golang', 'Java', 'Spring Boot', 'System Architecture',
  'Microservices', 'DevOps', 'CI/CD', 'Product Strategy', 'Agile', 'Leadership',
];

/**
 * Blacklist patterns for non-geographic DOM strings in LinkedIn SSR HTML
 */
const INVALID_LOCATION_PATTERNS = [
  /^https?:\/\//i,
  /\(company website\)/i,
  /^\d+(st|nd|rd|th)(\s+degree)?$/i,
  /^\d{4}\s*[-–—]\s*(\d{4}|present)$/i,
  /joined\s+\d{4}/i,
  /contact information updated/i,
  /learn more about how members/i,
  /verified info/i,
  /\d+\s+(connections|followers|members)/i,
  /^(contact info|see all|show all|about|experience|education|skills|licenses|certifications|profile|message|report)/i,
  /\b(inc|llc|ltd|corp|corporation|gmbh|pvt|private|limited|technologies|solutions|services|systems|software)\b/i,
  /\b(university|college|school|institute|academy)\b/i,
];

function isValidLocation(loc: string): boolean {
  if (!loc || loc.length < 2 || loc.length > 100) return false;
  return !INVALID_LOCATION_PATTERNS.some((pattern) => pattern.test(loc));
}

export function parseProfileHtml(
  html: string,
  url: string,
  secondaryPayloads?: Record<string, string>
): ParseResult {
  const $ = cheerio.load(html);

  // Remove recommendation sidebars ("People Also Viewed") so we don't pick up other people's schools/companies
  $('.pv-browsemap-section, #browse-map, .aside, [data-section="browseMap"], .right-rail').remove();

  const strategiesUsed: string[] = [];
  const rawMetadata: Record<string, unknown> = {};
  const openGraph: Record<string, string> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const jsonLdBlocks: any[] = [];

  // 1. Extract OpenGraph Meta Tags
  $('meta[property^="og:"]').each((_, el) => {
    const prop = $(el).attr('property') || '';
    const content = $(el).attr('content') || '';
    if (prop && content) {
      openGraph[prop] = content;
      rawMetadata[prop] = content;
    }
  });

  $('meta[name]').each((_, el) => {
    const name = $(el).attr('name') || '';
    const content = $(el).attr('content') || '';
    if (name && content) {
      rawMetadata[name] = content;
    }
  });

  if (Object.keys(openGraph).length > 0) {
    strategiesUsed.push('OpenGraph Meta Tags');
  }

  // 2. Extract JSON-LD microdata scripts
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const text = $(el).html();
      if (text) {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) {
          jsonLdBlocks.push(...parsed);
        } else {
          jsonLdBlocks.push(parsed);
        }
      }
    } catch {
      // Ignore malformed JSON-LD
    }
  });

  if (jsonLdBlocks.length > 0) {
    strategiesUsed.push('JSON-LD Microdata');
  }

  // 3. Extract GitHub-specific profile data if GitHub URL
  if (url.includes('github.com')) {
    strategiesUsed.push('GitHub DOM Parser');
    const ghData = parseGitHubProfile($, url, openGraph, rawMetadata);
    return {
      data: ghData,
      strategiesUsed,
      rawJsonLd: jsonLdBlocks,
      openGraph,
      isParsedSuccessfully: Boolean(ghData.name),
    };
  }

  // 4. Try parsing JSON-LD Schema Person
  const personBlock = jsonLdBlocks.find(
    (b) => b['@type'] === 'Person' || b['@type'] === 'ProfilePage'
  );

  let name = '';
  let headline = '';
  let location = '';
  let about = '';
  const experience: ExperienceItem[] = [];
  const education: EducationItem[] = [];
  const skills: string[] = [];
  const certifications: CertificationItem[] = [];
  const languages: string[] = [];
  const profileImageUrls: ProfileImageUrls = {};

  if (personBlock) {
    name = personBlock.name || (personBlock.givenName ? `${personBlock.givenName || ''} ${personBlock.familyName || ''}`.trim() : '');
    headline = personBlock.jobTitle || personBlock.headline || '';
    about = personBlock.description || '';
    if (personBlock.address) {
      if (typeof personBlock.address === 'string') {
        location = personBlock.address;
      } else if (personBlock.address.addressLocality) {
        location = `${personBlock.address.addressLocality}, ${personBlock.address.addressCountry || ''}`.trim();
      }
    }
    if (personBlock.image) {
      profileImageUrls.avatar = typeof personBlock.image === 'string' ? personBlock.image : personBlock.image.contentUrl;
    }
  }

  // 5. Image Extraction (Avatar & Banner)
  
  // A. Avatar Extraction: Must contain 'profile-displayphoto' and not be a header/nav icon
  let avatarCandidate = '';

  // Strategy 1: Iterate over <img> tags containing 'profile-displayphoto'
  $('img[src*="profile-displayphoto"], img[data-delayed-url*="profile-displayphoto"]').each((_, el) => {
    if (avatarCandidate) return; // Found

    const $img = $(el);
    // Skip nav bar / header / me-widget icons
    if ($img.closest('header, nav, .global-nav, .me-widget').length > 0) return;

    const url = $img.attr('data-delayed-url') || $img.attr('src') || '';
    if (url && !url.includes('ghost') && !url.includes('profile-displaybackgroundimage')) {
      avatarCandidate = url;
    }
  });

  // Strategy 2: Check OpenGraph og:image ONLY if it contains 'profile-displayphoto'
  if (!avatarCandidate && openGraph['og:image'] && openGraph['og:image'].includes('profile-displayphoto')) {
    avatarCandidate = openGraph['og:image'];
  }

  // Strategy 3: Check <link rel="preload"> with 'profile-displayphoto' excluding scale_100_100 nav icon
  if (!avatarCandidate) {
    $('link[rel="preload"][as="image"]').each((_, el) => {
      const srcSet = $(el).attr('imagesrcset') || $(el).attr('href') || '';
      if (srcSet.includes('profile-displayphoto') && !srcSet.includes('scale_100_100')) {
        const parts = srcSet.split(',').map((s) => s.trim().split(' ')[0]);
        const largest = parts[parts.length - 1] || parts[0];
        if (largest && !largest.includes('ghost')) {
          avatarCandidate = largest;
        }
      }
    });
  }

  if (avatarCandidate && !avatarCandidate.includes('ghost')) {
    profileImageUrls.avatar = avatarCandidate;
  }

  // B. Banner Extraction: Must contain 'profile-displaybackgroundimage'
  let bannerCandidate = '';

  $('link[rel="preload"][as="image"]').each((_, el) => {
    const srcSet = $(el).attr('imagesrcset') || $(el).attr('href') || '';
    if (srcSet.includes('profile-displaybackgroundimage') && !bannerCandidate) {
      const parts = srcSet.split(',').map((s) => s.trim().split(' ')[0]);
      bannerCandidate = parts[parts.length - 1] || parts[0];
    }
  });

  if (!bannerCandidate) {
    const imgBanner = $(
      'img[src*="profile-displaybackgroundimage"], img[data-delayed-url*="profile-displaybackgroundimage"], .cover-image img, img.cover-image'
    )
      .not('header img, .global-nav img, .nav__user-avatar, img[src*="profile-displayphoto"]')
      .first();

    bannerCandidate =
      imgBanner.attr('data-delayed-url') ||
      imgBanner.attr('src') ||
      '';
  }

  if (!bannerCandidate && openGraph['og:image'] && openGraph['og:image'].includes('profile-displaybackgroundimage')) {
    bannerCandidate = openGraph['og:image'];
  }

  if (bannerCandidate) {
    profileImageUrls.banner = bannerCandidate;
  }

  if (profileImageUrls.avatar || profileImageUrls.banner) {
    strategiesUsed.push('Preload & Image Extractor');
  }

  // 6. Name Extraction from Mobile DOM & Desktop Headings
  const mobileNameCandidate = $('.basic-profile-section h1[dir="ltr"], .basic-profile-section h1, .profile-controller__name').first().text().trim();
  if (mobileNameCandidate && mobileNameCandidate !== 'Profile') {
    name = mobileNameCandidate;
  }

  if (!name) {
    const titleText = $('title').text().trim();
    const cleanTitleName = titleText && !titleText.startsWith('Profile |')
      ? titleText.replace(/\|.*$/g, '').replace(/–.*$/g, '').replace(/-.*$/g, '').trim()
      : '';

    name =
      openGraph['og:title']?.replace(/\|.*$/g, '').replace(/–.*$/g, '').trim() ||
      cleanTitleName ||
      $('.top-card-layout__title, .pv-top-card-profile-picture__image').first().text().trim() ||
      $('h1').first().text().trim() ||
      '';
  }

  // 7. Extract Headline Dynamically from Mobile DOM & HTML Payload
  const mobileHeadlineCandidate = $('.basic-profile-section .body-small.text-color-text span[dir="ltr"]').first().text().trim();
  if (mobileHeadlineCandidate) {
    headline = mobileHeadlineCandidate;
  }

  const mainContentText = $.html();
  if (!headline) {
    const headlineMatch =
      mainContentText.match(/(?:Senior|Staff|Principal|Lead|Junior)?\s*(?:Software|Full-Stack|Backend|Frontend|Systems|AI|ML|Data|Product)?\s*(?:Engineer|Developer|Architect|Manager|Lead|Founder|Consultant)[^"<\n]{5,150}/i) ||
      openGraph['og:description']?.match(/[^"<\n]{10,150}/);

    if (headlineMatch) {
      headline = cleanHtmlEntities(headlineMatch[0]);
    }
  }



  // 8. Extract Location Dynamically from Mobile DOM & HTML Payload
  $('.bg-color-background-container .body-small.text-color-text-low-emphasis, .basic-profile-section .body-small.text-color-text-low-emphasis, .top-card-layout__first-subline span, .top-card__subline-item, address, [data-section="location"]').each((_, el) => {
    if (location && isValidLocation(location)) return;
    const $clone = $(el).clone();
    $clone.find('.whitespace-nowrap, .dot-separator, .member-current-company, span[dir="ltr"]').remove();
    const candidate = $clone.text().replace(/\s+/g, ' ').trim();
    if (isValidLocation(candidate)) {
      location = candidate;
    }
  });

  if (!location || !isValidLocation(location)) {
    const locMatch =
      mainContentText.match(/"addressLocality":\s*"([^"]+)"/) ||
      mainContentText.match(/"locality":\s*"([^"]+)"/) ||
      mainContentText.match(/"location":\s*"([^"]+)"/) ||
      mainContentText.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,\s*(?:United States|India|United Kingdom|Canada|Germany|California|Washington|New York|Texas|England|Remote))/);

    if (locMatch && isValidLocation(locMatch[1])) {
      location = cleanHtmlEntities(locMatch[1]);
    }
  }

  // 9. Extract Skills Dynamically from Headline & Main Content
  COMMON_SKILLS_DICTIONARY.forEach((sk) => {
    try {
      const regex = new RegExp(`\\b${escapeRegExp(sk)}\\b`, 'i');
      if (regex.test(headline) || regex.test(mainContentText)) {
        if (!skills.includes(sk)) {
          skills.push(sk);
        }
      }
    } catch {
      // Fallback
    }
  });

  // 10. Extract ALL Experience Records Dynamically from Mobile SSR & Desktop DOM
  $('.experience-container ol > li').each((idx, el) => {
    const companyName = $(el).find('> a .list-item-heading span[dir="ltr"]').text().trim();
    const subRoles = $(el).find('ul li.role-container');

    if (subRoles.length > 0 && companyName) {
      // Company entry with multi-role history (e.g. AVRL: TDM, SDE-I)
      subRoles.each((sIdx, sEl) => {
        const roleTitle = $(sEl).find('.body-small-bold span[dir="ltr"]').text().trim();
        const dateSpans = $(sEl).find('.body-small span.body-small');
        const datesArr: string[] = [];
        dateSpans.each((_, dEl) => {
          const txt = $(dEl).text().replace(/[\n\r\s]+/g, ' ').trim();
          if (txt) datesArr.push(txt);
        });

        if (roleTitle) {
          experience.push({
            id: `exp-${idx}-${sIdx}`,
            title: cleanHtmlEntities(roleTitle),
            company: cleanHtmlEntities(companyName),
            dates: cleanHtmlEntities(datesArr.join(' ') || 'N/A'),
            skillsUsed: skills.slice(0, 5),
          });
        }
      });
    } else {
      // Single role company (e.g. Logixal Inc, Cognizant)
      const title = $(el).find('.list-item-heading span[dir="ltr"]').first().text().trim();
      const company = $(el).find('.body-small span[dir="ltr"]').first().text().trim() || companyName;
      const dateSpans = $(el).find('.body-small span.body-small');
      const datesArr: string[] = [];
      dateSpans.each((_, dEl) => {
        const txt = $(dEl).text().replace(/[\n\r\s]+/g, ' ').trim();
        if (txt) datesArr.push(txt);
      });

      if (title) {
        experience.push({
          id: `exp-${idx}`,
          title: cleanHtmlEntities(title),
          company: cleanHtmlEntities(company || 'Organization'),
          dates: cleanHtmlEntities(datesArr.join(' ') || 'N/A'),
          skillsUsed: skills.slice(0, 5),
        });
      }
    }
  });

  // Fallback for Desktop DOM or un-nested Experience lists
  if (experience.length === 0) {
    $('.experience-section li, .experience-item, #experience + div ul > li, .pv-profile-section--experience li').each((idx, el) => {
      const title = $(el).find('h3, .experience-item__title, .t-bold').first().text().trim();
      const company = $(el).find('.experience-item__subtitle, .t-normal').first().text().trim();
      const dates = $(el).find('.experience-item__duration, .t-black--light').first().text().trim();

      if (title || company) {
        experience.push({
          id: `exp-dom-${idx}`,
          title: cleanHtmlEntities(title || 'Position Title'),
          company: cleanHtmlEntities(company || 'Organization'),
          dates: cleanHtmlEntities(dates || 'N/A'),
          skillsUsed: skills.slice(0, 5),
        });
      }
    });
  }

  // Fallback from headline @Company pattern if no DOM nodes parsed
  if (experience.length === 0 && headline.includes('@')) {
    const parts = headline.split('@');
    const role = parts[0].replace(/\|.*$/, '').trim();
    const company = parts[1].split('|')[0].replace(/Inc\.?/i, 'Inc').trim();

    if (role && company) {
      experience.push({
        id: `exp-headline-1`,
        title: cleanHtmlEntities(role),
        company: cleanHtmlEntities(company),
        dates: 'Present',
        skillsUsed: skills.slice(0, 5),
      });
    }
  }

  if (experience.length > 0) {
    strategiesUsed.push('Mobile SSR Experience DOM Parser');
  }

  // 11. Extract ALL Education Records Dynamically from Mobile SSR & Desktop DOM
  $('.education-container ol > li, .education-container li.entity-lockup, .education-section li, .education-item, #education + div ul > li, .pv-profile-section--education li').each((idx, el) => {
    const schoolName = $(el).find('.list-item-heading span[dir="ltr"], h3, .education-item__title, .pv-entity__school-name, .school-name').first().text().trim();
    
    const degreeSpans = $(el).find('.body-small.text-color-text span[dir="ltr"], .education-item__degree, .degree-name');
    let degreeName = '';
    let fieldOfStudy = '';

    if (degreeSpans.length > 0) {
      degreeName = $(degreeSpans[0]).text().trim();
    }
    if (degreeSpans.length > 1) {
      fieldOfStudy = $(degreeSpans[1]).text().trim();
    }

    const dateSpans = $(el).find('.body-small.text-color-text-low-emphasis span.body-small, .education-item__duration, .date-range');
    let dates = '';
    if (dateSpans.length > 0) {
      const datesArr: string[] = [];
      dateSpans.each((_, dEl) => {
        const txt = $(dEl).text().replace(/[\n\r\s]+/g, ' ').trim();
        if (txt) datesArr.push(txt);
      });
      dates = datesArr.join(' ');
    }

    if (schoolName && !education.some(e => e.school.toLowerCase() === cleanHtmlEntities(schoolName).toLowerCase())) {
      education.push({
        id: `edu-dom-${idx}`,
        school: cleanHtmlEntities(schoolName),
        degree: cleanHtmlEntities(degreeName || 'Degree Program'),
        fieldOfStudy: cleanHtmlEntities(fieldOfStudy),
        dates: cleanHtmlEntities(dates || 'N/A'),
      });
    }
  });

  if (education.length > 0) {
    strategiesUsed.push('Mobile SSR Education DOM Parser');
  }

  // 12. Extract Certifications / Licenses Dynamically from Mobile SSR & Desktop DOM
  $(
    '.certifications-section li, .certifications-section .sub-list-item, .certifications-container ol > li, .license-certificate-container li, .certifications-item, #certifications + div ul > li, .pv-profile-section--certifications li, [data-section="certifications"] li, [data-section="licensesAndCertifications"] li'
  ).each((idx, el) => {
    const certTitle = $(el)
      .find('.list-item-heading, .certifications-item__title, h3, .t-bold')
      .first()
      .text()
      .replace(/…more|see less/gi, '')
      .trim();

    const issuer = $(el)
      .find('.list-item-detail .description, .list-item-detail, .certifications-item__subtitle, .t-normal, .body-small')
      .first()
      .text()
      .replace(/…more|see less/gi, '')
      .trim();

    const dateSpans = $(el).find('.body-small.text-color-text-low-emphasis span.body-small, .certifications-item__duration, .date-range');
    let issueDate = '';
    if (dateSpans.length > 0) {
      const datesArr: string[] = [];
      dateSpans.each((_, dEl) => {
        const txt = $(dEl).text().replace(/[\n\r\s]+/g, ' ').trim();
        if (txt) datesArr.push(txt);
      });
      issueDate = datesArr.join(' ');
    }

    const credentialId = $(el).find('.credential-id, .body-small:contains("Credential")').text().trim();

    if (certTitle && certTitle.length > 1 && !certifications.some((c) => c.name.toLowerCase() === cleanHtmlEntities(certTitle).toLowerCase())) {
      certifications.push({
        id: `cert-dom-${idx}`,
        name: cleanHtmlEntities(certTitle),
        issuer: cleanHtmlEntities(issuer || 'Issuing Organization'),
        issueDate: cleanHtmlEntities(issueDate || 'N/A'),
        credentialId: credentialId ? cleanHtmlEntities(credentialId) : undefined,
      });
    }
  });

  if (certifications.length > 0) {
    strategiesUsed.push('Mobile SSR Certifications DOM Parser');
  }

  // 13. Extract Languages Dynamically from Mobile SSR & Desktop DOM
  $(
    '.languages-section li, .languages-section .sub-list-item, .languages-container ol > li, .language-item, #languages + div ul > li, .pv-profile-section--languages li, [data-section="languages"] li'
  ).each((_, el) => {
    const langName = $(el)
      .find('.list-item-heading, .language-name, h3, .t-bold')
      .first()
      .text()
      .replace(/…more|see less/gi, '')
      .trim();

    const proficiency = $(el)
      .find('.body-small.text-color-text span[dir="ltr"], .body-small.text-color-text-low-emphasis span[dir="ltr"], .language-proficiency, .t-normal')
      .first()
      .text()
      .replace(/…more|see less/gi, '')
      .trim();

    if (langName && langName.length > 1) {
      const formatted = proficiency && proficiency !== langName ? `${cleanHtmlEntities(langName)} (${cleanHtmlEntities(proficiency)})` : cleanHtmlEntities(langName);
      if (!languages.includes(formatted)) {
        languages.push(formatted);
      }
    }
  });

  if (languages.length > 0) {
    strategiesUsed.push('Mobile SSR Languages DOM Parser');
  }

  name = cleanHtmlEntities(name);
  headline = cleanHtmlEntities(headline);
  location = cleanHtmlEntities(location);
  about = cleanHtmlEntities(about);

  const parsedData: ProfileData = {
    name: name || 'Profile Member',
    headline: headline || '',
    location: location || '',
    about: about || (name && headline ? `${name} is a ${headline}.` : ''),
    experience,
    education,
    skills,
    certifications,
    languages,
    profileImageUrls,
    rawMetadata: {
      ...rawMetadata,
      pageTitle: $('title').text().trim(),
      avatarExtracted: Boolean(profileImageUrls.avatar),
      bannerExtracted: Boolean(profileImageUrls.banner),
      jsonLdCount: jsonLdBlocks.length,
      openGraphCount: Object.keys(openGraph).length,
    },
  };

  const isParsedSuccessfully = Boolean(name && name !== 'LinkedIn' && name !== 'Profile Member');

  return {
    data: parsedData,
    strategiesUsed,
    rawJsonLd: jsonLdBlocks,
    openGraph,
    isParsedSuccessfully,
  };
}

function parseGitHubProfile(
  $: cheerio.CheerioAPI,
  url: string,
  openGraph: Record<string, string>,
  rawMetadata: Record<string, unknown>
): ProfileData {
  const name =
    $('.p-name').text().trim() ||
    openGraph['og:title']?.replace(/\(.*?\)/g, '').trim() ||
    $('.vcard-fullname').text().trim() ||
    '';

  const username = $('.p-nickname').text().trim() || url.split('github.com/')[1]?.split('/')[0] || '';
  const headline = $('.p-note').text().trim() || openGraph['og:description'] || (username ? `@${username}` : '');
  const location = $('[itemprop="homeLocation"], .p-label').text().trim() || '';
  const about = $('.p-note').text().trim() || '';
  const avatar = $('.avatar-user').attr('src') || openGraph['og:image'] || '';
  const company = $('[itemprop="worksFor"], .p-org').text().trim();

  const experience: ExperienceItem[] = [];
  const skills: string[] = [];

  $('.pinned-item-list-item').each((idx, el) => {
    const repoName = $(el).find('.repo').text().trim();
    const repoDesc = $(el).find('.pinned-item-desc').text().trim();
    const lang = $(el).find('[itemprop="programmingLanguage"]').text().trim();

    if (repoName) {
      experience.push({
        id: `gh-repo-${idx}`,
        title: repoName,
        company: company || 'GitHub Repository',
        dates: 'Public Project',
        description: repoDesc,
        skillsUsed: lang ? [lang] : [],
      });
      if (lang && !skills.includes(lang)) {
        skills.push(lang);
      }
    }
  });

  return {
    name: name || username || 'GitHub User',
    headline,
    location,
    about,
    experience,
    education: [],
    skills,
    certifications: [],
    languages: [],
    profileImageUrls: {
      avatar: avatar ? (avatar.startsWith('http') ? avatar : `https://github.com${avatar}`) : undefined,
    },
    rawMetadata: {
      ...rawMetadata,
      githubUsername: username,
    },
  };
}
