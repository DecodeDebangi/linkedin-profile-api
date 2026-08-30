import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LinkedIn Profile API | Structured Data Extraction Utility',
  description:
    'Production-ready structured data extraction API for LinkedIn profiles using direct server-to-server HTTP handling and clean JSON schema mapping.',
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
