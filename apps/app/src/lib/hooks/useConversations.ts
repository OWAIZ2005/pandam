/** TanStack Query hooks for conversations & messages. */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { conversationsApi } from '@/lib/api/conversations';
import { qk } from '@/lib/query/keys';

export function useConversations() {
  return useQuery({
    queryKey: qk.conversations.all,
    queryFn: async () => (await conversationsApi.list()).items,
    staleTime: 10_000,
    refetchInterval: 15_000,
  });
}

export function useConversation(id: string | undefined) {
  return useQuery({
    queryKey: qk.conversations.detail(id ?? ''),
    queryFn: async () => (await conversationsApi.get(id!)).conversation,
    enabled: !!id,
  });
}

export function useMessages(conversationId: string | undefined) {
  return useQuery({
    queryKey: qk.conversations.messages(conversationId ?? ''),
    queryFn: async () => (await conversationsApi.messages(conversationId!)).items,
    enabled: !!conversationId,
    refetchInterval: 4_000,
  });
}

export function useSendMessage(conversationId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => conversationsApi.sendMessage(conversationId, body),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: qk.conversations.messages(conversationId) });
      void client.invalidateQueries({ queryKey: qk.conversations.all });
    },
  });
}

export function useMarkConversationRead(conversationId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => conversationsApi.markRead(conversationId),
    onSuccess: () => void client.invalidateQueries({ queryKey: qk.conversations.all }),
  });
}
