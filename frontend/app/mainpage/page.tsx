import type { NextPage } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import Headers from '@/src/components/Header';

const MemoriaPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>Memoria - Your AI diary, that never forgets</title>
      </Head>

      <div className="bg-[#F6F6F6] text-[#222222] min-h-screen pb-32 font-serif selection:bg-pink-200 overflow-x-hidden">
        
        <Headers/>

        {/* HERO SECTION */}
        <section className="text-center pt-12 sm:pt-20 pb-12 px-4">
          {/* Main Logo Text with Feather Placeholder */}
          <div className="inline-flex flex-col items-center select-none">
            <h1 className="text-6xl sm:text-8xl font-normal tracking-tight font-serif relative">
              Memor<span className="relative">ia<span className="absolute -top-2 sm:-top-3 -right-4 sm:-right-6 text-2xl sm:text-4xl transform rotate-12">🪶</span></span>
            </h1>
            <p className="text-base sm:text-lg mt-3 text-gray-500 font-sans tracking-wide lowercase italic">
              your ai diary, that never forgets
            </p>
          </div>

          {/* Notebook Block Showcase */}
          <div className="mt-12 sm:mt-16 relative w-full max-w-[760px] aspect-[760/480] sm:h-[480px] mx-auto group">
            {/* Real Notebook Spread Grid */}
            <div className="absolute inset-0 bg-white border border-gray-200/80 rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.12)] flex p-4 sm:p-8 z-10 overflow-hidden">
              
              {/* Vertical Center Binder Shadow */}
              <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[2px] bg-gradient-to-r from-gray-300 via-gray-100 to-gray-300 z-20"></div>

              {/* LEFT PAGE: My Memories */}
              <div className="w-1/2 pr-2 sm:pr-6 border-r border-gray-100 relative flex flex-col items-center">
                {/* Lined paper simulation */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-[0.15] py-6 sm:py-12">
                  {Array.from({ length: 16 }).map((_, i) => (
                    <div key={i} className="w-full border-b border-gray-800"></div>
                  ))}
                </div>

                <span className="relative font-sans text-xs sm:text-xl px-2 sm:px-4 py-1 sm:py-1.5 bg-[#D1FADF] text-[#245E33] rounded-md shadow-sm font-medium tracking-wide transform -rotate-3 mt-2 sm:mt-4 z-10 whitespace-nowrap">
                  My Memories
                </span>
                
                {/* Polaroid Shadow Card */}
                <div className="mt-8 sm:mt-20 w-24 sm:w-44 bg-white p-1.5 sm:p-2.5 pb-4 sm:pb-8 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] border border-gray-100 transform -rotate-6 relative group-hover:rotate-[-4deg] transition-transform duration-300">
                  <div className="w-full h-16 sm:h-28 bg-[#164E43] rounded relative overflow-hidden">
                    <div className="absolute bottom-1 sm:bottom-2 left-1 sm:left-2 text-white/40 text-[7px] sm:text-[10px]">memories...</div>
                  </div>
                  {/* Decorative green badge star */}
                  <div className="absolute -top-2 sm:-top-4 -left-2 sm:-left-3 text-lg sm:text-3xl drop-shadow-md">🟢</div>
                </div>
              </div>

              {/* RIGHT PAGE: Open Diary */}
              <div className="w-1/2 pl-2 sm:pl-6 relative flex flex-col items-center">
                {/* Lined paper simulation */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-[0.15] py-6 sm:py-12">
                  {Array.from({ length: 16 }).map((_, i) => (
                    <div key={i} className="w-full border-b border-gray-800"></div>
                  ))}
                </div>

                <span className="relative font-sans text-xs sm:text-xl px-2 sm:px-4 py-1 sm:py-1.5 bg-[#FFE1EE] text-[#A6265E] rounded-md shadow-sm font-medium tracking-wide transform rotate-3 mt-2 sm:mt-4 z-10 whitespace-nowrap">
                  Open Diary
                </span>

                {/* Polaroid Shadow Card */}
                <div className="mt-8 sm:mt-16 w-24 sm:w-44 bg-white p-1.5 sm:p-2.5 pb-4 sm:pb-8 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] border border-gray-100 transform rotate-8 relative group-hover:rotate-[5deg] transition-transform duration-300">
                  <div className="w-full h-16 sm:h-28 bg-[#3B1E1E] rounded relative overflow-hidden">
                    <div className="absolute bottom-1 sm:bottom-2 left-1 sm:left-2 text-white/40 text-[7px] sm:text-[10px]">today...</div>
                  </div>
                  {/* Decorative pink badge star */}
                  <div className="absolute -top-2 sm:-top-4 -right-2 sm:-right-3 text-lg sm:text-3xl drop-shadow-md">🌸</div>
                </div>
              </div>
            </div>

            {/* Simulated Stacked Sheets underneath */}
            <div className="absolute inset-0 bg-white border border-gray-200 rounded-2xl shadow-lg transform translate-y-1 sm:translate-y-2 translate-x-0.5 sm:translate-x-1 z-0"></div>
            <div className="absolute inset-0 bg-white border border-gray-300 rounded-2xl shadow-md transform translate-y-2 sm:translate-y-4 translate-x-1 sm:translate-x-2 -z-10"></div>
          </div>
        </section>

        {/* PARALLAX/DECORATIVE IMAGE CONTAINER */}
        <div className="relative w-full h-20 sm:h-28 my-12 sm:my-16 select-none mix-blend-multiply opacity-90">
          <Image 
            src="/Desktop - 1.jpg" 
            alt="Handwritten script element from original design" 
            fill 
            className="object-cover"
            priority
          />
        </div>

        {/* THREE FEATURE BLOCKS SECTION */}
        <section className="max-w-4xl mx-auto px-6 flex flex-col gap-24 sm:gap-36 mt-16 sm:mt-24">
          
          {/* Feature 1: Remembers */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-16">
            <div className="w-full md:w-1/2">
              <h2 className="text-3xl sm:text-[40px] font-normal font-serif leading-[1.15] text-[#111111] tracking-tight">
                Memoria <span className="bg-[#FFE1EE] px-2 py-0.5 rounded-sm inline-block transform -rotate-1">remembers</span> so you don't have to
              </h2>
            </div>
            <div className="w-full md:w-1/2 relative flex justify-center md:justify-end pr-4 md:pr-0 pt-4">
              <div className="absolute w-[290px] h-[310px] bg-[#D63B81] rounded-2xl top-4 md:top-0 right-auto md:right-0 transform translate-x-4 -translate-y-4 shadow-sm"></div>
              <div className="relative w-[290px] h-[310px] bg-white border border-gray-200/60 rounded-2xl shadow-xl p-8 flex flex-col justify-center z-10">
                <div className="absolute -top-4 left-10 px-4 py-1 bg-amber-50/90 border border-amber-200/50 shadow-sm transform -rotate-12 text-xs text-gray-400 font-sans tracking-widest">
                  📌 MEMO
                </div>
                <p className="font-sans text-[15px] leading-relaxed text-gray-700 font-normal">
                  Write freely. Memoria extracts the people, places, emotions and events from everything you share
                </p>
              </div>
            </div>
          </div>

          {/* Feature 2: Ask Anything (Reversed layout handled on desktop) */}
          <div className="flex flex-col md:flex-row-reverse items-center justify-between gap-8 md:gap-16">
            <div className="w-full md:w-1/2 md:pl-8">
              <h2 className="text-3xl sm:text-[40px] font-normal font-serif leading-[1.15] text-[#111111] tracking-tight">
                <span className="bg-[#E0F2F1] text-[#2E7D32] px-2 py-0.5 rounded-sm inline-block transform rotate-1">Ask anything</span> about your past
              </h2>
            </div>
            <div className="w-full md:w-1/2 relative flex justify-center md:justify-start pl-4 md:pl-0 pt-4">
              <div className="absolute w-[290px] h-[310px] bg-[#6CB6B3] rounded-2xl top-4 md:top-0 left-auto md:left-0 transform -translate-x-4 -translate-y-4 shadow-sm"></div>
              <div className="relative w-[290px] h-[310px] bg-white border border-gray-200/60 rounded-2xl shadow-xl p-8 flex flex-col justify-center z-10">
                <div className="absolute -top-4 right-10 px-4 py-1 bg-amber-50/90 border border-amber-200/50 shadow-sm transform rotate-12 text-xs text-gray-400 font-sans tracking-widest">
                  📌 INFO
                </div>
                <p className="font-sans text-[15px] leading-relaxed text-gray-700 font-normal">
                  Forgot when you last felt happy? Can't remember what you decided about that job? Just ask. Memoria knows.
                </p>
              </div>
            </div>
          </div>

          {/* Feature 3: Visualized */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-16">
            <div className="w-full md:w-1/2">
              <h2 className="text-3xl sm:text-[40px] font-normal font-serif leading-[1.15] text-[#111111] tracking-tight">
                Your memory, <span className="bg-[#D1FADF] text-[#1B5E20] px-2 py-0.5 rounded-sm inline-block transform -rotate-1">visualized</span>
              </h2>
            </div>
            <div className="w-full md:w-1/2 relative flex justify-center md:justify-end pr-4 md:pr-0 pt-4">
              <div className="absolute w-[290px] h-[310px] bg-[#3B7E48] rounded-2xl top-4 md:top-0 right-auto md:right-0 transform translate-x-4 -translate-y-4 shadow-sm"></div>
              <div className="relative w-[290px] h-[310px] bg-white border border-gray-200/60 rounded-2xl shadow-xl p-8 flex flex-col justify-center z-10">
                <div className="absolute -top-4 left-10 px-4 py-1 bg-amber-50/90 border border-amber-200/50 shadow-sm transform -rotate-6 text-xs text-gray-400 font-sans tracking-widest">
                  GRAPH
                </div>
                <p className="font-sans text-[15px] leading-relaxed text-gray-700 font-normal">
                  Watch your life take shape as a graph. Every person, every feeling, every moment — connected
                </p>
              </div>
            </div>
          </div>

        </section>
      </div>
    </>
  );
};

export default MemoriaPage;