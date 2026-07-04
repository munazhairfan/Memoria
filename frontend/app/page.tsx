"use client";

import Head from 'next/head';
import Image from 'next/image';
import Headers from '@/src/components/Header';
import { useRouter } from 'next/navigation';

const MemoriaPage = () => {
  const router = useRouter();

  const handleNavigateMemories = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push('/memories');
  };

  const handleNavigateDiary = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push('/diary');
  };

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
            
            <Image src="/images/hero.png" alt="Memoria Logo" width={600} height={160} />
            
            <p className="indie-flower-regular text-3xl mt-3 text-gray-500 tracking-wide lowercase italic">
              your ai diary, that never forgets
            </p>
          </div>

          {/* Notebook Block Showcase */}
          <div className="mt-12 sm:mt-16 relative w-full max-w-[760px] aspect-[760/480] sm:h-[480px] mx-auto group">
            
            {/* REAL DIARY IMAGE BACKGROUND - Totally non-clickable static background */}
            <div className="absolute inset-0 z-10 overflow-hidden rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.12)] select-none pointer-events-none">
              <Image 
                src="/images/pictures/book.png" 
                alt="Real notebook spread layout" 
                fill 
                className="object-cover transition-transform duration-300 group-hover:scale-[1.01]"
                priority
              />
            </div>

            {/* INTERACTIVE OVERLAYS */}
            <div className="absolute inset-0 flex p-4 sm:p-8 z-20">
              
              {/* LEFT PAGE: My Memories Target Elements */}
              <div className="w-1/2 xs:pr-2 sm:pr-6 relative flex flex-col items-center justify-start">
                {/* Clickable Badge */}
                <button 
                  onClick={handleNavigateMemories}
                  className="relative font-sans xs:text-[8px] md:text-5xl sm:text-4xl xs:px-2 lg:px:4 bg-[#D1FADF]/90 text-[#245E33] shadow-sm font-medium tracking-wide transform indie-flower-regular xs:mt-4 sm:mt-8 md:mt-12 whitespace-nowrap cursor-pointer hover:opacity-90 active:scale-95 transition-all"
                >
                  My Memories
                </button>
                
                {/* Clickable Polaroid */}
                <div 
                  onClick={handleNavigateMemories}
                  className="mt-8 sm:mt-20 w-24 sm:w-44 aspect-square transform -rotate-6 relative group-hover:rotate-[-4deg] transition-transform duration-300 drop-shadow-md cursor-pointer hover:brightness-105 active:scale-95"
                >
                  <Image 
                    src="/images/pictures/memories.png" 
                    alt="Memories photo element" 
                    fill 
                    className="object-contain" 
                  />
                  <div className="absolute -top-2 sm:-top-4 -left-2 sm:-left-3 text-lg sm:text-3xl drop-shadow-md select-none">
                      <Image src="/images/star/green-star.png" alt="Green Star Icon" width={60} height={60} />
                  </div>
                </div>
              </div>

              {/* RIGHT PAGE: Open Diary Target Elements */}
              <div className="w-1/2 pl-2 sm:pl-6 relative flex flex-col items-center justify-start">
                {/* Clickable Badge */}
                <button 
                  onClick={handleNavigateDiary}
                  className="relative font-sans xs:text-[8px] md:text-5xl sm:text-4xl xs:px-2 lg:px:4 bg-[#FFE1EE]/90 text-[#A6265E] shadow-sm font-medium tracking-wide transform indie-flower-regular xs:mt-4 sm:mt-8 md:mt-12 whitespace-nowrap cursor-pointer hover:opacity-90 active:scale-95 transition-all"
                >
                  Open diary
                </button>

                {/* Clickable Polaroid */}
                <div 
                  onClick={handleNavigateDiary}
                  className="mt-8 sm:mt-16 w-24 sm:w-44 aspect-square transform rotate-8 relative group-hover:rotate-[5deg] transition-transform duration-300 drop-shadow-md cursor-pointer hover:brightness-105 active:scale-95"
                >
                  <Image 
                    src="/images/pictures/diary.png" 
                    alt="Today photo element" 
                    fill 
                    className="object-contain" 
                  />
                  <div className="absolute -top-2 sm:-top-4 -right-2 sm:-right-3 text-lg sm:text-3xl drop-shadow-md select-none">
                      <Image src="/images/star/pink-star.png" alt="Pink Star Icon" width={60} height={60} />
                  </div>
                </div>
              </div>

            </div>

            {/* Visual Stack Depths */}
            <div className="absolute inset-0 bg-white/40 border border-gray-200 rounded-2xl transform translate-y-1 sm:translate-y-2 translate-x-0.5 sm:translate-x-1 z-0 select-none pointer-events-none"></div>
            <div className="absolute inset-0 bg-white/20 border border-gray-300 rounded-2xl transform translate-y-2 sm:translate-y-4 translate-x-1 sm:translate-x-2 -z-10 select-none pointer-events-none"></div>
          </div>
        </section>

        {/* THREE FEATURE BLOCKS SECTION */}
        <section className="max-w-4xl mx-auto px-6 flex flex-col gap-24 sm:gap-36 mt-16 sm:mt-24">
          
          {/* Feature 1: Remembers */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-16">
            <div className="w-full md:w-1/2">
              <h2 className="fraunces text-3xl sm:text-[40px] font-normal font-serif leading-[1.15] text-[#111111] tracking-tight">
                Memoria <span className="bg-[#FFE1EE] px-2 py-0.5 rounded-sm inline-block transform -rotate-1">remembers</span> so you don't have to
              </h2>
            </div>
            <div className="w-full md:w-1/2 flex justify-center md:justify-end">
              <div className="relative w-[290px] h-[360px]">
                {/* The Colored Card Box - Behind */}
                <div className="absolute inset-0 bg-[#D63B81] rounded-2xl transform translate-x-4 translate-y-4 md:translate-x-6 md:translate-y-6 z-0"></div>
                
                {/* The Actual Image Card Container - On Top */}
                <div className="absolute inset-0 shadow-xl overflow-hidden rounded-2xl border border-gray-200/50 bg-white z-10">
                  <Image 
                    src="/images/pictures/crop_page.png" 
                    alt="Lined notebook page background" 
                    fill
                    className="object-cover"
                  />
                  
                  {/* THE TEXT LAYER: Sitting on top of the image canvas */}
                  <div className="absolute inset-0 p-8 flex flex-col justify-center">
                    <p className="indie-flower-regular font-sans sm:text-[15px] md:text-2xl leading-relaxed text-gray-700 font-normal">
                      Write freely. Memoria extracts the people, places, emotions and events from everything you share
                    </p>
                  </div>

                </div>
              </div>
            </div>
          </div>

          {/* Feature 2: Ask Anything */}
          <div className="flex flex-col md:flex-row-reverse items-center justify-between gap-8 md:gap-16">
            <div className="w-full md:w-1/2 md:pl-8">
              <h2 className="fraunces text-3xl sm:text-[40px] font-normal font-serif leading-[1.15] text-[#111111] tracking-tight">
                <span className="bg-[#E0F2F1] text-[#2E7D32] px-2 py-0.5 rounded-sm inline-block transform rotate-1">Ask anything</span> about your past
              </h2>
            </div>
            <div className="w-full md:w-1/2 flex justify-center md:justify-start">
              <div className="relative w-[290px] h-[360px]">
                {/* The Colored Card Box - Behind */}
                <div className="absolute inset-0 bg-[#6CB6B3] rounded-2xl transform -translate-x-4 translate-y-4 md:-translate-x-6 md:translate-y-6 z-0"></div>
                
                {/* The Actual Image Card Container - On Top */}
                <div className="absolute inset-0 shadow-xl overflow-hidden rounded-2xl border border-gray-200/50 bg-white z-10">
                  <Image 
                    src="/images/pictures/crop_page.png" 
                    alt="Lined notebook page background" 
                    fill
                    className="object-cover"
                  />
                  
                  {/* THE TEXT LAYER: Sitting on top of the image canvas */}
                  <div className="absolute inset-0 p-8 flex flex-col justify-center">
                    <p className="indie-flower-regular font-sans sm:text-[15px] md:text-2xl leading-relaxed text-gray-700 font-normal">
                      Forgot when you last felt happy? Can't remember what you decided about that job? Just ask. Memoria knows.
                    </p>
                  </div>

                </div>
              </div>
            </div>
          </div>

          {/* Feature 3: Visualized */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-16">
            <div className="w-full md:w-1/2">
              <h2 className="fraunces text-3xl sm:text-[40px] font-normal font-serif leading-[1.15] text-[#111111] tracking-tight">
                Your memory, <span className="bg-[#D1FADF] text-[#1B5E20] px-2 py-0.5 rounded-sm inline-block transform -rotate-1">visualized</span>
              </h2>
            </div>
            <div className="w-full md:w-1/2 flex justify-center md:justify-end">
              <div className="relative w-[290px] h-[360px]">
                {/* The Colored Card Box - Behind */}
                <div className="absolute inset-0 bg-[#3B7E48] rounded-2xl transform translate-x-4 translate-y-4 md:translate-x-6 md:translate-y-6 z-0"></div>
                
                {/* The Actual Image Card Container - On Top */}
                <div className="absolute inset-0 shadow-xl overflow-hidden rounded-2xl border border-gray-200/50 bg-white z-10">
                  <Image 
                    src="/images/pictures/crop_page.png" 
                    alt="Lined notebook page background" 
                    fill
                    className="object-cover"
                  />
                  
                  {/* THE TEXT LAYER: Sitting on top of the image canvas */}
                  <div className="absolute inset-0 p-8 flex flex-col justify-center">
                    <p className="indie-flower-regular font-sans sm:text-[15px] md:text-2xl leading-relaxed text-gray-700 font-normal">
                      Watch your life take shape as a graph. Every person, every feeling, every moment — connected
                    </p>
                  </div>

                </div>
              </div>
            </div>
          </div>

        </section>
      </div>
    </>
  );
};

export default MemoriaPage;