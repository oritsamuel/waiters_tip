"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { 
  ArrowLeftIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  StarIcon
} from "@heroicons/react/24/solid";

type Transaction = {
  id: string;
  waiterPhone: string;
  payerPhone: string;
  tipAmount: number;
  rating: number;
  comment: string;
  timestamp: string;
};

type WaiterProfile = {
  waiterPhoneNumber: string;
  fullName: string;
  photo: string;
  totalTips: number;
  averageRating: number;
  transactions: Transaction[];
};

function ReportDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const companyId = searchParams.get("companyId");
  const branchCode = searchParams.get("branchCode");

  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [waiters, setWaiters] = useState<WaiterProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const toggleRow = (phone: string) => {
    setExpandedRow(expandedRow === phone ? null : phone);
  };

  useEffect(() => {
    if (!companyId || !branchCode) {
      router.push("/company-admin/login");
      return;
    }

    const fetchReports = async () => {
      try {
        // Fetch DB data
        const res = await fetch(`/api/company?companyId=${encodeURIComponent(companyId)}&branchCode=${encodeURIComponent(branchCode)}`);
        if (!res.ok) throw new Error("Failed to fetch data");
        const companyData = await res.json();
        
        const waiterPhones = companyData.waiters?.map((w: any) => w.phone) || [];
        const allTransactions: Transaction[] = companyData.transactions || [];

        // Fetch waiter details from Hulubeje
        const profileResults = await Promise.all(
          waiterPhones.map(async (phone: string) => {
            try {
              const apiRes = await fetch(
                `https://v7-hulubeje.cnetcommerce.com/api/waiter/get?phoneNumber=${phone}&companyId=${companyId}`,
                {
                  headers: {
                    "x-api-key": "5D5EAFF4-D29A-485B-BDB9-785EF86FFFAE",
                    Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwOTY3OTk4MDQwIiwianRpIjoiNDQ3OTgwNjEwQTA0RjYyNDk3MTcxN0NEMTlGNkZCMzQ0MTg4Njk4N0FEQTQ3M0IxOTk4MjRCMzM4QjVBNUE3MTFBRTFGREY2NUIwRjA4NzUxRDQyMDZCQTBDQUExREUxRkJCNEY2MzMyMDlEQUY1RkM3NzE0MzEyQTlFOThFNEIiLCJleHAiOjE4MDY2ODc0ODUsImlzcyI6Ikh1bHViZWplIiwiYXVkIjoiSHVsdWJlamUifQ.8cxAjbBdJxHPvSxLj4mo8bF1rbT1Oaux7Mteox3Um3Y"
                  },
                }
              );
              const text = await apiRes.text();
              const result = JSON.parse(text);
              if (result.isSuccessful) {
                return { phone, profile: result.data };
              }
            } catch(e) {}
            return { phone, profile: null };
          })
        );

        // Aggregate transactions by waiter
        const profiles: WaiterProfile[] = profileResults.map((p) => {
          const txns = allTransactions.filter(t => t.waiterPhone === p.phone);
          const totalTips = txns.reduce((sum, t) => sum + t.tipAmount, 0);
          const avgRating = txns.length > 0 ? (txns.reduce((sum, t) => sum + t.rating, 0) / txns.length) : 0;
          
          return {
            waiterPhoneNumber: p.phone,
            fullName: p.profile?.fullName || `Waiter (${p.phone})`,
            photo: p.profile?.photo || "/waiter.png",
            totalTips,
            averageRating: Number(avgRating.toFixed(1)),
            transactions: txns.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
          };
        });

        // Sort by total tips descending
        profiles.sort((a,b) => b.totalTips - a.totalTips);
        
        setWaiters(profiles);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [companyId, branchCode, router]);

  if (!companyId || !branchCode) return null;

  const totalTips = waiters.reduce((sum, w) => sum + w.totalTips, 0);
  const activeWaitersWithRating = waiters.filter(w => w.transactions.length > 0);
  const averageRating = activeWaitersWithRating.length > 0
    ? (activeWaitersWithRating.reduce((sum, w) => sum + w.averageRating, 0) / activeWaitersWithRating.length).toFixed(1)
    : "0.0";
  const topEarner = waiters.length > 0 && waiters[0].totalTips > 0 ? waiters[0].fullName : "N/A";

  return (
    <main className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 py-10 px-4 md:px-10 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-red-100">
          <div>
            <h1 className="text-3xl text-red-600 tracking-tight">Analytics Dashboard</h1>
            <p className="text-gray-500 mt-1">Overview of your waiters' performance and tips.</p>
          </div>
          <Link 
            href={`/company-admin?companyId=${encodeURIComponent(companyId)}&branchCode=${encodeURIComponent(branchCode)}`}
            className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-xl hover:bg-red-100 transition-colors border border-red-200"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Back to Waiters
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-10 text-gray-500">Loading reports...</div>
        ) : (
          <>
            <div className="bg-white rounded-3xl shadow-xl border border-red-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                <h2 className="text-xl text-gray-800">Waiter Performance List</h2>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white border-b-2 border-gray-100">
                      <th className="p-5 text-sm text-gray-500 uppercase tracking-wider">Waiter</th>
                      <th className="p-5 text-sm text-gray-500 uppercase tracking-wider">Phone Number</th>
                      <th className="p-5 text-sm text-gray-500 uppercase tracking-wider">Total Tips</th>
                      <th className="p-5 text-sm text-gray-500 uppercase tracking-wider">Avg Rating</th>
                      <th className="p-5 text-sm text-gray-500 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {waiters.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-gray-500 italic">
                          No waiters found.
                        </td>
                      </tr>
                    )}
                    {waiters.map((waiter) => (
                      <React.Fragment key={waiter.waiterPhoneNumber}>
                        <tr 
                          className={`hover:bg-red-50/30 transition-colors ${expandedRow === waiter.waiterPhoneNumber ? 'bg-red-50/30' : 'bg-white'}`}
                        >
                          <td className="p-5">
                            <div className="flex items-center gap-3">
                              <img src={waiter.photo} className="w-12 h-12 rounded-full object-cover border-2 border-gray-100 shadow-sm" alt={waiter.fullName} />
                              <span className="text-gray-900 text-base">{waiter.fullName}</span>
                            </div>
                          </td>
                          <td className="p-5 text-gray-600">{waiter.waiterPhoneNumber}</td>
                          <td className="p-5 text-red-600 text-base">{waiter.totalTips} ETB</td>
                          <td className="p-5">
                            <div className="flex items-center gap-1 text-gray-800">
                              <StarIcon className="w-5 h-5 text-yellow-400" />
                              {waiter.averageRating}
                            </div>
                          </td>
                          <td className="p-5 text-right">
                            <button 
                              onClick={() => toggleRow(waiter.waiterPhoneNumber)}
                              className="inline-flex items-center gap-1 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm outline-none"
                            >
                              Transactions
                              {expandedRow === waiter.waiterPhoneNumber ? (
                                <ChevronUpIcon className="w-4 h-4" />
                              ) : (
                                <ChevronDownIcon className="w-4 h-4" />
                              )}
                            </button>
                          </td>
                        </tr>
                        
                        {/* EXPANDED TRANSACTIONS ROW */}
                        {expandedRow === waiter.waiterPhoneNumber && (
                          <tr className="bg-gray-50/80 shadow-inner">
                            <td colSpan={5} className="p-0">
                              <div className="p-6 border-l-4 border-red-500">
                                <div className="divide-y divide-gray-100">
                                  {waiter.transactions.map((txn) => (
                                    <div key={txn.id} className="flex items-center gap-4 py-3 text-sm text-gray-700">
                                      <span className="text-red-600 w-24 shrink-0">{txn.tipAmount} ETB</span>
                                      <div className="flex shrink-0">
                                        {[...Array(5)].map((_, i) => (
                                          <StarIcon key={i} className={`w-3.5 h-3.5 ${i < txn.rating ? 'text-yellow-400' : 'text-gray-200'}`} />
                                        ))}
                                      </div>
                                      {txn.payerPhone && (
                                        <span className="text-gray-500 shrink-0">📱 {txn.payerPhone}</span>
                                      )}
                                      {txn.comment && (
                                        <span className="text-gray-400 italic truncate">"{txn.comment}"</span>
                                      )}
                                      <span className="ml-auto text-gray-400 shrink-0">
                                        {new Date(txn.timestamp).toLocaleString()}
                                      </span>
                                    </div>
                                  ))}
                                  
                                  {waiter.transactions.length === 0 && (
                                    <p className="text-gray-500 italic">No transactions recorded yet.</p>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

export default function ReportDashboard() {
  return (
    <Suspense fallback={null}>
      <ReportDashboardContent />
    </Suspense>
  );
}
