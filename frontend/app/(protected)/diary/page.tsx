"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import ChatSidebar from "@/src/components/ChatSidebar";
import { api } from "@/src/api";
import { Message } from "@/src/types";

export default function DiaryChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentConvId, setCurrentConvId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadConversation = async (id: string) => {
    if (!id) {
      setCurrentConvId(null);
      setMessages([]);
      return;
    }

    setCurrentConvId(id);
    setMessages([]);
    setLoading(true);

    try {
      const data = await api.getConversation(id);
      setMessages(data.messages || []);
    } catch (err) {
      console.error("Failed to load conversation:", err);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = async () => {
    try {
      const newConv = await api.createConversation();
      setCurrentConvId(newConv._id);
      setMessages([]);
      setRefreshTick(t => t + 1);
    } catch (err) {
      console.error("Failed to create conversation:", err);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    let convId = currentConvId;
    if (!convId) {
      try {
        const newConv = await api.createConversation();
        convId = newConv._id;
        setCurrentConvId(convId);
        setRefreshTick(t => t + 1);
      } catch (err) {
        console.error("Failed to create conversation:", err);
        return;
      }
    }

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
      const data = await api.sendMessage({
        conversationId: convId,
        message: userMsgText,
        history: historyPayload,
      });

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply,
          action: data.action,
        },
      ]);
      setRefreshTick(t => t + 1);
    } catch (err) {
      console.error("Send failed:", err);
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
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    // FIX: was `h-screen` with its own internal header — now that the
    // shared MemoriaHeader lives in app/(protected)/layout.tsx and this page
    // renders inside that layout's flex-1 area, this should fill whatever
    // space it's given (`h-full`), not claim the full raw viewport again.
    <div className="relative w-full h-full flex flex-col overflow-hidden text-[#111111] font-serif">
      <div className="absolute inset-0 -z-10 w-full h-full bg-[#148A8F]" />

      {/* CORE WORKSPACE SPLIT CONTAINER */}
      {/* FIX: was h-[calc(100vh-73px)], a hardcoded guess at the old header's
          height. Now that this page's own header is gone and its parent is a
          flex column, flex-1 fills exactly what's left, no guessing needed. */}
      <div className="flex flex-1 min-h-0 w-full overflow-hidden relative">

        <aside
          className={`h-full border-r border-black/15 flex flex-col transition-all duration-300 ease-in-out shrink-0 bg-black/25 backdrop-blur-xl relative overflow-hidden ${
            isSidebarOpen ? 'w-64' : 'w-0'
          }`}
        >
          <div className="w-64 h-full overflow-hidden flex flex-col [&_div]:bg-transparent [&_aside]:bg-transparent [&_nav]:bg-transparent [&_button]:text-gray-900">
            <ChatSidebar
              currentConvId={currentConvId}
              onSelect={(id) => loadConversation(id)}
              onNewChat={handleNewChat}
              refreshTrigger={refreshTick}
            />
          </div>
        </aside>

        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute top-4 p-2.5 bg-white/20 hover:bg-white/35 border border-white/25 text-xl rounded-xl transition-all duration-300 shadow-md z-40 backdrop-blur-sm active:scale-95 select-none"
          style={{ left: isSidebarOpen ? "calc(16rem + 16px)" : "16px" }}
          title="Toggle Sidebar"
        >
          {isSidebarOpen ? (
            <Image
              src="/images/icons/sidebar_open.png"
              alt="Open Book"
              width={24}
              height={24}
            />
          ) : (
            <Image
              src="/images/icons/sidebar_close.png"
              alt="Closed Book"
              width={24}
              height={24}
            />
          )}
        </button>

        <main className="flex-1 flex flex-col items-center justify-between p-4 md:p-6 overflow-hidden h-full relative">

          <div className="absolute inset-0 -z-10">
            <Image
              src="/images/pictures/full_page.png"
              alt="Chat background"
              fill
              priority
              className="object-cover opacity-40"
            />
          </div>

          <div className="w-full max-w-4xl h-full flex flex-col bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 shadow-xl overflow-hidden mt-14">

            <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4">
              {messages.length === 0 && !loading ? (
                <div className="flex-1 flex items-center justify-center text-center text-black/60 font-medium font-sans text-sm tracking-wide">
                  Start chatting. Your conversation will be saved automatically.
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isUser = msg.role === "user";
                  return (
                    <div key={index} className={`flex ${isUser ? "justify-end" : "justify-start"} w-full`}>
                      <div className={`max-w-[80%] md:max-w-[70%] px-4 py-2.5 rounded-2xl shadow-sm text-[16px] leading-relaxed indie-flower-regular ${
                        isUser
                          ? "bg-[#16787C] text-white rounded-br-none"
                          : "bg-white/90 text-gray-900 rounded-bl-none border border-white/40"
                      }`}>
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                        {!isUser && msg.action && msg.action !== "chat" && (
                          <span className="inline-block mt-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-black/10 text-teal-955 uppercase tracking-wider">
                            {msg.action}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}

              {loading && (
                <div className="flex justify-start w-full">
                  <div className="indie-flower-regular bg-white/60 text-gray-900/70 px-4 py-2.5 rounded-2xl rounded-bl-none animate-pulse font-sans text-sm border border-white/20">
                    Memoria is reflecting...
                  </div>
                </div>
              )}

              <div ref={chatBottomRef} />
            </div>

            <footer className="p-4 bg-black/10 border-t border-black/10 flex items-center gap-3 shrink-0">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Share your thoughts..."
                className="indie-flower-regular flex-1 h-11 bg-white/90 border border-black/15 rounded-xl shadow-inner focus:outline-none focus:ring-2 focus:ring-[#16787C]/40 px-4 font-sans text-sm transition-all text-gray-900"
                disabled={loading}
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="h-11 px-5 bg-white/90 hover:bg-white/80 disabled:bg-black/20 text-white font-medium rounded-xl shadow-md transition-all flex items-center justify-center text-sm disabled:shadow-none"
              >
                <img src="/images/icons/feather.png" alt="Send" width={40} height={40} />
              </button>
            </footer>

          </div>
        </main>
      </div>
    </div>
  );
}