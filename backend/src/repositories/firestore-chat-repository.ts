import type { Firestore } from "firebase-admin/firestore";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import type {
  ChatContext,
  ChatMessage,
  ChatSession,
  MemoryStatus,
  UserMemory,
} from "../contracts/chat.ts";
import { ConflictError, NotFoundError } from "../errors/domain-errors.ts";

const iso = (value: unknown): string =>
  value instanceof Timestamp ? value.toDate().toISOString() : String(value);

const sessionFromData = (
  conversationId: string,
  data: FirebaseFirestore.DocumentData,
): ChatSession => ({
  conversationId,
  userId: String(data.userId),
  channel: String(data.channel),
  relatedSimulationId: data.relatedSimulationId
    ? String(data.relatedSimulationId)
    : null,
  title: data.title ? String(data.title) : null,
  summary: data.summary ? String(data.summary) : null,
  messageCount: Number(data.messageCount ?? 0),
  status: data.status === "closed" ? "closed" : "active",
  startedAt: iso(data.startedAt),
  lastMessageAt: iso(data.lastMessageAt),
  summaryUpdatedAt: data.summaryUpdatedAt ? iso(data.summaryUpdatedAt) : null,
});

const messageFromData = (
  conversationId: string,
  messageId: string,
  data: FirebaseFirestore.DocumentData,
): ChatMessage => ({
  messageId,
  conversationId,
  userId: String(data.userId),
  role: data.role,
  content: String(data.content),
  sequence: Number(data.sequence),
  source: String(data.source),
  createdAt: iso(data.createdAt),
});

const memoryFromData = (
  userId: string,
  memoryId: string,
  data: FirebaseFirestore.DocumentData,
): UserMemory => ({
  memoryId,
  userId,
  type: data.type,
  key: String(data.key),
  value: String(data.value),
  confidence: Number(data.confidence),
  sourceConversationId: String(data.sourceConversationId),
  sourceMessageId: data.sourceMessageId ? String(data.sourceMessageId) : null,
  status: data.status,
  createdAt: iso(data.createdAt),
  updatedAt: iso(data.updatedAt),
  lastUsedAt: data.lastUsedAt ? iso(data.lastUsedAt) : null,
});

export class FirestoreChatRepository {
  constructor(private readonly db: Firestore) {}

  async getOrCreateSession(
    userId: string,
    conversationId: string,
    channel: string,
    title: string | null,
    relatedSimulationId: string | null,
  ): Promise<ChatSession> {
    const ref = this.db
      .collection("users")
      .doc(userId)
      .collection("chatSessions")
      .doc(conversationId);
    const existing = await ref.get();
    if (existing.exists) {
      const session = sessionFromData(conversationId, existing.data()!);
      if (session.userId !== userId) {
        throw new ConflictError("Conversation belongs to another user");
      }
      return session;
    }

    const now = new Date();
    const data = {
      conversationId,
      userId,
      channel,
      relatedSimulationId,
      title,
      summary: null,
      messageCount: 0,
      status: "active",
      startedAt: Timestamp.fromDate(now),
      lastMessageAt: Timestamp.fromDate(now),
      summaryUpdatedAt: null,
    };
    await ref.create(data);
    return sessionFromData(conversationId, data);
  }

  async getSession(userId: string, conversationId: string): Promise<ChatSession> {
    const ref = this.db
      .collection("users")
      .doc(userId)
      .collection("chatSessions")
      .doc(conversationId);
    const snapshot = await ref.get();
    if (!snapshot.exists) {
      throw new NotFoundError(`Chat session not found: ${conversationId}`);
    }
    return sessionFromData(conversationId, snapshot.data()!);
  }

