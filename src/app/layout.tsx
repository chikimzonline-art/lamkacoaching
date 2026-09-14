import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/public/theme-provider";
import { SessionProvider } from "@/components/providers/session-provider";
import { SettingsProvider } from "@/components/providers/settings-provider";
import { db } from "@/lib/db";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#050B44",
};

const siteUrl = process.env.NEXTAUTH_URL || "https://lamkacoaching.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Lamka Coaching Center - Competitive Exams & Computer Training",
    template: "%s | Lamka Coaching Center",
  },
  description: "Expert coaching for SSC, Banking, UPSC, Railway exams. Professional computer training (CCC, Tally, Web Design, Python). Study cabin facilities. Located in Lamka, Churachandpur, Manipur.",
  keywords: ["coaching center", "competitive exams", "SSC CGL", "IBPS", "computer training", "CCC", "Tally", "study cabin", "Lamka", "Churachandpur", "Manipur"],
  openGraph: {
    title: "Lamka Coaching Center - Center of Excellence",
    description: "Expert coaching for competitive exams, professional computer training, and dedicated study spaces.",
    url: siteUrl,
    siteName: "Lamka Coaching Center",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Lamka Coaching Center - Center of Excellence",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Lamka Coaching Center - Center of Excellence",
    description: "Expert coaching for competitive exams, professional computer training, and dedicated study spaces.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let settingsMap: Record<string, string> = {};
  try {
    const records = await db.setting.findMany();
    records.forEach(r => {
      settingsMap[r.key] = r.value;
    });
  } catch (error) {
    console.error("Failed to load settings in RootLayout", error);
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <SessionProvider>
          <ThemeProvider>
            <SettingsProvider settings={settingsMap}>
              {children}
              <Toaster richColors position="top-center" />
            </SettingsProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}

