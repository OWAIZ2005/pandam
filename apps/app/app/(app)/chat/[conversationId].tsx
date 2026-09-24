import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, View } from 'react-native';

import { type MessageView } from '@pandam/types';
import {
  Avatar,
  EmptyState,
  IconButton,
  Input,
  Press,
  Row,
  Screen,
  SkeletonList,
  Text,
  colors,
  layout,
  radii,
  spacing,
} from '@pandam/ui';

import { IS_DEMO_DATA, demoConversations, demoMessages, demoQuery } from '@/dummy';
import { ErrorState } from '@/components/states';
import { TradeContextCard, tradeSubtitle } from '@/components/TradeContextCard';
import { useOffer } from '@/lib/hooks/useOffers';
import { mediaSrc } from '@/lib/api/media';
import { dayLabel, timeOfDay } from '@/lib/format';
import {
  useConversation,
  useMarkConversationRead,
  useMessages,
  useSendMessage,
} from '@/lib/hooks/useConversations';

/** A message, plus what its neighbours mean for how it should be drawn. */
interface Rendered {
  message: MessageView;
  /** First of a run from the same person — gets the rounded outer corner. */
  startsRun: boolean;
  /** Last of a run — gets the tail and the timestamp. */
  endsRun: boolean;
  /** Day separator to draw above it, if the day changed. */
  daySeparator: string | null;
}

/** Two messages belong to the same run if same sender and within five minutes. */
const RUN_WINDOW_MS = 5 * 60_000;

function group(messages: MessageView[]): Rendered[] {
  return messages.map((message, i) => {
    const prev = messages[i - 1];
    const next = messages[i + 1];

    const sameAsPrev =
      !!prev &&
      prev.isMine === message.isMine &&
      message.createdAt - prev.createdAt < RUN_WINDOW_MS;
    const sameAsNext =
      !!next &&
      next.isMine === message.isMine &&
      next.createdAt - message.createdAt < RUN_WINDOW_MS;

    const dayChanged = !prev || dayLabel(prev.createdAt) !== dayLabel(message.createdAt);

    return {
      message,
      startsRun: !sameAsPrev || dayChanged,
      endsRun: !sameAsNext,
      daySeparator: dayChanged ? dayLabel(message.createdAt) : null,
    };
  });
}

/**
 * One message.
 *
 * Consecutive messages from the same person are drawn as a run: square inner
 * corners, one tail at the bottom, and a single timestamp on the last bubble.
 * Stamping every bubble with a time — which is what this screen did before —
 * turns a two-line exchange into a wall of metadata, and the times are all
 * within a minute of each other anyway.
 */
function Bubble({ item }: { item: Rendered }) {
  const { message, startsRun, endsRun } = item;
  const mine = message.isMine;

  return (
    <View
      style={{
        alignSelf: mine ? 'flex-end' : 'flex-start',
        maxWidth: '82%',
        alignItems: mine ? 'flex-end' : 'flex-start',
        marginTop: startsRun ? spacing.md : 2,
      }}
    >
      <View
        style={{
          backgroundColor: mine ? colors.accent : colors.surface,
          borderWidth: mine ? 0 : 1,
          borderColor: colors.border,
          borderRadius: radii.lg,
          // The corner facing this speaker's side squares off mid-run, so a
          // run reads as one block of speech rather than three separate ones.
          borderTopRightRadius: mine && !startsRun ? radii.xs : radii.lg,
          borderBottomRightRadius: mine && !endsRun ? radii.xs : radii.lg,
          borderTopLeftRadius: !mine && !startsRun ? radii.xs : radii.lg,
          borderBottomLeftRadius: !mine && !endsRun ? radii.xs : radii.lg,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
        }}
      >
        <Text
          style={{
            lineHeight: 20,
            color: mine ? colors.textInverse : colors.textPrimary,
          }}
        >
          {message.body}
        </Text>
      </View>

      {endsRun ? (
        <Text variant="caption" tone="faint" style={{ marginTop: 3, marginHorizontal: spacing.xs }}>
          {timeOfDay(message.createdAt)}
        </Text>
      ) : null}
    </View>
  );
}

/** The "Today" / "Yesterday" rule between days. */
function DaySeparator({ label }: { label: string }) {
  return (
    <Row gap="md" align="center" style={{ marginTop: spacing.xl, marginBottom: spacing.xs }}>
      <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
      <Text variant="caption" tone="muted">
        {label}
      </Text>
      <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
    </Row>
  );
}

