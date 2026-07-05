import {Conversation} from "./types";
import {Message} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";

export const api = {
  // Auth
  async register(email: string, password: string): Promise<{ access_token: string; user_id: string }> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.detail || "Failed to create account");
    localStorage.setItem("token", data.access_token);
    return data;
  },

  async login(email: string, password: string): Promise<{ access_token: string; user_id: string }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.detail || "Failed to sign in");
    localStorage.setItem("token", data.access_token);
    return data;
  },

  logout(): void {
    localStorage.removeItem("token");
  },

  async getMe(): Promise<{ user_id: string; email: string }> {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to fetch profile");
    return res.json();
  },

  // Conversations
  async getConversations(): Promise<Conversation[]> {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_BASE}/conversations/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to fetch conversations");
    return res.json();
  },

  async createConversation(): Promise<Conversation> {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_BASE}/conversations/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) throw new Error("Failed to create conversation");
    return res.json();
  },

  async getConversation(id: string): Promise<{ messages: Message[] }> {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_BASE}/conversations/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  async sendMessage(payload: any) {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_BASE}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Chat request failed");
    return res.json();
  },

  async getGraph(): Promise<{ nodes: any[]; edges: any[] }> {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_BASE}/graph`, {
      cache: "no-store",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to fetch memory graph");
    return res.json();
  },

  async getHistory(): Promise<{ history: string[] }> {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_BASE}/history?t=${Date.now()}`, {
      cache: "no-store",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to fetch memory history");
    return res.json();
  },

  deleteConversation: async (id: string): Promise<{ success: boolean }> => {
    // FIX: this call previously sent no Authorization header at all, unlike
    // every other request here — would 401 the moment auth is enforced.
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_BASE}/conversations/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to delete conversation");
    return res.json();
  }
};