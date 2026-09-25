import { Ionicons } from '@expo/vector-icons';
import { type OfferStatus, type OfferView } from '@pandam/types';
import { View } from 'react-native';

import { Press, Row, Text, colors, radii, spacing } from '@pandam/ui';

const STATUS: Record<OfferStatus, { label: string; fg: string; bg: string }> = {
  pending: { label: 'Pending', fg: colors.needText, bg: colors.needSoft },
  accepted: { label: 'Accepted', fg: colors.matchText, bg: colors.matchSoft },
  rejected: { label: 'Declined', fg: colors.dangerText, bg: colors.dangerSoft },
  cancelled: { label: 'Withdrawn', fg: colors.textMuted, bg: colors.surfaceMuted },
  expired: { label: 'Expired', fg: colors.textMuted, bg: colors.surfaceMuted },
};

/** One line under the chat header that says where the trade stands. */
export function tradeSubtitle(offer: OfferView | undefined): string {
  if (!offer) return 'Trade chat';
  switch (offer.status) {
    case 'pending':
      return offer.isMine ? 'Offer sent — waiting for a reply' : 'Sent you a trade offer';
    case 'accepted':
      return 'Trade agreed — arrange the swap';
    case 'rejected':
      return 'Offer declined';
    case 'cancelled':
      return 'Offer withdrawn';
    default:
      return 'Offer expired';
  }
}

/**
 * The compact "why are we talking" card pinned at the top of a trade chat:
 * what is being swapped for what, the offer's live status, and a way back to
 * the full offer (where accept / decline live).
 */
export function TradeContextCard({ offer, onOpen }: { offer: OfferView; onOpen: () => void }) {
  const s = STATUS[offer.status];
  return (
    <Press
      scale="sm"
      accessibilityRole="button"
      accessibilityLabel={`Trade offer: ${offer.offered.title} for ${offer.requested.title}. ${s.label}. View offer.`}
      onPress={onOpen}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        padding: spacing.md,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: radii.md,
          backgroundColor: colors.accentSoft,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name="swap-horizontal" size={18} color={colors.accent} />
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 1 }}>
        <Row gap="xs" align="center">
          <Text variant="caption" tone="muted" style={{ fontWeight: '700' }}>
            {offer.requestedKind === 'need' ? 'Offer for a request' : 'Trade offer'}
          </Text>
          <View
            style={{
              paddingHorizontal: 6,
              paddingVertical: 1,
              borderRadius: radii.sm,
              backgroundColor: s.bg,
            }}
          >
            <Text style={{ fontSize: 10.5, lineHeight: 14, fontWeight: '800', color: s.fg }}>
              {s.label}
            </Text>
          </View>
        </Row>
        <Text variant="bodyStrong" numberOfLines={1}>
          {offer.requested.title}
        </Text>
        <Text variant="caption" tone="secondary" numberOfLines={1}>
          {offer.isMine ? 'You offer' : 'They offer'}: {offer.offered.title}
        </Text>
      </View>
      <Row gap="xs" align="center">
        <Text variant="label" tone="accent" style={{ fontWeight: '700' }}>
          View
        </Text>
        <Ionicons name="chevron-forward" size={14} color={colors.accent} />
      </Row>
    </Press>
  );
}
