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
    <main className="min-h-screen bg-slate-950 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-md rounded-3xl border border-slate-700/80 bg-slate-900/95 p-8 shadow-2xl shadow-black/40 backdrop-blur-xl">
        <div className="mb-8 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Dashboard Login</p>
          <h1 className="mt-4 text-3xl font-semibold text-white">AI STORE Admin</h1>
          <p className="mt-2 text-sm text-slate-400">Enter your admin credentials to manage products, settings, and content.</p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-slate-300">Email</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white shadow-sm outline-none transition focus:border-slate-500"
              placeholder="admin@aistore.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300">Password</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white shadow-sm outline-none transition focus:border-slate-500"
              placeholder="••••••••"
              required
            />
          </div>

          {error ? <div className="rounded-2xl bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{error}</div> : null}

          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 px-4 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-black/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </button>

          <div className="mt-4 rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-4 text-xs text-slate-500">
            <p className="font-medium text-slate-300">Default admin access</p>
            <p>Email: <span className="text-slate-100">admin@aistore.com</span></p>
            <p>Password: <span className="text-slate-100">Admin1234!</span></p>
          </div>
        </form>
      </div>
    </main>
  );
}
