import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { AuthPageContent } from "./login-client";
import { db } from "@/lib/db";

export default async function UnifiedAuthPage() {
  // Fetch logo setting from DB
  let logoUrl = null;
  try {
    const setting = await db.setting.findUnique({
      where: { key: 'logo_url' }
    });
    if (setting?.value) {
      logoUrl = setting.value;
    }
  } catch (error) {
    console.error("Failed to fetch logo_url", error);
  }

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-cyan-500" /></div>}>
      <AuthPageContent logoUrl={logoUrl} />
    </Suspense>
  );
}
