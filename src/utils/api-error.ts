import axios from "axios";

export function getApiErrorMessage(error: unknown, fallback = "Request failed") {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data;
    if (message && typeof message === "object" && "message" in message) {
      const text = (message as { message?: string }).message;
      if (text) return text;
    }
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
