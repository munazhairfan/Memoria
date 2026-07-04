"use client";

import Image from "next/image";
import Link from "next/link";
import { ReactNode } from "react";

interface AuthCardProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}

export default function AuthCard({ title, subtitle, children, footer }: AuthCardProps) {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#148A8F] font-serif px-4 py-12">
      {/* Ambient wash — same family as the diary chat page's background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#148A8F] via-[#127b80] to-[#0f6468]" />
      <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/5 blur-3xl" />
      <div className="absolute -bottom-32 -right-16 w-[28rem] h-[28rem] rounded-full bg-black/10 blur-3xl" />

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
        {/* Same wordmark used on the landing page and chat header */}
        <Link
          href="/"
          className="p-4">
          <Image src="/images/hero.png" alt="logo" height={70} width={200}></Image>
        </Link>

        {/* Signature element: an actual notebook page — red margin rule + faint ruling */}
        <div className="relative w-full bg-[#FFFDF8] rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35)] overflow-hidden border border-black/5">
          <div className="absolute top-0 bottom-0 left-10 w-px bg-rose-300/50 pointer-events-none" />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                "repeating-linear-gradient(to bottom, transparent, transparent 31px, rgba(20,138,143,0.12) 32px)",
              backgroundPosition: "0 68px",
            }}
          />

          <div className="relative px-8 pt-10 pb-8 pl-14">
            <h1 className="fraunces text-[28px] leading-tight text-[#111111]">{title}</h1>
            <p className="indie-flower-regular text-lg text-gray-500 mt-1 mb-8 lowercase italic">
              {subtitle}
            </p>

            {children}
          </div>
        </div>

        <div className="mt-6 text-sm text-white/80 font-sans text-center">{footer}</div>
      </div>
    </div>
  );
}