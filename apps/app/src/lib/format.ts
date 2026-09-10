import { type PublicationStatus } from '@pandam/types';

/** Compact relative time, e.g. "3d", "just now". */
export function timeAgo(epochMs: number, now = Date.now()): string {
  const s = Math.max(0, Math.round((now - epochMs) / 1000));
  if (s < 45) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d}d ago`;
  const w = Math.round(d / 7);
  if (w < 5) return `${w}w ago`;
  return new Date(epochMs).toLocaleDateString();
}

export const STATUS_LABEL: Record<PublicationStatus, string> = {
  draft: 'Draft',
  published: 'Active',
  paused: 'Paused',
  archived: 'Archived',
};

export function statusBadgeKind(status: PublicationStatus): 'success' | 'neutral' | 'warning' {
  if (status === 'published') return 'success';
  if (status === 'paused') return 'warning';
  return 'neutral';
}

export const TYPE_LABEL: Record<'product' | 'service' | 'skill', string> = {
  product: 'Product',
  service: 'Service',
  skill: 'Skill',
};
