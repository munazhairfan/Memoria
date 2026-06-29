"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  action?: "remember" | "recall" | "chat";
}

export default function DiaryPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll layout tracking
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsgText = input.trim();
    setInput("");
    setLoading(true);
    
    const historyPayload = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const updatedMessages = [...messages, { role: "user" as const, content: userMsgText }];
    setMessages(updatedMessages);

    try {

      const response = await fetch("http://127.0.0.1:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsgText,
          history: historyPayload,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.reply,
            action: data.action,
          },
        ]);
      } else {
        throw new Error("Server error");
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, my memory systems crossed wires. Let's try that again.",
          action: "chat",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSend();
  };

  return (
    <div className="flex flex-col h-screen max-h-screen bg-slate-50 text-slate-900 overflow-hidden">
      
      {/* Top Navigation Bar */}
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 shadow-sm shrink-0">
        <Link href="/" className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition">
          ← Back to Home
        </Link>
        <span className="text-lg font-bold text-slate-700">Memoria Diary</span>
        <div className="w-24"></div>
      </header>

      {/* Main Bounded Scrollable Chat Space */}
      <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
        <main className="space-y-4 max-w-4xl w-full mx-auto pb-4">
          {messages.length === 0 ? (
            <div className="text-center py-12 text-slate-400 font-medium">
              Start chatting with Memoria. Tell me about your day!
            </div>
          ) : (
            messages.map((msg, index) => {
              const isUser = msg.role === "user";
              return (
                <div key={index} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-xl p-4 rounded-2xl shadow-sm relative ${
                      isUser 
                        ? "bg-slate-200 text-slate-800 rounded-tr-none" 
                        : "bg-white text-slate-900 border border-slate-100 rounded-tl-none"
                    }`}
                  >
                    <p className="text-base leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    
                    {!isUser && msg.action && msg.action !== "chat" && (
                      <span className={`inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-600 uppercase tracking-wider`}>
                        {msg.action === "remember" ? "saved" : "recalled"}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white text-slate-400 border border-slate-100 p-4 rounded-2xl rounded-tl-none animate-pulse">
                Memoria is reflecting...
              </div>
            </div>
          )}
          <div ref={chatBottomRef} />
        </main>
      </div>

      {/* Input Footer Bar - Anchored and Visible */}
      <footer className="p-4 bg-white border-t border-slate-200 shrink-0">
        <div className="max-w-4xl mx-auto flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Share your thoughts or ask about a memory..."
            className="flex-1 px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 text-base"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-medium rounded-xl shadow-md transition duration-200 whitespace-nowrap"
          >
            Send
          </button>
        </div>
      </footer>
    </div>
  );
}