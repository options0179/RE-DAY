export type ChatMessageRole = "user" | "assistant" | "system";

export type MemoryType =
  | "preference"
  | "skill"
  | "goal"
  | "avoidance"
  | "experience"
  | "reflection"
  | "fact";

export type MemoryStatus =
  | "pending_confirmation"
  | "confirmed"
  | "rejected"
  | "expired";

export interface ChatSession {
  conversationId: string;
  userId: string;
  channel: string;
  relatedSimulationId: string | null;
  title: string | null;
  summary: string | null;
  messageCount: number;
  status: "active" | "closed";
  startedAt: string;
  lastMessageAt: string;
  summaryUpdatedAt: string | null;
}

export interface ChatMessage {
  messageId: string;
  conversationId: string;
  userId: string;
  role: ChatMessageRole;
  content: string;
  sequence: number;
  source: string;
  createdAt: string;
}

export interface UserMemory {
  memoryId: string;
  userId: string;
  type: MemoryType;
  key: string;
  value: string;
  confidence: number;
  sourceConversationId: string;
  sourceMessageId: string | null;
  status: MemoryStatus;
  createdAt: string;
  updatedAt: string;
  lastUsedAt: string | null;
}

export interface ChatContext {
  session: ChatSession;
  memories: UserMemory[];
  messages: ChatMessage[];
}
