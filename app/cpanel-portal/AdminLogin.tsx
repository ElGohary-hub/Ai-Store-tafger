"use client";

import { useState } from "react";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const result = await res.json();
      if (!res.ok) {
        setError(result.error || "Login failed. Please check your credentials.");
      } else {
        window.location.reload();
      }
    } catch (err) {
      setError("Unable to sign in. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0a0c10] px-4 py-8 sm:px-6 lg:px-8 relative overflow-hidden text-white">
      {/* Background ambient glow matching storefront */}
      <div className="absolute inset-0 -z-10 opacity-[0.05]">
        <div className="h-full w-full" style={{ backgroundImage: "repeating-linear-gradient(-45deg, #E8A33D 0, #E8A33D 2px, transparent 2px, transparent 25px)" }} />
      </div>

      <div className="w-full max-w-md rounded-3xl border border-white/15 bg-gradient-to-b from-[#1a1f2c] to-[#11141d] p-6 sm:p-8 shadow-[0_25px_50px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-xl">
        <div className="mb-6 text-center sm:mb-8">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[#E8A33D]/30 bg-[#E8A33D]/15 px-3.5 py-1 text-xs font-bold text-[#E8A33D]">
            <span>🛡️</span>
            <span className="uppercase tracking-wider">Dashboard Login</span>
          </div>
          <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.7)]">AI STORE Admin</h1>
          <p className="mt-1.5 text-xs sm:text-sm text-white/60">Enter your credentials to access the management portal.</p>
        </div>

        <form className="space-y-4 sm:space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-white/80">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1.5 w-full rounded-2xl border border-white/15 bg-black/60 px-4 py-3 text-sm text-white shadow-inner outline-none transition placeholder:text-white/30 focus:border-[#E8A33D] focus:ring-1 focus:ring-[#E8A33D]/50"
              placeholder="admin@aistore.com"
              required
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-white/80">Password</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1.5 w-full rounded-2xl border border-white/15 bg-black/60 px-4 py-3 text-sm text-white shadow-inner outline-none transition placeholder:text-white/30 focus:border-[#E8A33D] focus:ring-1 focus:ring-[#E8A33D]/50"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="rounded-2xl bg-rose-500/15 border border-rose-500/30 px-4 py-3 text-xs sm:text-sm text-rose-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[#E8A33D] to-[#d69230] px-4 py-3.5 text-sm font-extrabold text-[#10131A] shadow-[0_5px_15px_rgba(232,163,61,0.4),inset_0_2px_3px_rgba(255,255,255,0.4)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98]"
          >
            {isLoading ? "Signing in..." : "Sign in to Dashboard"}
          </button>
        </form>
      </div>
    </main>
  );
}
