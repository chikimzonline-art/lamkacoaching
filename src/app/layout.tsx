import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/public/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { db } from "@/lib/db";

export async function generateMetadata(): Promise<Metadata> {
  let faviconUrl = "/logo.svg";
  try {
    const faviconSetting = await db.setting.findUnique({
      where: { key: "favicon_url" },
    });
    if (faviconSetting?.value) {
      faviconUrl = faviconSetting.value;
    } else {
      const logoSetting = await db.setting.findUnique({
        where: { key: "logo_url" },
      });
      if (logoSetting?.value) {
        faviconUrl = logoSetting.value;
      }
    }
  } catch (error) {
    console.error("Failed to fetch favicon for metadata:", error);
  }

  return {
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
      icon: faviconUrl,
    },
    verification: {
      google: "xGq4I9D02iucDgBPghLcTM01IlhK0ZsqdPRRBcVbtQ8",
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider>
          {children}
          <Toaster richColors position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
