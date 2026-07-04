"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import ChatSidebar from "@/src/components/ChatSidebar";
import { api } from "@/src/api";
import { Message } from "@/src/types";

export default function DiaryPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentConvId, setCurrentConvId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);

  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadConversation = async (id: string) => {
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
    if (!input.trim() || loading || !currentConvId) return;

    let convId = currentConvId;
    if (!convId) {
    const newConv = await api.createConversation();
    convId = newConv._id;
    setCurrentConvId(convId);
    setRefreshTick(t => t + 1);
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
    <div className="flex h-screen max-h-screen bg-slate-50 text-slate-900 overflow-hidden">
      <ChatSidebar 
        currentConvId={currentConvId} 
        onSelect={loadConversation} 
        onNewChat={handleNewChat} 
        refreshTrigger={refreshTick}
      />

      <div className="flex-1 flex flex-col">
        <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 shadow-sm shrink-0">
          <Link href="/" className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition">
            ← Back to Home
          </Link>
          <span className="text-lg font-bold text-slate-700">Memoria Diary</span>
          <div className="w-24"></div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          <main className="space-y-4 max-w-4xl w-full mx-auto pb-4">
            {messages.length === 0 && !loading ? (
              <div className="text-center py-12 text-slate-400 font-medium">
                Start chatting. Your conversation will be saved automatically.
              </div>
            ) : (
              messages.map((msg, index) => {
                const isUser = msg.role === "user";
                return (
                  <div key={index} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-xl p-4 rounded-2xl shadow-sm ${
                      isUser 
                        ? "bg-slate-200 text-slate-800 rounded-tr-none" 
                        : "bg-white text-slate-900 border border-slate-100 rounded-tl-none"
                    }`}>
                      <p className="text-base leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      {!isUser && msg.action && msg.action !== "chat" && (
                        <span className="inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-600 uppercase tracking-wider">
                          {msg.action}
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

        <footer className="p-4 bg-white border-t border-slate-200 shrink-0">
          <div className="max-w-4xl mx-auto flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Share your thoughts..."
              className="flex-1 px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
              disabled={!currentConvId || loading}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim() || !currentConvId}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-medium rounded-xl shadow-md transition"
            >
              Send
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}