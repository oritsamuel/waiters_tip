"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  CurrencyDollarIcon,
  StarIcon,
  TrophyIcon,
  ArrowLeftIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ChatBubbleBottomCenterTextIcon,
  ClockIcon
} from "@heroicons/react/24/solid";

// --- MOCK DATA ---
// Replace this with your actual fetch call once the backend API is ready
const MOCK_API_RESPONSE = {
  isSuccessful: true,
  summary: {
    totalTips: 12450,
    averageRating: 4.8,
    topEarner: "Kaleb Tilahun",
  },
  waiters: [
    {
      waiterPhoneNumber: "0987654321",
      fullName: "Kaleb Tilahun",
      photo: "/waiter.png",
      totalTips: 4750,
      averageRating: 4.9,
      transactions: [
        { id: 1, tipAmount: 300, rating: 5, comment: "Outstanding service, very attentive!", timestamp: "2026-08-11T20:30:00Z" },
        { id: 2, tipAmount: 100, rating: 4, comment: "Good job", timestamp: "2026-08-11T18:45:00Z" },
        { id: 3, tipAmount: 50, rating: 5, comment: "", timestamp: "2026-08-11T14:10:00Z" },
      ]
    },
    {
      waiterPhoneNumber: "0911822542",
      fullName: "Abebe Kebede",
      photo: "/waiter.png",
      totalTips: 4500,
      averageRating: 4.8,
      transactions: [
        { id: 4, tipAmount: 150, rating: 5, comment: "Great service!", timestamp: "2026-08-12T14:30:00Z" },
        { id: 5, tipAmount: 50, rating: 4, comment: "Thanks", timestamp: "2026-08-12T10:15:00Z" },
      ]
    },
    {
      waiterPhoneNumber: "0912345678",
      fullName: "Meron Alemu",
      photo: "/waiter.png",
      totalTips: 3200,
      averageRating: 4.6,
      transactions: [
        { id: 6, tipAmount: 200, rating: 5, comment: "Amazing smile", timestamp: "2026-08-12T16:00:00Z" },
        { id: 7, tipAmount: 20, rating: 3, comment: "A bit slow but okay", timestamp: "2026-08-12T13:20:00Z" },
      ]
    }
  ]
};

export default function ReportDashboard() {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const toggleRow = (phone: string) => {
    setExpandedRow(expandedRow === phone ? null : phone);
  };

  const { summary, waiters } = MOCK_API_RESPONSE;

  return (
    <main className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 py-10 px-4 md:px-10 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-red-100">
          <div>
            <h1 className="text-3xl font-extrabold text-red-600 tracking-tight">Analytics Dashboard</h1>
            <p className="text-gray-500 font-medium mt-1">Overview of your waiters' performance and tips.</p>
          </div>
          <Link
            href="/admin"
            className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-xl font-bold hover:bg-red-100 transition-colors border border-red-200"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Back to Config
          </Link>
        </div>

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-3xl p-6 shadow-lg border border-red-100 flex items-center gap-4 transform transition-transform hover:-translate-y-1">
            <div className="p-4 bg-red-500 rounded-2xl text-white shadow-inner">
              <CurrencyDollarIcon className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total Tips</p>
              <h2 className="text-3xl font-black text-gray-900">{summary.totalTips} ETB</h2>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-lg border border-red-100 flex items-center gap-4 transform transition-transform hover:-translate-y-1">
            <div className="p-4 bg-yellow-400 rounded-2xl text-white shadow-inner">
              <StarIcon className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Avgss Rating</p>
              <h2 className="text-3xl font-black text-gray-900">{summary.averageRating} <span className="text-lg text-gray-400">/ 5.0</span></h2>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-lg border border-red-100 flex items-center gap-4 transform transition-transform hover:-translate-y-1">
            <div className="p-4 bg-blue-500 rounded-2xl text-white shadow-inner">
              <TrophyIcon className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Top Earner</p>
              <h2 className="text-2xl font-black text-gray-900 truncate">{summary.topEarner}</h2>
            </div>
          </div>
        </div>

        {/* DATA TABLE */}
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
                {waiters.map((waiter) => (
                  <React.Fragment key={waiter.waiterPhoneNumber}>
                    <tr
                      className={`hover:bg-red-50/30 transition-colors ${expandedRow === waiter.waiterPhoneNumber ? 'bg-red-50/30' : 'bg-white'}`}
                    >
                      <td className="p-5">
                        <div className="flex items-center gap-3">
                          <img src={waiter.photo} className="w-12 h-12 rounded-full object-cover border-2 border-gray-100 shadow-sm" alt={waiter.fullName} />
                          <span className="font-bold text-gray-900 text-lg">{waiter.fullName}</span>
                        </div>
                      </td>
                      <td className="p-5 text-gray-600 font-medium">{waiter.waiterPhoneNumber}</td>
                      <td className="p-5 font-black text-red-600 text-lg">{waiter.totalTips} ETB</td>
                      <td className="p-5">
                        <div className="flex items-center gap-1 font-bold text-gray-800">
                          <StarIcon className="w-5 h-5 text-yellow-400" />
                          {waiter.averageRating}
                        </div>
                      </td>
                      <td className="p-5 text-right">
                        <button
                          onClick={() => toggleRow(waiter.waiterPhoneNumber)}
                          className="inline-flex items-center gap-1 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm outline-none"
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
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Transaction History ({waiter.transactions.length})</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {waiter.transactions.map((txn) => (
                                <div key={txn.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-2">
                                  <div className="flex justify-between items-start">
                                    <span className="font-black text-red-600 text-xl">{txn.tipAmount} ETB</span>
                                    <div className="flex text-yellow-400">
                                      {[...Array(5)].map((_, i) => (
                                        <StarIcon key={i} className={`w-4 h-4 ${i < txn.rating ? 'text-yellow-400' : 'text-gray-200'}`} />
                                      ))}
                                    </div>
                                  </div>

                                  {txn.comment && (
                                    <div className="flex items-start gap-2 mt-2 text-gray-600 bg-gray-50 p-3 rounded-xl text-sm italic">
                                      <ChatBubbleBottomCenterTextIcon className="w-5 h-5 text-gray-400 shrink-0" />
                                      <span>"{txn.comment}"</span>
                                    </div>
                                  )}

                                  <div className="flex items-center gap-1 mt-auto pt-2 text-xs font-bold text-gray-400 uppercase">
                                    <ClockIcon className="w-4 h-4" />
                                    {new Date(txn.timestamp).toLocaleString()}
                                  </div>
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

      </div>
    </main>
  );
}
