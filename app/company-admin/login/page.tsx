"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import { EyeIcon, EyeSlashIcon, UserGroupIcon } from "@heroicons/react/24/outline";
import { restaurants } from "@/lib/restaurants";

export default function CompanyAdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [branch, setBranch] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !branch || !password) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, branch }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        router.push(`/company-admin/report?branch=${encodeURIComponent(branch)}`);
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
    <main className="grid min-h-screen bg-white md:grid-cols-[40.7%_1fr]">
      <aside className="flex min-h-[230px] flex-col items-center justify-center bg-[#861d40] px-8 py-10 text-white md:min-h-screen">
        <div className="flex h-20 w-20 items-center justify-center rounded-[22px] border border-white/20 bg-white/10 shadow-sm">
          <UserGroupIcon className="h-10 w-10" aria-hidden="true" />
        </div>
        <h1 className="mt-7 font-serif text-4xl font-bold tracking-wide">Hulubeje</h1>
        <p className="mt-2 text-sm font-semibold uppercase tracking-[0.16em] text-white/65">Admin Portal</p>
        <ul className="mt-10 hidden space-y-4 text-sm text-white/90 md:block">
          {["Waiter tip management", "QR-based payments", "Branch-level control"].map((feature) => (
            <li key={feature} className="flex items-center gap-3">
              <CheckCircleIcon className="h-5 w-5 shrink-0 text-white/50" aria-hidden="true" />
              {feature}
            </li>
          ))}
        </ul>
      </aside>

      <section className="flex items-center justify-center px-6 py-12 sm:px-10 md:px-12">
        <form onSubmit={handleLogin} className="w-full max-w-sm space-y-5">
          <header className="mb-8">
            <h2 className="font-serif text-2xl font-bold text-[#202124]">Welcome back</h2>
            <p className="mt-1 text-sm text-gray-500">Sign in to your Hulubeje account</p>
          </header>

          {error && (
            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="username" className="mb-2 block text-sm font-medium text-gray-800">Username</label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="h-[46px] w-full rounded-xl border border-gray-200 px-4 text-sm text-gray-900 outline-none transition focus:border-[#861d40] focus:ring-2 focus:ring-[#861d40]/15"
              placeholder="Enter your Hulubeje account"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-800">Password</label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-[46px] w-full rounded-xl border border-gray-200 px-4 pr-12 text-sm text-gray-900 outline-none transition focus:border-[#861d40] focus:ring-2 focus:ring-[#861d40]/15"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((shown) => !shown)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-gray-400 hover:text-gray-700"
              >
                {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="branch" className="mb-2 block text-sm font-medium text-gray-800">Branch</label>
            <select
              id="branch"
              name="branch"
              required
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="h-[46px] w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition focus:border-[#861d40] focus:ring-2 focus:ring-[#861d40]/15"
            >
              <option value="" disabled>Select branch</option>
              {Object.entries(restaurants).map(([slug, restaurant]) => (
                <option key={slug} value={slug}>{restaurant.name}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-1 h-11 w-full rounded-xl bg-gradient-to-r from-[#861d40] to-[#a21f4c] text-sm font-semibold text-white transition hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-[#861d40]/40 focus:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </section>
    </main>
  );
}
