"use client";

import type { NextPage } from "next";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { isTokenValid } from "@/src/lib/auth";

export const Header: NextPage = () => {
  // FIX: this button always linked to /login — for an already-authenticated
  // user that meant a visible flash of the login page before its own
  // redirect kicked in and bounced them onward. Route straight to /profile
  // when there's a valid token instead.
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    setIsAuthed(isTokenValid(localStorage.getItem("token")));
  }, []);

  return (
    // FIX: was `fixed top-0 left-0 right-0 z-50`, which removes the header
    // from document flow entirely — anything rendered below it has no way
    // to know it exists and needs manual pixel-matched padding to avoid
    // being covered. `sticky` still reserves its own space in normal flow
    // (so nothing can ever overlap it) while keeping the same "stays
    // visible on scroll" behavior.
    <header className="w-full mx-auto px-6 py-6 flex items-center justify-between border-b border-white/20 bg-white/10 backdrop-blur-xl shadow-[0_1px_0_0_rgba(255,255,255,0.15)_inset] sticky top-0 z-50 shrink-0">
      {/* Brand Logo Title */}
      <Link href="/">
        <div>
          <Image
            src="/images/hero.png"
            alt="Memoria Logo"
            width={150}
            height={40}
          />
        </div>
      </Link>

      {/* Action Buttons: Rounded Star shapes holding icons inside */}
      <div className="flex xs:gap-4 md:gap-8 items-center">
        {/* BUTTON 1: Rounded Star containing Brain Icon */}
        <Link href="/memories">
          <button className="relative w-11 h-11 flex items-center justify-center hover:scale-105 transition-transform active:scale-95 group focus:outline-none">
            {/* Smooth, round-cornered star background */}
            <svg
              className="absolute inset-0 w-full h-full transform scale-90 text-white/20 mix-blend-overlay stroke-gray-400/60 stroke-[1.5]"
              viewBox="0 0 24 26"
              fill="currentColor"
            >
              <path
                transform="translate(0, 0.5)"
                d="M10.843 1.832a1.3 1.3 0 0 1 2.313 0l2.87 5.815a1.3 1.3 0 0 0 .98.711l6.417.933a1.3 1.3 0 0 1 .72 2.217l-4.643 4.526a1.3 1.3 0 0 0-.374 1.15l1.096 6.391a1.3 1.3 0 0 1-1.886 1.37l-5.74-3.017a1.3 1.3 0 0 0-1.21 0l-5.74 3.017a1.3 1.3 0 0 1-1.886-1.37l1.096-6.392a1.3 1.3 0 0 0-.374-1.15L.816 11.508a1.3 1.3 0 0 1 .72-2.217l6.417-.933a1.3 1.3 0 0 0 .979-.71l2.87-5.816z"
              />
            </svg>

            {/* Inner Brain Icon Layout */}
            <Image
              src="/images/icons/brain.png"
              alt="Brain Icon"
              width={22}
              height={22}
              className="relative z-10 mt-1"
            />
          </button>
        </Link>

        {/* BUTTON 2: Rounded Star containing User Profile Icon */}
        <Link href={isAuthed ? "/profile" : "/login"}>
          <button className="relative w-11 h-11 flex items-center justify-center hover:scale-105 transition-transform active:scale-95 group focus:outline-none">
            {/* Smooth, round-cornered star background */}
            <svg
              className="absolute inset-0 w-full h-full transform scale-90 text-white/20 mix-blend-overlay stroke-gray-400/60 stroke-[1.5]"
              viewBox="0 0 24 26"
              fill="currentColor"
            >
              <path
                transform="translate(0, 0.5)"
                d="M10.843 1.832a1.3 1.3 0 0 1 2.313 0l2.87 5.815a1.3 1.3 0 0 0 .98.711l6.417.933a1.3 1.3 0 0 1 .72 2.217l-4.643 4.526a1.3 1.3 0 0 0-.374 1.15l1.096 6.391a1.3 1.3 0 0 1-1.886 1.37l-5.74-3.017a1.3 1.3 0 0 0-1.21 0l-5.74 3.017a1.3 1.3 0 0 1-1.886-1.37l1.096-6.392a1.3 1.3 0 0 0-.374-1.15L.816 11.508a1.3 1.3 0 0 1 .72-2.217l6.417-.933a1.3 1.3 0 0 0 .979-.71l2.87-5.816z"
              />
            </svg>

            {/* Inner User/Profile Icon Layout */}
            <Image
              src="/images/icons/user.png"
              alt="User Icon"
              width={22}
              height={22}
              className="relative z-10 mt-1"
            />
          </button>
        </Link>
      </div>
    </header>
  );
};

export default Header;