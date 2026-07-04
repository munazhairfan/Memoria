export interface Message {
  role: "user" | "assistant";
  content: string;
  action?: "remember" | "recall" | "chat";
  timestamp?: string;
}

export interface Conversation {
  _id: string;
  title: string;
  updated_at: string;
  preview?: string;
}

export interface ChatRequest {
  conversationId?: string;
  message: string;
  history: { role: string; content: string }[];
}