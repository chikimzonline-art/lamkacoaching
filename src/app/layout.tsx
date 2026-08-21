import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/public/theme-provider";
import { SessionProvider } from "@/components/providers/session-provider";
import { SettingsProvider } from "@/components/providers/settings-provider";
import { CapacitorProvider } from "@/components/providers/capacitor-provider";
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

export const metadata: Metadata = {
  title: {
    default: "Lamka Coaching Center - Competitive Exams & Computer Training",
    template: "%s | Lamka Coaching Center",
  },
  description: "Expert coaching for SSC, Banking, UPSC, Railway exams. Professional computer training (CCC, Tally, Web Design, Python). Study cabin facilities. Located in Lamka, Churachandpur, Manipur.",
  keywords: ["coaching center", "competitive exams", "SSC CGL", "IBPS", "computer training", "CCC", "Tally", "study cabin", "Lamka", "Churachandpur", "Manipur"],
  openGraph: {
    title: "Lamka Coaching Center - Center of Excellence",
    description: "Expert coaching for competitive exams, professional computer training, and dedicated study spaces.",
    type: "website",
    locale: "en_IN",
  },
  icons: {
    icon: "/logo.svg",
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
              <CapacitorProvider>
                {children}
                <Toaster richColors position="top-center" />
              </CapacitorProvider>
            </SettingsProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}

