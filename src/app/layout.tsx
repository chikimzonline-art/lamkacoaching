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
      description: "Expert coaching for competitive exams, professional computer training, and dedicated study spaces in Lamka, Churachandpur, Manipur.",
      type: "website",
      locale: "en_IN",
      url: "https://lamkacoaching.in",
      siteName: "Lamka Coaching Center",
      images: [
        {
          url: "https://lamkacoaching.in/og-image.jpg",
          width: 1200,
          height: 630,
          alt: "Lamka Coaching Center — Competitive Exams & Computer Training",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Lamka Coaching Center",
      description: "Expert coaching for competitive exams & computer training in Lamka, Churachandpur, Manipur.",
      images: ["https://lamkacoaching.in/og-image.jpg"],
    },
    alternates: {
      canonical: "https://lamkacoaching.in",
    },
    icons: {
      icon: faviconUrl,
    },
    verification: {
      google: "xGq4I9D02iucDgBPghLcTM01IlhK0ZsqdPRRBcVbtQ8",
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetch business settings for structured data
  let businessPhone = "";
  let businessEmail = "";
  let businessAddress = "Lamka, Churachandpur, Manipur";
  let businessName = "Lamka Coaching Center";

  try {
    const settings = await db.setting.findMany({
      where: { key: { in: ["businessPhone", "businessEmail", "businessAddress", "businessName"] } },
    });
    const settingsMap = Object.fromEntries(settings.map((s) => [s.key, s.value]));
    businessPhone = settingsMap.businessPhone ?? "";
    businessEmail = settingsMap.businessEmail ?? "";
    businessAddress = settingsMap.businessAddress ?? businessAddress;
    businessName = settingsMap.businessName ?? businessName;
  } catch {
    // Use fallback values
  }

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": ["EducationalOrganization", "LocalBusiness"],
    name: businessName,
    url: "https://lamkacoaching.in",
    logo: "https://lamkacoaching.in/logo.svg",
    image: "https://lamkacoaching.in/og-image.jpg",
    description:
      "Expert coaching for competitive government exams (SSC, Banking, UPSC, Railway) and professional computer training (CCC, Tally, Web Design, Python) in Lamka, Churachandpur, Manipur.",
    address: {
      "@type": "PostalAddress",
      streetAddress: businessAddress,
      addressLocality: "Lamka",
      addressRegion: "Manipur",
      addressCountry: "IN",
    },
    ...(businessPhone && { telephone: businessPhone }),
    ...(businessEmail && { email: businessEmail }),
    sameAs: ["https://lamkacoaching.in"],
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Courses & Programs",
      itemListElement: [
        { "@type": "Course", name: "SSC CGL Coaching", provider: { "@type": "Organization", name: businessName } },
        { "@type": "Course", name: "IBPS Banking Coaching", provider: { "@type": "Organization", name: businessName } },
        { "@type": "Course", name: "CCC Computer Course (NIELIT)", provider: { "@type": "Organization", name: businessName } },
        { "@type": "Course", name: "Tally Prime with GST", provider: { "@type": "Organization", name: businessName } },
        { "@type": "Course", name: "Web Design & Development", provider: { "@type": "Organization", name: businessName } },
        { "@type": "Course", name: "Python Programming", provider: { "@type": "Organization", name: businessName } },
      ],
    },
  };

  return (
    <html lang="en-IN" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
        />
        <ThemeProvider>
          {children}
          <Toaster richColors position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