  async appendMessage(
    userId: string,
    conversationId: string,
    message: Omit<ChatMessage, "conversationId" | "userId" | "createdAt">,
  ): Promise<ChatMessage> {
    const sessionRef = this.db
      .collection("users")
      .doc(userId)
      .collection("chatSessions")
      .doc(conversationId);
    const messageRef = sessionRef.collection("messages").doc(message.messageId);
    const result = await this.db.runTransaction(async (transaction) => {
      const sessionSnapshot = await transaction.get(sessionRef);
      if (!sessionSnapshot.exists) {
        throw new NotFoundError(`Chat session not found: ${conversationId}`);
      }
      const existing = await transaction.get(messageRef);
      if (existing.exists) {
        return messageFromData(conversationId, message.messageId, existing.data()!);
      }
      const now = new Date();
      const data = {
        ...message,
        conversationId,
        userId,
        createdAt: Timestamp.fromDate(now),
      };
      transaction.create(messageRef, data);
      transaction.update(sessionRef, {
        messageCount: FieldValue.increment(1),
        lastMessageAt: Timestamp.fromDate(now),
      });
      return {
        ...message,
        conversationId,
        userId,
        createdAt: now.toISOString(),
      };
    });
    return result;
  }

  async listMessages(
    userId: string,
    conversationId: string,
    limit: number,
  ): Promise<ChatMessage[]> {
    await this.getSession(userId, conversationId);
    const snapshot = await this.db
      .collection("users")
      .doc(userId)
      .collection("chatSessions")
      .doc(conversationId)
      .collection("messages")
      .orderBy("sequence", "desc")
      .limit(limit)
      .get();
    return snapshot.docs
      .map((doc) => messageFromData(conversationId, doc.id, doc.data()))
      .reverse();
  }

  async updateSummary(
    userId: string,
    conversationId: string,
    summary: string,
    title: string | null,
  ): Promise<ChatSession> {
    const ref = this.db
      .collection("users")
      .doc(userId)
      .collection("chatSessions")
      .doc(conversationId);
    const now = new Date();
    await ref.update({
      summary,
      title,
      summaryUpdatedAt: Timestamp.fromDate(now),
    });
    return this.getSession(userId, conversationId);
  }

  async createMemory(
    userId: string,
    input: Omit<UserMemory, "memoryId" | "userId" | "createdAt" | "updatedAt" | "lastUsedAt">,
  ): Promise<UserMemory> {
    const ref = this.db.collection("users").doc(userId).collection("memories").doc();
    const now = new Date();
    const data = {
      ...input,
      userId,
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
      lastUsedAt: null,
    };
    await ref.create(data);
    return memoryFromData(userId, ref.id, data);
  }

  async listConfirmedMemories(userId: string): Promise<UserMemory[]> {
    const snapshot = await this.db
      .collection("users")
      .doc(userId)
      .collection("memories")
      .where("status", "==", "confirmed")
      .orderBy("updatedAt", "desc")
      .limit(50)
      .get();
    return snapshot.docs.map((doc) => memoryFromData(userId, doc.id, doc.data()));
  }

  async updateMemoryStatus(
    userId: string,
    memoryId: string,
    status: MemoryStatus,
  ): Promise<UserMemory> {
    const ref = this.db
      .collection("users")
      .doc(userId)
      .collection("memories")
      .doc(memoryId);
    const snapshot = await ref.get();
    if (!snapshot.exists) throw new NotFoundError(`Memory not found: ${memoryId}`);
    const now = new Date();
    await ref.update({ status, updatedAt: Timestamp.fromDate(now) });
    return memoryFromData(userId, memoryId, {
      ...snapshot.data(),
      status,
      updatedAt: Timestamp.fromDate(now),
    });
  }

  async getContext(
    userId: string,
    conversationId: string,
    limit: number,
  ): Promise<ChatContext> {
    const [session, memories, messages] = await Promise.all([
      this.getSession(userId, conversationId),
      this.listConfirmedMemories(userId),
      this.listMessages(userId, conversationId, limit),
    ]);
    return { session, memories, messages };
  }
}
