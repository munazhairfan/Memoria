"use client";

import { useEffect, useState, useCallback } from "react";
import { Conversation } from "@/src/types";
import { api } from "@/src/api";

interface Props {
  currentConvId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  refreshTrigger: number; // New prop to trigger refresh
}

export default function ChatSidebar({ currentConvId, onSelect, onNewChat, refreshTrigger }: Props) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const loadConversations = useCallback(async () => {
    try {
      const data = await api.getConversations();
      setConversations(data);
    } catch (err) {
      console.error("Failed to load conversations:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations,refreshTrigger]);

  const handleNewChat = async () => {
    onNewChat();
    await loadConversations();
  };

  // ── NEW DELETE HANDLER ──
  const handleDeleteChat = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // 👈 Stops the row click from activating the deleted chat
    if (!confirm("Are you sure you want to delete this chat?")) return;

    try {
      await api.deleteConversation(id);
      
      // 💡 REFRESH STATE: Triggers the sidebar to re-fetch the active list from the database
      await loadConversations();
      
      // 💡 DESELECT: If the user just deleted the active chat session, clear the screen
      if (currentConvId === id) {
        onSelect(""); 
      }
    } catch (err) {
      console.error("Failed to delete conversation:", err);
    }
  };

  return (
    <div className="w-64 bg-white border-r border-slate-200 flex flex-col h-full items-center">
      <div className="px-4 border-b flex justify-center pt-8 pb-4">
        <button
          onClick={handleNewChat}
          className="w-full py-3 bg-[#7EC4C4] text-white rounded-xl font-medium hover:bg-[#6DA8A8] transition"
        >
          <span className="p-4">+ New Conversation</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <p className="text-center text-slate-400 py-8">Loading...</p>
        ) : conversations.length === 0 ? (
          <p className="text-center text-slate-400 py-8">No conversations yet</p>
        ) : (
          conversations.map((conv) => (
            <div
              key={conv._id}
              onClick={() => onSelect(conv._id)}
              className={`p-3 rounded-xl cursor-pointer mb-1 hover:bg-slate-50 transition flex items-center justify-between group ${
                conv._id === currentConvId ? "bg-indigo-50 border border-indigo-200" : ""
              }`}
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm line-clamp-1">{conv.title}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {conv.updated_at ? new Date(conv.updated_at).toLocaleDateString() : "No date"}
                </p>
              </div>

              {/* ── TRASH CAN DELETE BUTTON ── */}
              {/* ── TRASH CAN DELETE BUTTON ── */}
              <button
                onClick={(e) => handleDeleteChat(e, conv._id)}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition ml-2 shrink-0"
                title="Delete Chat"
              >
                <img src="/images/icons/trash.png" alt="Delete Chat" width={20} height={20} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}