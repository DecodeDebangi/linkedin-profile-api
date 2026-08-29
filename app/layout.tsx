import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Profile Data Extraction Utility | Next.js HTTP Scraper Engine',
  description:
    'Production-ready structured data extraction utility for profile data (LinkedIn, GitHub, web profiles) using direct server-to-server HTTP handling and clean JSON schema mapping.',
  keywords: [
    'Profile Scraper',
    'Data Extraction',
    'Next.js',
    'TypeScript',
    'Direct HTTP Scraping',
    'JSON-LD Microdata',
    'JSON Schema',
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body suppressHydrationWarning className="antialiased bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
