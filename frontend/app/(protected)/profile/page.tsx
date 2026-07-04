"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/src/api";

export default function ProfilePage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getMe()
      .then((data) => setEmail(data.email))
      .catch((err) => console.error("Failed to load profile:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    api.logout();
    router.push("/login");
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-[#F6F6F6] font-serif p-6">
      <div className="w-full max-w-sm">
        <h1 className="fraunces text-[28px] text-[#111111] mb-1">Your account</h1>
        <p className="indie-flower-regular text-lg text-gray-500 mb-8 lowercase italic">
          just you and your diary
        </p>

        {/* Notebook-page card, same motif as login/register/memories */}
        <div className="relative bg-[#FFFDF8] rounded-2xl shadow-[0_15px_40px_-15px_rgba(0,0,0,0.15)] border border-black/5 overflow-hidden">
          <div className="absolute top-0 bottom-0 left-10 w-px bg-rose-300/50 pointer-events-none" />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                "repeating-linear-gradient(to bottom, transparent, transparent 31px, rgba(20,138,143,0.12) 32px)",
              backgroundPosition: "0 40px",
            }}
          />

          <div className="relative px-8 py-8 pl-14 font-sans">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Email</p>
            <p className="text-[15px] text-gray-900 mb-8">
              {loading ? "Loading..." : email || "Couldn't load your email"}
            </p>

            <button
              onClick={handleLogout}
              className="w-full h-11 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-600 font-medium transition text-sm"
            >
              Log out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}