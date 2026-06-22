import { api, extractData } from './api';

export interface AssistantChatResult {
  configured: boolean;
  reply?: string;
}

export const assistantService = {
  async chat(code: string | undefined, messages: { role: string; content: string }[]) {
    return extractData<AssistantChatResult>(
      await api.post('/v1/assistant/chat', { code, messages })
    );
  },
};
