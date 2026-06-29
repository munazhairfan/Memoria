"use html"
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-slate-900 px-4">
      <div className="text-center max-w-xl">
        <h1 className="text-6xl font-extrabold tracking-tight mb-4 text-indigo-600">
          Memoria
        </h1>
        <p className="text-xl text-slate-600 mb-8 font-medium">
          Your AI diary that never forgets
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link 
            href="/diary" 
            className="w-full sm:w-auto px-8 py-3 bg-indigo-600 text-white font-semibold rounded-xl shadow-md hover:bg-indigo-700 transition duration-200 text-center"
          >
            Open Diary
          </Link>
          <Link 
            href="/memories" 
            className="w-full sm:w-auto px-8 py-3 bg-white text-indigo-600 font-semibold rounded-xl shadow-md border border-slate-200 hover:bg-slate-50 transition duration-200 text-center"
          >
            My Memories
          </Link>
        </div>
      </div>
    </div>
  );
}