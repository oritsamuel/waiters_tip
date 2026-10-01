"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { restaurants } from "@/lib/restaurants";
import {
  CheckIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  MagnifyingGlassIcon,
  NoSymbolIcon,
  PlusIcon,
  StarIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";

type Transaction = {
  id: string;
  waiterPhone: string;
  payerPhone?: string;
  tipAmount: number;
  rating: number;
  comment: string;
  timestamp: string;
};

type WaiterRecord = {
  phone: string;
  fullName?: string;
  status?: "active" | "terminated";
};

type WaiterProfile = {
  waiterPhoneNumber: string;
  fullName: string;
  photo: string;
  totalTips: number;
  averageRating: number;
  transactions: Transaction[];
  status: "active" | "terminated";
};

function ReportDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const branch = searchParams.get("branch");
  const restaurant = branch ? restaurants[branch] : undefined;
  const [waiters, setWaiters] = useState<WaiterProfile[]>([]);
  const [filter, setFilter] = useState<"all" | "active" | "terminated">("all");
  const [search, setSearch] = useState("");
  const [selectedWaiter, setSelectedWaiter] = useState<WaiterProfile | null>(null);
  const [statusTarget, setStatusTarget] = useState<WaiterProfile | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [actionError, setActionError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!restaurant) {
      router.push("/company-admin/login");
      return;
    }

    const fetchReports = async () => {
      try {
        // Fetch DB data
        const res = await fetch(`/api/company?branch=${encodeURIComponent(branch!)}`);
        if (!res.ok) throw new Error("Failed to fetch data");
        const companyData = await res.json();
        
        const savedWaiters: WaiterRecord[] = companyData.waiters || [];
        const allTransactions: Transaction[] = companyData.transactions || [];

        // Fetch waiter details from Hulubeje
        const profileResults = await Promise.all(savedWaiters.map(async (waiter) => {
            try {
              const apiRes = await fetch(
                `https://v7-hulubeje.cnetcommerce.com/api/waiter/get?phoneNumber=${waiter.phone}&companyId=${restaurant.companyId}`,
                {
                  headers: {
                    "x-api-key": "5D5EAFF4-D29A-485B-BDB9-785EF86FFFAE",
                    Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwOTY3OTk4MDQwIiwianRpIjoiNDQ3OTgwNjEwQTA0RjYyNDk3MTcxN0NEMTlGNkZCMzQ0MTg4Njk4N0FEQTQ3M0IxOTk4MjRCMzM4QjVBNUE3MTFBRTFGREY2NUIwRjA4NzUxRDQyMDZCQTBDQUExREUxRkJCNEY2MzMyMDlEQUY1RkM3NzE0MzEyQTlFOThFNEIiLCJleHAiOjE4MDY2ODc0ODUsImlzcyI6Ikh1bHViZWplIiwiYXVkIjoiSHVsdWJlamUifQ.8cxAjbBdJxHPvSxLj4mo8bF1rbT1Oaux7Mteox3Um3Y"
                  },
                }
              );
              const text = await apiRes.text();
              if (!apiRes.ok || !text) return { waiter, profile: null };
              const result = JSON.parse(text) as {
                isSuccessful?: boolean;
                data?: { fullName?: string; photo?: string };
              };
              if (result.isSuccessful) {
                return { waiter, profile: result.data ?? null };
              }
            } catch {
              return { waiter, profile: null };
            }
            return { waiter, profile: null };
          }));

        // Aggregate transactions by waiter
        const profiles: WaiterProfile[] = profileResults.map((p) => {
          const phone = p.waiter.phone;
          const txns = allTransactions
            .filter((transaction) => transaction.waiterPhone === phone)
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          const totalTips = txns.reduce((sum, t) => sum + t.tipAmount, 0);
          const avgRating = txns.length > 0 ? (txns.reduce((sum, t) => sum + t.rating, 0) / txns.length) : 0;
          
          return {
            waiterPhoneNumber: phone,
            fullName: p.waiter.fullName || p.profile?.fullName || `Waiter (${phone})`,
            photo: p.profile?.photo || "/waiter.png",
            totalTips,
            averageRating: Number(avgRating.toFixed(1)),
            transactions: txns,
            status: p.waiter.status ?? "active",
          };
        });

        profiles.sort((a, b) => a.fullName.localeCompare(b.fullName));
        
        setWaiters(profiles);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [branch, restaurant, router]);

  if (!restaurant) return null;

  const visibleWaiters = waiters.filter((waiter) => {
    const matchesFilter = filter === "all" || waiter.status === filter;
    const searchableText = [
      waiter.fullName,
      waiter.waiterPhoneNumber,
      ...waiter.transactions.flatMap((transaction) => [transaction.comment, String(transaction.tipAmount)]),
    ].join(" ").toLowerCase();
    return matchesFilter && searchableText.includes(search.trim().toLowerCase());
  });

  const saveWaiters = async (updatedWaiters: WaiterProfile[]) => {
    setSaving(true);
    setActionError("");
    try {
      const response = await fetch("/api/company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branch,
          waiters: updatedWaiters.map((waiter) => ({
            phone: waiter.waiterPhoneNumber,
            fullName: waiter.fullName,
            status: waiter.status,
          })),
        }),
      });
      if (!response.ok) throw new Error("Could not save waiter changes.");
      setWaiters(updatedWaiters);
      return true;
    } catch {
      setActionError("Could not save your changes. Please try again.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const addWaiter = async (event: React.FormEvent) => {
    event.preventDefault();
    const phone = newPhone.trim().replace(/[\s()-]/g, "");
    const name = newName.trim();
    if (!name || !phone || waiters.some((waiter) => waiter.waiterPhoneNumber === phone)) {
      setActionError("Enter a name and a unique phone number.");
      return;
    }

    const added = await saveWaiters([
      ...waiters,
      {
        waiterPhoneNumber: phone,
        fullName: name,
        photo: "/waiter.png",
        totalTips: 0,
        averageRating: 0,
        transactions: [],
        status: "active",
      },
    ]);
    if (added) {
      setNewName("");
      setNewPhone("");
      setShowAddDialog(false);
    }
  };

  const updateWaiterStatus = async () => {
    if (!statusTarget) return;
    const nextStatus: WaiterProfile["status"] = statusTarget.status === "active" ? "terminated" : "active";
    const updated = waiters.map((waiter) => waiter.waiterPhoneNumber === statusTarget.waiterPhoneNumber
      ? { ...waiter, status: nextStatus }
      : waiter);
    if (await saveWaiters(updated)) setStatusTarget(null);
  };

  const formatTips = (amount: number) => `ETB ${Math.round(amount).toLocaleString()}`;
  const formatTimestamp = (timestamp: string) => new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp));

  return (
    <main className="min-h-screen bg-[#f4e5df] px-4 py-5 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[1500px] space-y-4">
        <header className="flex flex-col gap-5 rounded-2xl border border-[#eadbd4] bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h1 className="font-serif text-2xl font-bold text-[#211b19]">Waiter Tip Management</h1>
            <p className="mt-1 text-sm text-gray-600">Overview of your waiters&apos; performance and tips.</p>
          </div>
          <div className="flex w-fit rounded-full bg-[#eee7e2] p-1" aria-label="Filter waiters">
            {(["all", "active", "terminated"] as const).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={filter === value}
                onClick={() => setFilter(value)}
                className={`rounded-full px-4 py-2 text-sm capitalize transition ${filter === value ? "bg-[#861d40] text-white shadow-sm" : "text-gray-700 hover:bg-white/70"}`}
              >
                {value}
              </button>
            ))}
          </div>
        </header>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="relative block w-full sm:max-w-[530px]">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#724555]" aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search waiters by name, phone, or tips..."
              className="h-11 w-full rounded-xl border border-[#805467] bg-white pl-12 pr-4 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#861d40]/20"
            />
          </label>
          <button
            type="button"
            onClick={() => { setActionError(""); setShowAddDialog(true); }}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#861d40] px-5 text-sm font-semibold text-white transition hover:bg-[#721735]"
          >
            <PlusIcon className="h-5 w-5" aria-hidden="true" />
            Add Waiter
          </button>
        </div>

        {actionError && !showAddDialog && !statusTarget && (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{actionError}</p>
        )}

        <section className="overflow-hidden rounded-2xl border border-[#eadbd4] bg-white shadow-sm" aria-label="Waiter list">
          {loading ? (
            <p className="px-6 py-12 text-center text-sm text-gray-500">Loading waiters...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-gray-200 text-xs font-semibold uppercase text-[#51483f]">
                    <th className="px-6 py-4">Waiter</th>
                    <th className="px-4 py-4">Phone</th>
                    <th className="px-4 py-4 text-center">Total tips</th>
                    <th className="px-4 py-4">Avg rating</th>
                    <th className="px-4 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {visibleWaiters.map((waiter) => (
                    <tr key={waiter.waiterPhoneNumber} className="hover:bg-[#fcf8f6]">
                      <td className="px-6 py-2.5">
                        <div className="flex items-center gap-3">
                          <img src={waiter.photo} className="h-9 w-9 rounded-full border border-gray-200 object-cover" alt="" />
                          <span className="font-medium text-gray-900">{waiter.fullName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-sm text-gray-700">{waiter.waiterPhoneNumber}</td>
                      <td className="px-4 py-2.5 text-center font-semibold text-[#65152f]">{formatTips(waiter.totalTips)}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                          <span className="text-sm text-gray-800">{waiter.averageRating.toFixed(1)}</span>
                          <span className="flex" aria-label={`${waiter.averageRating.toFixed(1)} out of 5 stars`}>
                            {[0, 1, 2, 3, 4].map((star) => (
                              <StarIcon key={star} className={`h-4 w-4 ${star < Math.round(waiter.averageRating) ? "text-amber-400" : "text-gray-300"}`} aria-hidden="true" />
                            ))}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${waiter.status === "active" ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-gray-300 bg-gray-100 text-gray-600"}`}>
                          <span className={`h-2 w-2 rounded-full ${waiter.status === "active" ? "bg-emerald-600" : "bg-gray-400"}`} />
                          {waiter.status === "active" ? "Active" : "Terminated"}
                        </span>
                      </td>
                      <td className="px-6 py-2.5">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedWaiter(waiter)}
                            className="inline-flex h-8 items-center gap-1 rounded-lg border border-[#d4c6bd] bg-[#f5eee9] px-3 text-xs font-medium text-[#443a34] hover:bg-[#eee3dc]"
                          >
                            <InformationCircleIcon className="h-4 w-4" aria-hidden="true" />
                            Details
                          </button>
                          <button
                            type="button"
                            onClick={() => { setActionError(""); setStatusTarget(waiter); }}
                            className={`inline-flex h-8 items-center gap-1 rounded-lg border px-3 text-xs font-medium ${waiter.status === "active" ? "border-[#d9b6b6] bg-[#fbe7e7] text-[#7a2635] hover:bg-[#f6d9dc]" : "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"}`}
                          >
                            {waiter.status === "active" ? <NoSymbolIcon className="h-4 w-4" aria-hidden="true" /> : <CheckIcon className="h-4 w-4" aria-hidden="true" />}
                            {waiter.status === "active" ? "Terminate" : "Activate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {visibleWaiters.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">
                        {waiters.length ? "No waiters match this search and status." : "No waiters have been added yet."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {selectedWaiter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-0 sm:p-5" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedWaiter(null); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="waiter-details-title" className="max-h-screen w-full overflow-y-auto bg-white shadow-2xl sm:max-h-[90vh] sm:max-w-2xl sm:rounded-2xl">
            <header className="flex items-start justify-between border-b border-gray-100 px-5 py-5 sm:px-7">
              <div className="flex items-center gap-3">
                <img src={selectedWaiter.photo} className="h-12 w-12 rounded-full border border-gray-200 object-cover" alt="" />
                <div>
                  <h2 id="waiter-details-title" className="font-serif text-xl font-bold text-gray-900">{selectedWaiter.fullName}</h2>
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500">
                    {selectedWaiter.waiterPhoneNumber}
                    <span className={`rounded-full px-2.5 py-0.5 text-xs ${selectedWaiter.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-600"}`}>
                      {selectedWaiter.status === "active" ? "Active" : "Terminated"}
                    </span>
                  </p>
                </div>
              </div>
              <button type="button" onClick={() => setSelectedWaiter(null)} aria-label="Close details" className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </header>

            <div className="grid grid-cols-3 border-b border-gray-100 bg-[#fffafa] px-5 py-5 sm:px-7">
              <div>
                <p className="text-[11px] font-semibold uppercase text-gray-500">Total tips</p>
                <p className="mt-1 text-xl font-bold text-gray-900">{formatTips(selectedWaiter.totalTips)}</p>
              </div>
              <div className="border-x border-gray-200 px-3 sm:px-6">
                <p className="text-[11px] font-semibold uppercase text-gray-500">Avg rating</p>
                <div className="mt-1 flex items-center gap-1">
                  <span className="text-xl font-bold text-gray-900">{selectedWaiter.averageRating.toFixed(1)}</span>
                  <span className="hidden sm:flex">
                    {[0, 1, 2, 3, 4].map((star) => <StarIcon key={star} className={`h-4 w-4 ${star < Math.round(selectedWaiter.averageRating) ? "text-rose-300" : "text-gray-200"}`} />)}
                  </span>
                </div>
              </div>
              <div className="pl-3 sm:pl-6">
                <p className="text-[11px] font-semibold uppercase text-gray-500">Tip count</p>
                <p className="mt-1 text-xl font-bold text-gray-900">{selectedWaiter.transactions.length}</p>
              </div>
            </div>

            <div className="px-5 py-5 sm:px-7">
              <h3 className="mb-3 text-xs font-semibold uppercase text-gray-600">Tip history</h3>
              {selectedWaiter.transactions.length === 0 ? (
                <p className="rounded-xl bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">No tips recorded yet.</p>
              ) : (
                <div className="space-y-3">
                  {selectedWaiter.transactions.map((transaction) => (
                    <article key={transaction.id} className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-semibold text-gray-900">{formatTips(transaction.tipAmount)}</p>
                        <span className="flex shrink-0" aria-label={`${transaction.rating} out of 5 stars`}>
                          {[0, 1, 2, 3, 4].map((star) => <StarIcon key={star} className={`h-4 w-4 ${star < transaction.rating ? "text-rose-300" : "text-gray-200"}`} />)}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-gray-400">{formatTimestamp(transaction.timestamp)}</p>
                      {transaction.comment && <p className="mt-3 text-sm italic text-gray-600">&ldquo;{transaction.comment}&rdquo;</p>}
                      {transaction.payerPhone && <p className="mt-2 text-xs text-gray-400">{transaction.payerPhone}</p>}
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {showAddDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setShowAddDialog(false); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="add-waiter-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h2 id="add-waiter-title" className="font-serif text-xl font-bold text-gray-900">Add New Waiter</h2>
            <form onSubmit={addWaiter} className="mt-6 space-y-4">
              <div>
                <label htmlFor="waiter-name" className="mb-2 block text-sm font-medium text-gray-800">Waiter Name</label>
                <input id="waiter-name" value={newName} onChange={(event) => setNewName(event.target.value)} required placeholder="Full name" className="h-11 w-full rounded-xl border border-gray-200 px-4 text-sm outline-none focus:border-[#861d40] focus:ring-2 focus:ring-[#861d40]/15" />
              </div>
              <div>
                <label htmlFor="waiter-phone" className="mb-2 block text-sm font-medium text-gray-800">Phone Number</label>
                <input id="waiter-phone" type="tel" value={newPhone} onChange={(event) => setNewPhone(event.target.value)} required placeholder="+251 9XX XXX XXX" className="h-11 w-full rounded-xl border border-gray-200 px-4 text-sm outline-none focus:border-[#861d40] focus:ring-2 focus:ring-[#861d40]/15" />
              </div>
              {actionError && <p role="alert" className="text-sm text-red-700">{actionError}</p>}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowAddDialog(false)} disabled={saving} className="h-11 flex-1 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50">Cancel</button>
                <button type="submit" disabled={saving || !newName.trim() || !newPhone.trim()} className="h-11 flex-1 rounded-xl bg-[#861d40] text-sm font-semibold text-white hover:bg-[#721735] disabled:cursor-not-allowed disabled:opacity-40">{saving ? "Adding..." : "Add Waiter"}</button>
              </div>
            </form>
          </section>
        </div>
      )}

      {statusTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setStatusTarget(null); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="status-dialog-title" className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">
            <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${statusTarget.status === "active" ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-700"}`}>
              {statusTarget.status === "active" ? <ExclamationTriangleIcon className="h-6 w-6" aria-hidden="true" /> : <CheckIcon className="h-6 w-6" aria-hidden="true" />}
            </div>
            <h2 id="status-dialog-title" className="mt-4 font-serif text-xl font-bold text-gray-900">{statusTarget.status === "active" ? "Terminate Waiter?" : "Activate Waiter?"}</h2>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              {statusTarget.status === "active"
                ? <>Are you sure you want to terminate {statusTarget.fullName}? They will no longer appear in the waiter list. You can reactivate them later.</>
                : <>Are you sure you want to reactivate {statusTarget.fullName}? They will appear in the waiter list again.</>}
            </p>
            {actionError && <p role="alert" className="mt-3 text-sm text-red-700">{actionError}</p>}
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => setStatusTarget(null)} disabled={saving} className="h-11 flex-1 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50">Cancel</button>
              <button type="button" onClick={updateWaiterStatus} disabled={saving} className={`h-11 flex-1 rounded-xl text-sm font-semibold text-white disabled:opacity-50 ${statusTarget.status === "active" ? "bg-red-600 hover:bg-red-700" : "bg-emerald-600 hover:bg-emerald-700"}`}>
                {saving ? "Saving..." : statusTarget.status === "active" ? "Terminate" : "Activate"}
              </button>
            </div>
          </section>
        </div>
      )}
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
