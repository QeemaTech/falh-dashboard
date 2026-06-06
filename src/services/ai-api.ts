import { http } from "./http";
import type {
  AiChatMessagePayload,
  AiChatResponse,
  AiConversationDetail,
  AiConversationSummary,
} from "../types/ai";

type ApiResponse<T> = {
  success: boolean;
  data: T;
  meta?: { page?: number; limit?: number; total?: number; totalPages?: number };
};

/** POST /api/ai/chat — send a message (creates conversation when conversationId is omitted) */
export async function sendAiChatMessageApi(payload: AiChatMessagePayload) {
  const { data } = await http.post<ApiResponse<AiChatResponse>>("/ai/chat", payload);
  return data.data;
}

/** GET /api/ai/conversations */
export async function fetchAiConversationsApi(params?: { page?: number; limit?: number }) {
  const { data } = await http.get<ApiResponse<AiConversationSummary[]>>("/ai/conversations", {
    params,
  });
  return {
    items: data.data,
    meta: data.meta,
  };
}

/** GET /api/ai/conversations/:id */
export async function fetchAiConversationApi(conversationId: string) {
  const { data } = await http.get<ApiResponse<AiConversationDetail>>(`/ai/conversations/${conversationId}`);
  return data.data;
}

/** DELETE /api/ai/conversations/:id */
export async function deleteAiConversationApi(conversationId: string) {
  await http.delete(`/ai/conversations/${conversationId}`);
}

/** POST /api/ai-assistant/ask — legacy single-turn endpoint */
export async function askAiAssistantLegacyApi(question: string) {
  const { data } = await http.post<ApiResponse<AiChatResponse & { model?: string; tokens?: number }>>(
    "/ai-assistant/ask",
    { question }
  );
  return data.data;
}
