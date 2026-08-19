import { redirect } from "next/navigation";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams?: Promise<{ courseId?: string; batchId?: string }>;
}) {
  const params = searchParams ? await searchParams : {};
  if (params.courseId) {
    const callback = `/dashboard/courses?courseId=${encodeURIComponent(params.courseId)}${
      params.batchId ? `&batchId=${encodeURIComponent(params.batchId)}` : ''
    }`;
    redirect(`/login?tab=register&callbackUrl=${encodeURIComponent(callback)}`);
  }
  redirect("/login?tab=register");
}

