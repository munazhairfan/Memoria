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

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isTokenValid(localStorage.getItem("token"))) {
      router.replace("/diary");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;

    if (password.length < 8) {
      setError("Use at least 8 characters for your password.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Those passwords don't match.");
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await api.register(email.trim(), password);
      router.push("/diary");
    } catch (err: any) {
      setError(
        err?.message === "An account with this email already exists"
          ? err.message
          : "Couldn't create your account. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title="Start writing"
      subtitle="your ai diary, that never forgets"
      footer={
        <>
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-white font-medium underline underline-offset-2 hover:text-[#FFE1EE] transition"
          >
            Sign in
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
            placeholder="At least 8 characters"
            autoComplete="new-password"
            required
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className={labelClass}>Confirm password</label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
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
          disabled={loading || !email.trim() || !password || !confirmPassword}
          className="mt-2 h-11 rounded-xl bg-[#16787C] hover:bg-[#115d60] disabled:bg-black/20 text-white font-medium shadow-md transition flex items-center justify-center text-sm"
        >
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>
    </AuthCard>
  );
}