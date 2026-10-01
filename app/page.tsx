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
  const restaurant = restaurants[routeParams.restaurant ?? defaultRestaurantSlug];
  let companyId = restaurant.companyId;
  let branchCode = restaurant.branchCode;

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
        // 1. Fetch phone numbers for this company from our mock db
        const dbRes = await fetch(`/api/company?companyId=${encodeURIComponent(companyId)}&branchCode=${encodeURIComponent(branchCode)}`);
        if (!dbRes.ok) throw new Error("Failed to fetch company data");
        const companyData = await dbRes.json();
        
        const waiterPhones = companyData.waiters
          ?.filter((waiter: { phone: string; status?: string }) => waiter.status !== "terminated")
          .map((waiter: { phone: string }) => waiter.phone) || [];

        if (waiterPhones.length === 0) {
          setWaiters([]);
          setLoading(false);
          return;
        }

        // 2. Fetch waiter details from Hulubeje API for each phone
        const results = await Promise.all(
          waiterPhones.map(async (phone: string) => {
            const res = await fetch(
              `https://v7-hulubeje.cnetcommerce.com/api/waiter/get?phoneNumber=${phone}&companyId=${companyId}`,
              {
                headers: {
                  "x-api-key": "5D5EAFF4-D29A-485B-BDB9-785EF86FFFAE",
                  Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwOTY3OTk4MDQwIiwianRpIjoiNDQ3OTgwNjEwQTA0RjYyNDk3MTcxN0NEMTlGNkZCMzQ0MTg4Njk4N0FEQTQ3M0IxOTk4MjRCMzM4QjVBNUE3MTFBRTFGREY2NUIwRjA4NzUxRDQyMDZCQTBDQUExREUxRkJCNEY2MzMyMDlEQUY1RkM3NzE0MzEyQTlFOThFNEIiLCJleHAiOjE4MDY2ODc0ODUsImlzcyI6Ikh1bHViZWplIiwiYXVkIjoiSHVsdWJlamUifQ.8cxAjbBdJxHPvSxLj4mo8bF1rbT1Oaux7Mteox3Um3Y"
                  ,
                },
              }
            );

            const text = await res.text();
            if (!text) return null;

            const result = JSON.parse(text);
            if (result.isSuccessful) {
              return result.data;
            }
            return null;
          })
        );

        const validWaiters = results
          .filter(Boolean)
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

  if (!companyId || !branchCode) {
    return (
      <main className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="bg-white p-6 rounded-xl shadow text-center">
          <h2 className="text-xl font-bold text-red-600">Invalid Link</h2>
          <p className="text-gray-600 mt-2">Missing company or branch info.</p>
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
                        ⭐ {w.rating || 0}
                      </p>
                    </div>

                    <div className="text-gray-400 text-xl">→</div>
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