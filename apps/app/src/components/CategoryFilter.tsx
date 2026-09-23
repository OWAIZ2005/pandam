import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

import { type Category } from '@pandam/types';
import { Chip, Press, Rail, Text, colors, radii, spacing } from '@pandam/ui';

import { categoryIcon } from '@/lib/icons';

export interface CategoryFilterProps {
  categories: Category[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  /** Which accent the selected chip paints. */
  tone?: 'accent' | 'need';
}

/**
 * Horizontal, scrollable category chips with an "All" reset.
 *
 * The icon inside each chip takes the SELECTED colour, not a fixed grey, so a
 * selected chip is a single solid shape rather than a coloured pill with a
 * grey mark stuck in it.
 */
export function CategoryFilter({
  categories,
  selectedId,
  onSelect,
  tone = 'accent',
}: CategoryFilterProps) {
  return (
    <Rail gap="sm">
      <Chip label="All" selected={selectedId === null} tone={tone} onPress={() => onSelect(null)} />
      {categories.map((c) => (
        <Chip
          key={c.id}
          label={c.name}
          tone={tone}
          selected={selectedId === c.id}
          icon={
            <Ionicons
              name={categoryIcon(c.slug)}
              size={13}
              color={selectedId === c.id ? colors.textInverse : colors.textMuted}
            />
          }
          onPress={() => onSelect(selectedId === c.id ? null : c.id)}
        />
      ))}
    </Rail>
  );
}

export interface CategoryGridProps {
  categories: Category[];
  onSelect: (id: string) => void;
  /** Cap the tiles shown; the caller renders its own "see all". */
  limit?: number;
  columns?: number;
}

/**
 * The browse grid on Home.
 *
 * Each tile is a quiet tinted square with one icon, not a coloured gradient
 * card. Eight gradients in a grid compete with each other and with the rest
 * of the page, and they make the catalogue look like a game menu; a
 * consistent neutral tile lets the ICON do the identifying, which is its job,
 * and lets the terracotta/clay language keep its meaning elsewhere.
 */
export function CategoryGrid({ categories, onSelect, limit, columns = 4 }: CategoryGridProps) {
  const shown = limit ? categories.slice(0, limit) : categories;

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
      {shown.map((c) => (
        <Press
          key={c.id}
          scale="sm"
          accessibilityRole="button"
          accessibilityLabel={`Browse ${c.name}`}
          onPress={() => onSelect(c.id)}
          style={{
            width: `${100 / columns}%`,
            flexGrow: 1,
            flexBasis: 68,
            maxWidth: 110,
            gap: spacing.sm,
            alignItems: 'center',
            paddingVertical: spacing.xs,
            borderRadius: radii.md,
          }}
          states={{ hover: { backgroundColor: colors.surfaceHover } }}
        >
          <View
            style={{
              width: '100%',
              aspectRatio: 1,
              maxHeight: 60,
              borderRadius: radii.md,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name={categoryIcon(c.slug)} size={22} color={colors.textSecondary} />
          </View>

          <Text variant="caption" center numberOfLines={2}>
            {c.name}
          </Text>
        </Press>
      ))}
    </View>
  );
}
