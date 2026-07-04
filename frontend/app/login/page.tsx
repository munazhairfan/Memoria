"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/src/api";
import { isTokenValid } from "@/src/lib/auth";
import AuthCard from "@/src/components/AuthCard";

const inputClass =
  "w-full h-11 px-4 rounded-xl border border-black/10 bg-white/70 focus:outline-none focus:ring-2 focus:ring-[#16787C]/40 focus:border-[#16787C]/40 text-sm text-gray-900 transition";
const labelClass = "block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Already signed in? Skip straight past the form.
  useEffect(() => {
    if (isTokenValid(localStorage.getItem("token"))) {
      router.replace("/diary");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;

    setError(null);
    setLoading(true);
    try {
      await api.login(email.trim(), password);
      router.push("/diary");
    } catch (err: any) {
      setError(
        err?.message === "Incorrect email or password"
          ? err.message
          : "Couldn't sign you in. Check your details and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title="Welcome back"
      subtitle="your diary missed you"
      footer={
        <>
          New to Memoria?{" "}
          <Link
            href="/register"
            className="text-white font-medium underline underline-offset-2 hover:text-[#FFE1EE] transition"
          >
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 font-sans">
        <div>
          <label htmlFor="email" className={labelClass}>Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="password" className={labelClass}>Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            required
            className={inputClass}
          />
        </div>

        {error && (
          <p className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !email.trim() || !password}
          className="mt-2 h-11 rounded-xl bg-[#16787C] hover:bg-[#115d60] disabled:bg-black/20 text-white font-medium shadow-md transition flex items-center justify-center text-sm"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </AuthCard>
  );
}