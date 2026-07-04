"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isTokenValid } from "@/src/lib/auth";
import Header from "@/src/components/Header"

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  // null = still checking, false = redirecting, true = OK to render children.
  // This gates rendering entirely, so a protected page never flashes on
  // screen for a logged-out visitor before the redirect kicks in.
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!isTokenValid(token)) {
      localStorage.removeItem("token"); // clear stale/expired tokens
      setAuthorized(false);
      router.replace("/login");
      return;
    }
    setAuthorized(true);
  }, [router]);

  if (authorized !== true) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#148A8F] font-serif">
        <p className="text-white/80 text-sm animate-pulse">Loading...</p>
      </div>
    );
  }

  return <div className="relative w-screen h-screen flex flex-col overflow-hidden bg-[#148A8F]">
      <Header />
      <div className="flex-1 min-h-0 w-full relative">
        {children}
      </div>
    </div>
    ;}
