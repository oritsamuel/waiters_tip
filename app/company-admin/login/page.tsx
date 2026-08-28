"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CompanyAdminLogin() {
  const [companyId, setCompanyId] = useState("");
  const [branchCode, setBranchCode] = useState("");
  const [password, setPassword] = useState("");
  const [samplePhone, setSamplePhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId || !branchCode || !password) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId, branchCode, password, samplePhone }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        router.push(
          `/company-admin?companyId=${encodeURIComponent(companyId)}&branchCode=${encodeURIComponent(branchCode)}`
        );
      } else {
        setError(data.error || "Login failed. Please check your credentials.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex justify-center items-center min-h-screen bg-gradient-to-br from-red-50 to-red-100 py-10">
      <form onSubmit={handleLogin} className="bg-white w-full max-w-sm rounded-3xl shadow-xl p-8 space-y-5">
        <h1 className="text-2xl text-red-600 text-center">Company Portal Login</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Company ID</label>
            <input
              type="text"
              required
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl text-black focus:ring-2 focus:ring-red-500 outline-none"
              placeholder="e.g. 50301"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">Branch Code</label>
            <input
              type="text"
              required
              value={branchCode}
              onChange={(e) => setBranchCode(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl text-black focus:ring-2 focus:ring-red-500 outline-none"
              placeholder="e.g. MAIN"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl text-black focus:ring-2 focus:ring-red-500 outline-none"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Waiter Phone <span className="text-gray-400">(to verify company)</span>
            </label>
            <input
              type="text"
              value={samplePhone}
              onChange={(e) => setSamplePhone(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl text-black focus:ring-2 focus:ring-red-500 outline-none"
              placeholder="e.g. 0911822542"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-red-600 text-white py-3 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50"
        >
          {loading ? "Verifying..." : "Login"}
        </button>

        <p className="text-xs text-center text-gray-400">Default password: admin123</p>
      </form>
    </main>
  );
}
