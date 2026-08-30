export interface ExperienceItem {
  id: string;
  title: string;
  company: string;
  companyUrl?: string;
  location?: string;
  dates: string;
  startDate?: string;
  endDate?: string;
  duration?: string;
  description?: string;
  skillsUsed?: string[];
}

export interface EducationItem {
  id: string;
  school: string;
  degree: string;
  fieldOfStudy?: string;
  dates: string;
  grade?: string;
  description?: string;
}

export interface CertificationItem {
  id: string;
  name: string;
  issuer: string;
  issueDate: string;
  expirationDate?: string;
  credentialId?: string;
  credentialUrl?: string;
}

export interface ProfileImageUrls {
  avatar?: string;
  banner?: string;
  thumbnail?: string;
}

export interface ProfileData {
  name: string;
  headline: string;
  location: string;
  about: string;
  experience: ExperienceItem[];
  education: EducationItem[];
  skills: string[];
  certifications: CertificationItem[];
  languages: string[];
  profileImageUrls: ProfileImageUrls;
}

export interface ScrapeRequest {
  url: string;
  cookiesOverride?: string;
  userAgentOverride?: string;
  forceMock?: boolean;
}

export interface ScrapeMetadata {
  scrapedAt: string;
  url: string;
  platform: 'linkedin';
  statusCode: number;
  isMock: boolean;
  source: 'live_http' | 'json_ld' | 'mock_fallback' | 'custom_session';
  warningMessage?: string;
  cookiesConfigured: boolean;
  responseHeaders?: Record<string, string>;
  parsingStrategy: string[];
}

export interface ScrapeResponse {
  success: boolean;
  data: ProfileData;
  metadata: ScrapeMetadata;
  error?: string;
}