export default function ChatScreen() {
  const router = useRouter();
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const liveConversation = useConversation(conversationId);
  const liveMessages = useMessages(conversationId);
  const demoConv = IS_DEMO_DATA
    ? demoConversations.find((c) => c.id === conversationId)
    : undefined;
  const conversation = demoConv ? demoQuery(liveConversation, demoConv) : liveConversation;
  const messages = demoConv
    ? demoQuery(liveMessages, demoMessages[demoConv.id] ?? [])
    : liveMessages;
  const send = useSendMessage(conversationId!);
  const markRead = useMarkConversationRead(conversationId!);
  const [draft, setDraft] = useState('');
  const listRef = useRef<FlatList<Rendered>>(null);

  useEffect(() => {
    if (conversationId) markRead.mutate();
    // Mark read once per conversation visit — not on every refetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  const person = conversation.data?.participants[0];
  // The trade this chat belongs to (every trade chat is tied to one offer).
  const offer = useOffer(conversation.data?.offerId ?? undefined);
  const name = person?.displayName ?? 'Chat';
  const rendered = useMemo(() => group(messages.data ?? []), [messages.data]);
  const canSend = !!draft.trim() && !send.isPending;

  const handleSend = () => {
    const body = draft.trim();
    if (!body) return;
    setDraft('');
    send.mutate(body, {
      onSuccess: () => setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50),
    });
  };

  return (
    <Screen padded={false} edges={['top', 'bottom']}>
      {/*
        A chat header is a navigation bar, not a page title: it stays compact,
        names the person, and gets out of the way. Tapping it opens their
        profile the way every messaging app people already use does.
      */}
      <Row
        gap="sm"
        style={{
          paddingHorizontal: spacing.sm,
          paddingRight: layout.gutter,
          paddingVertical: spacing.sm,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          backgroundColor: colors.surface,
        }}
      >
        <IconButton
          variant="plain"
          size={40}
          icon={<Ionicons name="chevron-back" size={22} color={colors.textPrimary} />}
          accessibilityLabel="Back to messages"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(app)/messages'))}
        />

        <Press
          scale="none"
          dim={false}
          accessibilityRole="button"
          accessibilityLabel={`${name}, open their listings`}
          onPress={() =>
            person ? router.push(`/(app)/(tabs)/discover?owner=${person.id}`) : undefined
          }
          style={{ flex: 1, minWidth: 0, borderRadius: radii.sm }}
        >
          <Row gap="sm" style={{ paddingVertical: 2 }}>
            <Avatar name={name} size={32} uri={mediaSrc(person?.avatarUrl)} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text variant="bodyStrong" numberOfLines={1}>
                {name}
              </Text>
              <Text variant="caption" tone="muted" numberOfLines={1}>
                {tradeSubtitle(offer.data)}
              </Text>
            </View>
          </Row>
        </Press>
      </Row>

      {offer.data ? (
        <View
          style={{
            width: '100%',
            maxWidth: layout.contentMaxWidth,
            alignSelf: 'center',
            paddingHorizontal: layout.gutter,
            paddingTop: spacing.md,
          }}
        >
          <TradeContextCard
            offer={offer.data}
            onOpen={() => router.push(`/(app)/offer/${offer.data!.id}`)}
          />
        </View>
      ) : null}

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.select({ ios: 90, default: 0 })}
      >
        {messages.isPending ? (
          <View style={{ paddingHorizontal: layout.gutter, paddingTop: spacing.lg }}>
            <SkeletonList count={3} />
          </View>
        ) : messages.isError ? (
          <ErrorState error={messages.error} onRetry={() => void messages.refetch()} />
        ) : (
          <FlatList
            ref={listRef}
            data={rendered}
            keyExtractor={(r) => r.message.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              width: '100%',
              maxWidth: layout.contentMaxWidth,
              alignSelf: 'center',
              paddingHorizontal: layout.gutter,
              paddingVertical: spacing.lg,
              flexGrow: 1,
            }}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
            renderItem={({ item }) => (
              <>
                {item.daySeparator ? <DaySeparator label={item.daySeparator} /> : null}
                <Bubble item={item} />
              </>
            )}
            ListEmptyComponent={
              <EmptyState
                tone="accent"
                icon={<Ionicons name="hand-left-outline" size={22} color={colors.accent} />}
                title="Say hello"
                body={`You and ${name} agreed a trade. Sort out where and when to swap.`}
              />
            }
          />
        )}

        <Row
          gap="sm"
          align="flex-end"
          style={{
            paddingHorizontal: layout.gutter,
            paddingVertical: spacing.md,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            backgroundColor: colors.surface,
          }}
        >
          <View style={{ flex: 1 }}>
            <Input
              placeholder="Message…"
              value={draft}
              onChangeText={setDraft}
              onSubmitEditing={handleSend}
              returnKeyType="send"
              multiline
              // The default multiline field is a 104pt box, which is right for
              // a description and far too tall for a composer. It grows from
              // one line instead.
              style={{ minHeight: 0, maxHeight: 120, paddingVertical: spacing.sm }}
            />
          </View>
          <IconButton
            variant={canSend ? 'surface' : 'filled'}
            icon={
              <Ionicons
                name="arrow-up"
                size={18}
                color={canSend ? colors.textInverse : colors.textFaint}
              />
            }
            accessibilityLabel="Send message"
            disabled={!canSend}
            onPress={handleSend}
            // Filled terracotta only once there is something to send: a live-looking
            // send button on an empty composer is a promise the app cannot keep.
            style={
              canSend ? { backgroundColor: colors.accent, borderColor: colors.accent } : undefined
            }
          />
        </Row>
      </KeyboardAvoidingView>
    </Screen>
  );
}
