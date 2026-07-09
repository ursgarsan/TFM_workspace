import { apiRequest } from '@/services/api/http';

export type AssistantReply = {
  answer: string;
  source: string;
  created_at: string;
};

export function askAssistant(token: string, question: string): Promise<AssistantReply> {
  return apiRequest<AssistantReply>('/api/v1/assistant/query', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ question }),
  });
}
