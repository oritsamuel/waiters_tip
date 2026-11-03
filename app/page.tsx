"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function RedirectToTipPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const companyId = searchParams.get("companyId");
    const branchId = searchParams.get("branchId");

    if (companyId && branchId) {
      const url = new URL("/tip", window.location.origin);
      url.searchParams.set("companyId", companyId);
      url.searchParams.set("branchId", branchId);
      router.replace(url.pathname + url.search);
      return;
    }

    router.replace("/tip");
  }, [router, searchParams]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="rounded-xl bg-white p-6 text-center shadow-lg">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-red-600" />
        <p className="text-sm text-gray-600">Loading company information...</p>
      </div>
    </main>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">Loading...</div>}>
      <RedirectToTipPage />
    </Suspense>
  );
}


