export type AiProvider = "openai" | "gemini";

export type AiSettings = {
  id: string;
  provider: AiProvider;
  model: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  dailyLimitPerUser: number;
  createdAt?: string;
  updatedAt?: string;
};

export type AiSettingsPayload = {
  systemPrompt?: string;
  dailyLimitPerUser?: number;
};

export type AiChatMessagePayload = {
  conversationId?: string;
  message: string;
};

export type AiChatResponse = {
  conversationId: string;
  answer: string;
  usageLimit?: {
    dailyLimit: number;
    usedToday: number;
    remainingToday: number;
  };
  createdAt: string;
};

export type AiConversationSummary = {
  id: string;
  title: string;
  messageCount: number;
  lastMessage?: {
    question: string;
    answer: string;
    createdAt: string;
  } | null;
  createdAt: string;
  updatedAt: string;
};

export type AiConversationDetail = {
  id: string;
  title: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  messages: Array<{
    id: string;
    question: string;
    answer: string;
    model: string;
    tokens?: number | null;
    createdAt: string;
  }>;
};

export const OPENAI_MODELS = ["gpt-4o-mini", "gpt-4.1", "gpt-4o"] as const;
export const GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"] as const;

export const DEFAULT_AI_SYSTEM_PROMPT = `You are "اسأل خير", an intelligent AI assistant inside the Faleh platform.

You can help users with agriculture, crops, irrigation, fertilizers, livestock, poultry, and greenhouses.
You can also answer general knowledge, educational, business, technology, and everyday questions.

Respond in the same language the user writes in. Be accurate, helpful, and well-structured.`;

export const DEFAULT_AI_SETTINGS: AiSettings = {
  id: "default",
  provider: "gemini",
  model: "gemini-3.5-flash",
  systemPrompt: DEFAULT_AI_SYSTEM_PROMPT,
  temperature: 0.7,
  maxTokens: 2048,
  dailyLimitPerUser: 10,
};

export function normalizeAiSettings(raw: Partial<AiSettings> | null | undefined): AiSettings {
  const provider = "gemini";
  const model = raw?.model || DEFAULT_AI_SETTINGS.model;

  return {
    id: raw?.id || DEFAULT_AI_SETTINGS.id,
    provider,
    model,
    systemPrompt: raw?.systemPrompt?.trim() || DEFAULT_AI_SETTINGS.systemPrompt,
    temperature: Number.isFinite(Number(raw?.temperature))
      ? Number(raw?.temperature)
      : DEFAULT_AI_SETTINGS.temperature,
    maxTokens: Number.isFinite(Number(raw?.maxTokens))
      ? Number(raw?.maxTokens)
      : DEFAULT_AI_SETTINGS.maxTokens,
    dailyLimitPerUser: Number.isFinite(Number(raw?.dailyLimitPerUser))
      ? Number(raw?.dailyLimitPerUser)
      : DEFAULT_AI_SETTINGS.dailyLimitPerUser,
    createdAt: raw?.createdAt,
    updatedAt: raw?.updatedAt,
  };
}
