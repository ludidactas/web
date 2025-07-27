const sessions = new Map<string, unknown>();

export const getSession = (sessionId: string) => {
  return sessions.get(sessionId);
};

export const setSession = (sessionId: string, data: unknown) => {
  sessions.set(sessionId, data);
};