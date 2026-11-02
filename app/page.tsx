"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { defaultRestaurantSlug, restaurants } from "@/lib/restaurants";

type Waiter = {
  photo?: string;
  fullName?: string;
  rating?: number;
  phoneNumber?: string;
  companyLogo?: string;
  company?: {
    logo?: string;
    name?: string;
  };
};

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const routeParams = useParams<{ restaurant?: string }>();
  const [waiters, setWaiters] = useState<Waiter[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const dataParam = searchParams.get("data");
  const restaurant = routeParams.restaurant ? restaurants[routeParams.restaurant] : undefined;
  let companyId = restaurant?.companyId ?? "";
  let branchCode = restaurant?.branchCode ?? "";

  if (dataParam) {
    try {
      const decoded = JSON.parse(atob(dataParam));
      if (decoded.companyId) companyId = decoded.companyId;
      if (decoded.branchCode) branchCode = decoded.branchCode;
    } catch (e) {
      console.error("Invalid data parameter", e);
    }
  }

  useEffect(() => {
    const fetchWaiters = async () => {
      if (!companyId || !branchCode) {
        setLoading(false);
        return;
      }

      try {
        const dbRes = await fetch(`/api/waiter-tips?companyId=${encodeURIComponent(companyId)}&branchCode=${encodeURIComponent(branchCode)}&status=active`);
        if (!dbRes.ok) throw new Error("Failed to fetch waiter data");
        const payload = await dbRes.json();
        const waitersFromApi = Array.isArray(payload?.data) ? payload.data : [];

        const validWaiters = waitersFromApi
          .map((waiter: any) => ({
            ...waiter,
            phoneNumber: waiter.waiterPhoneNumber || waiter.phone,
            photo: waiter.photo || "/waiter.png",
          }))
          .sort((a: any, b: any) =>
            (a.fullName || "").localeCompare(b.fullName || "")
          );
        setWaiters(validWaiters);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchWaiters();
  }, [companyId, branchCode]);

  if (!companyId || !branchCode || !restaurant) {
    return (
      <main className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="bg-white p-6 rounded-xl shadow text-center">
          <h2 className="text-xl font-bold text-red-600">No active restaurant link</h2>
          <p className="text-gray-600 mt-2">This page is empty until a valid restaurant link is provided.</p>
        </div>
      </main>
    );
  }

  const companyLogo = waiters.length > 0 && waiters[0].companyLogo ? waiters[0].companyLogo : "/waiter.png";

  return (
    <main className="flex justify-center items-start min-h-screen bg-gray-100 py-10">
      <div className="bg-white w-[350px] rounded-xl shadow-lg p-6 text-center space-y-6 relative">

        <div className="bg-white border-1 border-yellow-300 rounded-xl shadow-lg pt-14 pb-6 px-4 relative text-center mt-6">
          <img
            src={companyLogo}
            className="w-20 h-20 rounded-full absolute -top-10 left-1/2 transform -translate-x-1/2 border-2 border-yellow-300 object-cover bg-white"
          />
          <h1 className="text-xl font-bold text-black text-center mb-6 mt-2">
            {restaurant.name} Waiters
          </h1>
          <input
            type="text"
            placeholder="Search waiter..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg mb-4 text-black focus:ring-2 focus:ring-yellow-400 outline-none"
          />

          {loading ? (
            <div className="text-gray-500 py-4">Loading waiters...</div>
          ) : waiters.length === 0 ? (
            <div className="text-gray-500 py-4">No waiters available.</div>
          ) : (
            <div className="space-y-4">
              {waiters
                .filter((w: any) =>
                  (w.fullName || "")
                    .toLowerCase()
                    .includes(search.toLowerCase())
                )
                .map((w) => (
                  <div
                    key={w.phoneNumber}
                    onClick={() => {
                      const data = btoa(JSON.stringify({ 
                        phone: w.phoneNumber, 
                        companyId, 
                        branchCode, 
                        companyLogo 
                      }));
                      router.push(`/tip?data=${data}`);
                    }}
                    className="bg-white border border-gray-100 rounded-xl shadow p-4 flex items-center gap-4 cursor-pointer hover:shadow-lg transition-shadow"
                  >
                    <img
                      src={w.photo || "/waiter.png"}
                      className="w-14 h-14 rounded-full object-cover"
                    />

                    <div className="flex-1 text-left">
                      <h2 className="text-black font-semibold">
                        {w.fullName}
                      </h2>
                      <p className="text-sm text-gray-500">
                        â­ {w.rating || 0}
                      </p>
                    </div>

                    <div className="text-gray-400 text-xl">â†’</div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen bg-gray-100">Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}


