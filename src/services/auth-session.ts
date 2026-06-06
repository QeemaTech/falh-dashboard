type SessionExpiredHandler = (message: string) => void;

const handlers = new Set<SessionExpiredHandler>();

export function subscribeSessionExpired(handler: SessionExpiredHandler) {
  handlers.add(handler);
  return () => {
    handlers.delete(handler);
  };
}

export function notifySessionExpired(message = "Session expired. Please sign in again.") {
  handlers.forEach((handler) => handler(message));
}
