"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

type WaiterProfile = {
  id?: string;
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
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchReports = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();

        // Forward companyId, branchCode, or branch if provided in URL search params
        const companyId = searchParams.get("companyId");
        const branchCode = searchParams.get("branchCode");
        const branch = searchParams.get("branch");

        if (companyId) params.set("companyId", companyId);
        if (branchCode) params.set("branchCode", branchCode);
        if (branch) params.set("branch", branch);

        if (filter !== "all") {
          params.set("status", filter);
        }

        const queryString = params.toString();
        const url = queryString ? `/api/waiter-tips?${queryString}` : "/api/waiter-tips";

        const res = await fetch(url, { signal: controller.signal });

        if (res.status === 401) {
          window.location.href = "/company-admin/login";
          return;
        }

        const payload = await res.json().catch(() => null);

        if (!res.ok) {
          const errorMsg =
            payload?.error ||
            payload?.message ||
            `Failed to fetch data (${res.status} ${res.statusText || ""})`.trim();
          if (isMounted) {
            setActionError(errorMsg);
            setWaiters([]);
          }
          return;
        }

        const savedWaiters = Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload)
          ? payload
          : [];

        const profiles: WaiterProfile[] = savedWaiters.map((waiter: Record<string, unknown>) => {
          const waiterData = waiter as Partial<WaiterProfile> & {
            waiterPhoneNumber?: string;
            waiterId?: string;
            waiter_id?: string;
            phone?: string;
            id?: string;
            fullName?: string;
            name?: string;
            photo?: string;
            totalTips?: number | string;
            averageRating?: number | string;
            transactions?: Transaction[];
            status?: "active" | "terminated";
            isActive?: boolean;
          };

          const resolvedStatus: WaiterProfile["status"] =
            typeof waiterData.isActive === "boolean"
              ? (waiterData.isActive ? "active" : "terminated")
              : waiterData.status === "terminated"
                ? "terminated"
                : "active";

          const waiterIdentifier = waiterData.id || waiterData.waiterId || waiterData.waiter_id || waiterData.waiterPhoneNumber || waiterData.phone || "";

          return {
            id: waiterData.id || waiterData.waiterId || waiterData.waiter_id || undefined,
            waiterPhoneNumber: waiterData.waiterPhoneNumber || waiterData.phone || waiterIdentifier || "",
            fullName: waiterData.fullName || waiterData.name || `Waiter (${waiterData.waiterPhoneNumber || waiterData.phone || waiterIdentifier || "unknown"})`,
            photo: waiterData.photo || "/waiter.png",
            totalTips: Number(waiterData.totalTips || 0),
            averageRating: Number(waiterData.averageRating || 0),
            transactions: Array.isArray(waiterData.transactions) ? waiterData.transactions : [],
            status: resolvedStatus,
          };
        });

        profiles.sort((a, b) => a.fullName.localeCompare(b.fullName));
        if (isMounted) {
          setActionError("");
          setWaiters(profiles);
        }
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        const message = err instanceof Error ? err.message : "Network error. Please try again.";
        if (isMounted) {
          setActionError(message);
          setWaiters([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchReports();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [filter, searchParams, router]);

  const visibleWaiters = waiters.filter((waiter) => {
    const matchesFilter = filter === "all" || waiter.status === filter;
    const searchableText = [
      waiter.fullName,
      waiter.waiterPhoneNumber,
      waiter.id || "",
      ...waiter.transactions.flatMap((transaction) => [transaction.comment, String(transaction.tipAmount)]),
    ].join(" ").toLowerCase();
    return matchesFilter && searchableText.includes(search.trim().toLowerCase());
  });

  const saveWaiters = async (updatedWaiters: WaiterProfile[]) => {
    setSaving(true);
    setActionError("");
    try {
      const response = await fetch(`/api/waiter-tips`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: updatedWaiters[updatedWaiters.length - 1]?.fullName,
          phone: updatedWaiters[updatedWaiters.length - 1]?.waiterPhoneNumber,
          remark: " ",
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

    setSaving(true);
    setActionError("");

    try {
      const waiterIdentifier = statusTarget.id || statusTarget.waiterPhoneNumber;
      const endpoint = statusTarget.status === "active"
        ? `/api/waiter-tips/${encodeURIComponent(waiterIdentifier)}/terminate`
        : `/api/waiter-tips/${encodeURIComponent(waiterIdentifier)}/activate`;

      const response = await fetch(endpoint, { method: "POST" });
      if (!response.ok) throw new Error("Could not update waiter status");

      const nextStatus: WaiterProfile["status"] = statusTarget.status === "active" ? "terminated" : "active";
      setWaiters((current) => current.map((waiter) => {
        const sameWaiter = (waiter.id && statusTarget.id && waiter.id === statusTarget.id)
          || waiter.waiterPhoneNumber === statusTarget.waiterPhoneNumber;

        return sameWaiter ? { ...waiter, status: nextStatus } : waiter;
      }));
      setStatusTarget(null);
    } catch {
      setActionError("Could not update waiter status. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const formatTips = (amount: number) => `ETB ${Math.round(amount).toLocaleString()}`;
  const formatTimestamp = (timestamp: string) => {
    const parsed = new Date(timestamp);
    if (Number.isNaN(parsed.getTime())) return "—";

    return new Intl.DateTimeFormat("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(parsed);
  };

  const mergeWaiterDetails = (
    waiter: WaiterProfile,
    detail: Record<string, unknown> | null | undefined,
  ): WaiterProfile => {
    const source = (detail ?? {}) as Partial<WaiterProfile> & {
      waiterPhoneNumber?: string;
      waiterId?: string;
      waiter_id?: string;
      phone?: string;
      fullName?: string;
      name?: string;
      photo?: string;
      totalTips?: number | string;
      averageRating?: number | string;
      transactions?: Transaction[];
      tipHistory?: Array<{
        id?: string | number;
        amount?: number | string;
        rating?: number | string;
        reviewText?: string;
        customerPhone?: string;
        createdAt?: string;
        timestamp?: string;
        waiterPhone?: string;
        payerPhone?: string;
        tipAmount?: number | string;
        comment?: string;
      }>;
      status?: "active" | "terminated";
      isActive?: boolean;
    };

    const historyItems = Array.isArray(source.tipHistory)
      ? source.tipHistory
      : Array.isArray(source.transactions)
        ? source.transactions
        : [];

    const resolvedTransactions = historyItems.map((transaction: Record<string, unknown>, index: number) => {
      const payment = transaction as Partial<Transaction> & {
        amount?: number | string;
        customerPhone?: string;
        reviewText?: string;
        createdAt?: string;
        tipAmount?: number | string;
        payerPhone?: string;
        waiterPhone?: string;
      };

      return {
        id: String(payment.id || `${waiter.waiterPhoneNumber}-${index}`),
        waiterPhone: payment.waiterPhone || waiter.waiterPhoneNumber,
        payerPhone: payment.payerPhone || payment.customerPhone,
        tipAmount: Number(payment.tipAmount ?? payment.amount ?? 0),
        rating: Number(payment.rating ?? 0),
        comment: payment.comment || payment.reviewText || "",
        timestamp: payment.timestamp || payment.createdAt || new Date().toISOString(),
      };
    });

    const resolvedStatus: WaiterProfile["status"] = typeof source.isActive === "boolean"
      ? (source.isActive ? "active" : "terminated")
      : source.status === "terminated"
        ? "terminated"
        : "active";

    const totalTips = Number(source.totalTips ?? resolvedTransactions.reduce((sum: number, transaction: Transaction) => sum + Number(transaction.tipAmount || 0), 0));
    const averageRating = Number(
      source.averageRating ?? (
        resolvedTransactions.length
          ? resolvedTransactions.reduce((sum: number, transaction: Transaction) => sum + Number(transaction.rating || 0), 0) / resolvedTransactions.length
          : waiter.averageRating
      ),
    );

    return {
      ...waiter,
      id: source.id || source.waiterId || source.waiter_id || waiter.id,
      waiterPhoneNumber: source.waiterPhoneNumber || source.phone || waiter.waiterPhoneNumber,
      fullName: source.fullName || source.name || waiter.fullName,
      photo: source.photo || waiter.photo,
      totalTips,
      averageRating,
      transactions: resolvedTransactions,
      status: resolvedStatus,
    };
  };

  const handleOpenWaiterDetails = async (waiter: WaiterProfile) => {
    const waiterIdentifier = waiter.id || waiter.waiterPhoneNumber;
    setSelectedWaiter(waiter);

    if (!waiterIdentifier) {
      return;
    }

    setActionError("");
    setDetailsLoading(true);

    try {
      const params = new URLSearchParams();
    const companyId = searchParams.get("companyId");
    const branchCode = searchParams.get("branchCode");
    const branch = searchParams.get("branch");

    if (companyId) params.set("companyId", companyId);
    if (branchCode) params.set("branchCode", branchCode);
    if (branch) params.set("branch", branch);

    const detailUrl = `/api/waiter-tips/${encodeURIComponent(waiterIdentifier)}${params.toString() ? `?${params.toString()}` : ""}`;
    const response = await fetch(detailUrl);

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || payload?.message || "Could not load waiter details.");
      }

      const payload = await response.json().catch(() => null);
      const detailPayload = payload?.data ?? payload ?? null;
      const detail = Array.isArray(detailPayload)
        ? detailPayload.find((candidate) => {
            const record = candidate as Record<string, unknown>;
            const candidateId = record.id ?? record.waiterId ?? record.waiter_id;
            const candidatePhone = record.waiterPhoneNumber ?? record.phone ?? record.waiterPhone;
            return String(candidateId ?? "") === String(waiterIdentifier) || String(candidatePhone ?? "") === String(waiter.waiterPhoneNumber);
          }) ?? detailPayload[0] ?? null
        : detailPayload;

      setSelectedWaiter(mergeWaiterDetails(waiter, detail));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not load waiter details.";
      setActionError(message);
    } finally {
      setDetailsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f4e5df] px-4 py-5 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[1500px] space-y-4">
        <header className="flex flex-col gap-5 rounded-2xl border border-[#eadbd4] bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h1 className="font-serif text-2xl font-bold text-[#211b19]">Waiter Tip Management</h1>
            <p className="mt-1 text-sm text-gray-600">Overview of your waiters&apos; performance and tips.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={async () => {
                await fetch('/api/logout', { method: 'POST' });
                router.push('/company-admin/login');
              }}
              className="rounded-xl border border-[#861d40] px-3 py-2 text-sm font-medium text-[#861d40] transition hover:bg-[#861d40] hover:text-white"
            >
              Logout
            </button>
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
                    <tr key={waiter.id || waiter.waiterPhoneNumber} className="hover:bg-[#fcf8f6]">
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
                            onClick={() => handleOpenWaiterDetails(waiter)}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4 sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedWaiter(null); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="waiter-details-title" className="w-full max-w-[640px] overflow-hidden rounded-[28px] border border-[#f3d8d1] bg-[#fffdfd] shadow-[0_30px_80px_rgba(80,32,33,0.18)]">
            <div className="border-b border-[#f7e8e4] bg-[#fff4f1] px-5 py-5 sm:px-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-white shadow-sm">
                    <img src={selectedWaiter.photo} className="h-full w-full object-cover" alt={selectedWaiter.fullName} />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9a6a67]">Waiter details</p>
                    <h2 id="waiter-details-title" className="mt-1 font-serif text-2xl font-bold text-[#221c1a]">{selectedWaiter.fullName}</h2>
                    <p className="mt-1 text-sm text-[#725d5a]">{selectedWaiter.waiterPhoneNumber}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedWaiter(null)}
                  aria-label="Close details"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e7d0c9] bg-white text-[#7a5a56] transition hover:bg-[#fdf0ee]"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 bg-white p-5 sm:px-6">
              <div className="rounded-2xl border border-[#f1ddd9] bg-[#fff9f7] p-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8b6a63]">Total tips</p>
                <p className="mt-2 text-xl font-bold text-[#2b1d1c]">{formatTips(selectedWaiter.totalTips)}</p>
              </div>
              <div className="rounded-2xl border border-[#f1ddd9] bg-[#fff9f7] p-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8b6a63]">Avg rating</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xl font-bold text-[#2b1d1c]">{selectedWaiter.averageRating.toFixed(1)}</span>
                  <div className="flex">
                    {[0, 1, 2, 3, 4].map((star) => (
                      <StarIcon key={star} className={`h-4 w-4 ${star < Math.round(selectedWaiter.averageRating) ? "text-[#d97070]" : "text-[#ece0df]"}`} />
                    ))}
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-[#f1ddd9] bg-[#fff9f7] p-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8b6a63]">Tips count</p>
                <p className="mt-2 text-xl font-bold text-[#2b1d1c]">{selectedWaiter.transactions.length}</p>
              </div>
            </div>

            <div className="px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8b6a63]">Tip history</h3>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${selectedWaiter.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-stone-200 text-stone-700"}`}>
                  {selectedWaiter.status === "active" ? "Active" : "Terminated"}
                </span>
              </div>

              {detailsLoading ? (
                <p className="rounded-2xl border border-dashed border-[#ead2cd] bg-[#fff9f8] px-4 py-8 text-center text-sm text-gray-500">Loading waiter details...</p>
              ) : selectedWaiter.transactions.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-[#ead2cd] bg-[#fff9f8] px-4 py-8 text-center text-sm text-gray-500">No tips recorded yet.</p>
              ) : (
                <div className="space-y-3">
                  {selectedWaiter.transactions.map((transaction) => (
                    <article key={transaction.id} className="rounded-2xl border border-[#f5e4e0] bg-[#fffdfd] p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs text-[#9a7b73]">{formatTimestamp(transaction.timestamp)}</p>
                          <p className="mt-1 text-lg font-bold text-[#2a1f1d]">{formatTips(transaction.tipAmount)}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1" aria-label={`${transaction.rating} out of 5 stars`}>
                          {[0, 1, 2, 3, 4].map((star) => (
                            <StarIcon key={star} className={`h-4 w-4 ${star < transaction.rating ? "text-[#d97070]" : "text-[#f1dfdd]"}`} />
                          ))}
                        </div>
                      </div>

                      {transaction.comment && (
                        <p className="mt-3 rounded-xl bg-[#fff5f4] px-3 py-2 text-sm italic text-[#5e4745]">&ldquo;{transaction.comment}&rdquo;</p>
                      )}

                      {transaction.payerPhone && <p className="mt-2 text-xs text-[#8a6b67]">Payer: {transaction.payerPhone}</p>}
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
                <input id="waiter-name" value={newName} onChange={(event) => setNewName(event.target.value)} required placeholder="Full name" className="h-11 w-full rounded-xl border border-gray-200 px-4 text-sm outline-none focus:border-[#861d40] text-gray-800 focus:ring-2 focus:ring-[#861d40]/15" />
              </div>
              <div>
                <label htmlFor="waiter-phone" className="mb-2 block text-sm font-medium text-gray-800">Phone Number</label>
                <input id="waiter-phone" type="tel" value={newPhone} onChange={(event) => setNewPhone(event.target.value)} required placeholder="+251 9XX XXX XXX" className="h-11 w-full rounded-xl border border-gray-200 px-4 text-sm outline-none text-gray-800 focus:border-[#861d40] focus:ring-2 focus:ring-[#861d40]/15" />
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








