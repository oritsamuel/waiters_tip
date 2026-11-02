"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeftIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CurrencyDollarIcon,
  StarIcon,
  TrophyIcon,
} from "@heroicons/react/24/solid";

const DEFAULT_COMPANY_ID = "50301";
const DEFAULT_BRANCH_CODE = "44496";

type Transaction = {
  id: string;
  tipAmount: number;
  rating: number;
  comment: string;
  timestamp: string;
};

type WaiterRow = {
  waiterPhoneNumber: string;
  fullName: string;
  photo: string;
  totalTips: number;
  averageRating: number;
  transactions: Transaction[];
  status: "active" | "terminated";
};

export default function ReportDashboard() {
  const [waiters, setWaiters] = useState<WaiterRow[]>([]);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadWaiters() {
      try {
        const res = await fetch(
          `/api/waiter-tips?companyId=${encodeURIComponent(DEFAULT_COMPANY_ID)}&branchCode=${encodeURIComponent(DEFAULT_BRANCH_CODE)}`
        );

        if (!res.ok) {
          throw new Error("Failed to fetch waiter data");
        }

        const payload = await res.json();
        const rows = Array.isArray(payload?.data) ? payload.data : [];

        const formatted: WaiterRow[] = rows.map((waiter: any) => ({
          waiterPhoneNumber: waiter.waiterPhoneNumber || waiter.phone,
          fullName: waiter.fullName || `Waiter (${waiter.waiterPhoneNumber || waiter.phone})`,
          photo: waiter.photo || "/waiter.png",
          totalTips: Number(waiter.totalTips || 0),
          averageRating: Number(waiter.averageRating || 0),
          transactions: Array.isArray(waiter.transactions) ? waiter.transactions : [],
          status: waiter.status === "terminated" ? "terminated" : "active",
        }));

        if (isMounted) {
          setWaiters(formatted);
        }
      } catch (error) {
        console.error("Failed to load waiters from database", error);
        if (isMounted) setWaiters([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadWaiters();
    return () => {
      isMounted = false;
    };
  }, []);

  const totalTips = waiters.reduce((sum, waiter) => sum + waiter.totalTips, 0);
  const averageRating = waiters.length
    ? waiters.reduce((sum, waiter) => sum + waiter.averageRating, 0) / waiters.length
    : 0;
  const topEarner = waiters.length
    ? [...waiters].sort((a, b) => b.totalTips - a.totalTips)[0].fullName
    : "N/A";

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 px-4 py-10 md:px-10">
        <div className="mx-auto max-w-6xl rounded-3xl bg-white p-8 text-center shadow-sm">
          <p className="text-lg font-semibold text-gray-700">Loading waiter data from the database...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 py-10 px-4 md:px-10 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-red-100">
          <div>
            <h1 className="text-3xl font-extrabold text-red-600 tracking-tight">Analytics Dashboard</h1>
            <p className="text-gray-500 font-medium mt-1">Overview of your waiters&apos; performance and tips.</p>
          </div>
          <Link
            href="/company-admin/login"
            className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-xl font-bold hover:bg-red-100 transition-colors border border-red-200"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Back to Login
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-3xl p-6 shadow-lg border border-red-100 flex items-center gap-4">
            <div className="p-4 bg-red-500 rounded-2xl text-white shadow-inner">
              <CurrencyDollarIcon className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total Tips</p>
              <h2 className="text-3xl font-black text-gray-900">{totalTips.toLocaleString()} ETB</h2>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-lg border border-red-100 flex items-center gap-4">
            <div className="p-4 bg-yellow-400 rounded-2xl text-white shadow-inner">
              <StarIcon className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Average Rating</p>
              <h2 className="text-3xl font-black text-gray-900">{averageRating.toFixed(1)} <span className="text-lg text-gray-400">/ 5.0</span></h2>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-lg border border-red-100 flex items-center gap-4">
            <div className="p-4 bg-blue-500 rounded-2xl text-white shadow-inner">
              <TrophyIcon className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Top Earner</p>
              <h2 className="text-2xl font-black text-gray-900 truncate">{topEarner}</h2>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-red-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-xl font-bold text-gray-800">Waiter Performance List</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b-2 border-gray-100">
                  <th className="p-5 text-sm font-bold text-gray-500 uppercase tracking-wider">Waiter</th>
                  <th className="p-5 text-sm font-bold text-gray-500 uppercase tracking-wider">Phone Number</th>
                  <th className="p-5 text-sm font-bold text-gray-500 uppercase tracking-wider">Total Tips</th>
                  <th className="p-5 text-sm font-bold text-gray-500 uppercase tracking-wider">Avg Rating</th>
                  <th className="p-5 text-sm font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {waiters.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-sm text-gray-500">
                      No waiters found in the database.
                    </td>
                  </tr>
                ) : (
                  waiters.map((waiter) => (
                    <React.Fragment key={waiter.waiterPhoneNumber}>
                      <tr className={`hover:bg-red-50/30 transition-colors ${expandedRow === waiter.waiterPhoneNumber ? "bg-red-50/30" : "bg-white"}`}>
                        <td className="p-5">
                          <div className="flex items-center gap-3">
                            <img src={waiter.photo} className="w-12 h-12 rounded-full object-cover border-2 border-gray-100 shadow-sm" alt={waiter.fullName} />
                            <span className="font-bold text-gray-900 text-lg">{waiter.fullName}</span>
                          </div>
                        </td>
                        <td className="p-5 text-gray-600 font-medium">{waiter.waiterPhoneNumber}</td>
                        <td className="p-5 font-black text-red-600 text-lg">{waiter.totalTips.toLocaleString()} ETB</td>
                        <td className="p-5">
                          <div className="flex items-center gap-1 font-bold text-gray-800">
                            <StarIcon className="w-5 h-5 text-yellow-400" />
                            {waiter.averageRating.toFixed(1)}
                          </div>
                        </td>
                        <td className="p-5 text-right">
                          <button
                            onClick={() => setExpandedRow(expandedRow === waiter.waiterPhoneNumber ? null : waiter.waiterPhoneNumber)}
                            className="inline-flex items-center gap-1 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm outline-none"
                          >
                            Transactions
                            {expandedRow === waiter.waiterPhoneNumber ? (<ChevronUpIcon className="w-4 h-4" />) : (<ChevronDownIcon className="w-4 h-4" />)}
                          </button>
                        </td>
                      </tr>

                      {expandedRow === waiter.waiterPhoneNumber && (
                        <tr>
                          <td colSpan={5} className="bg-gray-50 px-5 py-4">
                            <div className="space-y-3">
                              {waiter.transactions.length === 0 ? (
                                <p className="text-sm text-gray-500">No transactions found for this waiter.</p>
                              ) : (
                                waiter.transactions.map((transaction) => (
                                  <div key={transaction.id} className="rounded-xl border border-gray-200 bg-white p-4">
                                    <div className="flex items-center justify-between gap-3">
                                      <p className="font-semibold text-gray-900">{transaction.tipAmount.toLocaleString()} ETB</p>
                                      <div className="flex items-center gap-1 text-yellow-400">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                          <StarIcon key={star} className={`w-4 h-4 ${star <= transaction.rating ? "text-yellow-400" : "text-gray-200"}`} />
                                        ))}
                                      </div>
                                    </div>
                                    <p className="mt-1 text-xs text-gray-400">{new Date(transaction.timestamp).toLocaleString()}</p>
                                    {transaction.comment && <p className="mt-2 text-sm italic text-gray-600">&ldquo;{transaction.comment}&rdquo;</p>}
                                  </div>
                                ))
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
