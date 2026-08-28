"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function CompanyAdminContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const companyId = searchParams.get("companyId");
  const branchCode = searchParams.get("branchCode");

  const [waiters, setWaiters] = useState<{phone: string}[]>([]);
  const [newPhone, setNewPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [duplicateError, setDuplicateError] = useState(false);

  useEffect(() => {
    if (!companyId || !branchCode) {
      router.push("/company-admin/login");
      return;
    }

    const fetchWaiters = async () => {
      try {
        const res = await fetch(`/api/company?companyId=${encodeURIComponent(companyId)}&branchCode=${encodeURIComponent(branchCode)}`);
        if (res.ok) {
          const data = await res.json();
          setWaiters(data.waiters || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchWaiters();
  }, [companyId, branchCode, router]);

  const saveWaiters = async (updatedWaiters: {phone: string}[]) => {
    setSaving(true);
    try {
      await fetch('/api/company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          branchCode,
          waiters: updatedWaiters
        })
      });
      setWaiters(updatedWaiters);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhone.trim()) return;
    const phone = newPhone.trim();
    if (waiters.some(w => w.phone === phone)) {
      setDuplicateError(true);
      return;
    }
    setDuplicateError(false);
    
    const updated = [...waiters, { phone }];
    await saveWaiters(updated);
    setNewPhone("");
  };

  const handleRemove = async (phone: string) => {
    const updated = waiters.filter(w => w.phone !== phone);
    await saveWaiters(updated);
    setConfirmRemove(null);
  };

  if (!companyId || !branchCode) return null;

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        
        <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Waiters Management</h1>
            <p className="text-sm text-gray-500">Company ID: {companyId} | Branch: {branchCode}</p>
          </div>
          <Link 
            href={`/company-admin/report?companyId=${encodeURIComponent(companyId)}&branchCode=${encodeURIComponent(branchCode)}`}
            className="bg-red-50 text-red-600 px-4 py-2 rounded-xl font-bold hover:bg-red-100 transition-colors border border-red-200"
          >
            View Reports &rarr;
          </Link>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
          <form onSubmit={handleAdd} className="flex flex-col gap-3">
            <div className="flex gap-4">
              <input
                type="text"
                value={newPhone}
                onChange={(e) => { setNewPhone(e.target.value); setDuplicateError(false); }}
                placeholder="Enter Waiter Phone Number (e.g. 0911822542)"
                className={`flex-1 p-3 border rounded-xl outline-none focus:ring-2 focus:ring-red-500 text-black ${
                  duplicateError ? 'border-red-400' : 'border-gray-300'
                }`}
              />
              <button
                type="submit"
                disabled={saving || !newPhone.trim()}
                className="bg-red-600 text-white px-6 py-3 rounded-xl hover:bg-red-700 disabled:opacity-50"
              >
                Add Waiter
              </button>
            </div>
            {duplicateError && (
              <p className="text-red-500 text-sm">This phone number is already in the list.</p>
            )}
          </form>

          {loading ? (
            <p className="text-gray-500">Loading waiters...</p>
          ) : waiters.length === 0 ? (
            <p className="text-gray-500 italic">No waiters added yet. Start by adding one above.</p>
          ) : (
            <div className="space-y-3">
              {waiters.map((w) => (
                <div key={w.phone} className="flex justify-between items-center p-4 border border-gray-100 rounded-xl bg-gray-50">
                  <span className="text-gray-800">{w.phone}</span>
                  {confirmRemove === w.phone ? (
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-500">Remove?</span>
                      <button
                        onClick={() => handleRemove(w.phone)}
                        disabled={saving}
                        className="text-sm text-white bg-red-500 hover:bg-red-600 px-3 py-1 rounded-lg transition-colors"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setConfirmRemove(null)}
                        className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1 rounded-lg border border-gray-200 transition-colors"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmRemove(w.phone)}
                      disabled={saving}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}

export default function CompanyAdminPage() {
  return (
    <Suspense fallback={null}>
      <CompanyAdminContent />
    </Suspense>
  );
}
