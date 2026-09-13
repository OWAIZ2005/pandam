import { type ConversationView, type MessageView } from '@pandam/types';

import { api } from './client';

export const conversationsApi = {
  list: () => api.get<{ items: ConversationView[] }>('/api/v1/conversations'),
  get: (id: string) => api.get<{ conversation: ConversationView }>(`/api/v1/conversations/${id}`),
  markRead: (id: string) => api.post<{ read: true }>(`/api/v1/conversations/${id}/read`),
  messages: (id: string) =>
    api.get<{ items: MessageView[] }>(`/api/v1/conversations/${id}/messages`),
  sendMessage: (id: string, body: string) =>
    api.post<{ message: MessageView }>(`/api/v1/conversations/${id}/messages`, { body }),
};
