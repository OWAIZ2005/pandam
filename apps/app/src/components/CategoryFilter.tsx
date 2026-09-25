import { Ionicons } from '@expo/vector-icons';
import { type ComponentProps, useState } from 'react';
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
  /** When set, the row ends with a "New" chip that calls this. */
  onAdd?: () => void;
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
  onAdd,
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
      {onAdd ? (
        <Chip
          label="New"
          icon={<Ionicons name="add" size={14} color={colors.accent} />}
          selected={false}
          tone={tone}
          onPress={onAdd}
        />
      ) : null}
    </Rail>
  );
}

export interface CategoryGridProps {
  categories: Category[];
  onSelect: (id: string) => void;
  /** Cap the tiles shown (the Add tile counts toward it); the caller renders "see all". */
  limit?: number;
  /** When set, the grid ends with an "Add" tile that calls this. */
  onAdd?: () => void;
}

const GRID_GAP = spacing.md;
/** Width of the tile's icon box; labels get a fixed two-line slot beneath. */
const LABEL_LINES = 2;
const LABEL_LINE_HEIGHT = 15;

/**
 * The browse grid on Home.
 *
 * Every tile is the SAME width (measured from the container, never flexGrow),
 * so columns line up and a short last row does not stretch. The label always
 * reserves two lines, so a long name ("Musical Instruments") wraps without
 * pushing its row taller than its neighbours, and never clips. Neutral tiles
 * let the icon identify the category; the optional Add tile is the one
 * accent-outlined tile, so it reads as an action rather than a category.
 */
export function CategoryGrid({ categories, onSelect, limit, onAdd }: CategoryGridProps) {
  const [width, setWidth] = useState(0);
  const columns =
    width === 0 ? 4 : width < 260 ? 3 : Math.min(8, Math.max(4, Math.floor(width / 96)));
  const tileW = width ? Math.floor((width - GRID_GAP * (columns - 1)) / columns) : 0;

  const room = limit ? limit - (onAdd ? 1 : 0) : categories.length;
  const shown = categories.slice(0, Math.max(0, room));

  const tileStyle = { width: tileW, gap: spacing.sm, alignItems: 'center' as const };
  const box = {
    width: '100%' as const,
    height: Math.min(64, tileW || 64),
    borderRadius: radii.md,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  };
  const label = (text: string, tone?: 'accent') => (
    <Text
      variant="caption"
      center
      numberOfLines={LABEL_LINES}
      tone={tone}
      style={{
        lineHeight: LABEL_LINE_HEIGHT,
        minHeight: LABEL_LINE_HEIGHT * LABEL_LINES,
        fontWeight: tone ? '700' : '500',
        alignSelf: 'stretch',
      }}
    >
      {text}
    </Text>
  );

  return (
    <View
      onLayout={(e) => setWidth(Math.floor(e.nativeEvent.layout.width))}
      style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: GRID_GAP, rowGap: spacing.lg }}
    >
      {tileW > 0
        ? shown.map((c) => (
            <Press
              key={c.id}
              scale="sm"
              accessibilityRole="button"
              accessibilityLabel={`Browse ${c.name}`}
              onPress={() => onSelect(c.id)}
              style={tileStyle}
            >
              <View
                style={{
                  ...box,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Ionicons name={categoryIcon(c.slug)} size={24} color={colors.textSecondary} />
              </View>
              {label(c.name)}
            </Press>
          ))
        : null}
      {tileW > 0 && onAdd ? (
        <Press
          scale="sm"
          accessibilityRole="button"
          accessibilityLabel="Add a category"
          onPress={onAdd}
          style={tileStyle}
        >
          <View
            style={{
              ...box,
              backgroundColor: colors.accentSoft,
              borderWidth: 1.5,
              borderStyle: 'dashed',
              borderColor: colors.accentBorder,
            }}
          >
            <Ionicons name="add" size={26} color={colors.accent} />
          </View>
          {label('Add', 'accent')}
        </Press>
      ) : null}
    </View>
  );
}

export interface CategoryRailProps {
  categories: Category[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  tone?: 'accent' | 'need';
  onAdd?: () => void;
}

const RAIL_TILE = 72;
const RAIL_BOX = 58;

/**
 * Discover's category filter: the SAME tile language as Home's "Browse by
 * category" grid (icon box + two-line label), laid out as one horizontal rail
 * so it stays compact above the results. "All" leads, the selected tile fills
 * with the current HAVE/NEED colour, and an Add tile ends the row.
 */
export function CategoryRail({
  categories,
  selectedId,
  onSelect,
  tone = 'accent',
  onAdd,
}: CategoryRailProps) {
  const fill = tone === 'need' ? colors.need : colors.accent;
  const text = tone === 'need' ? colors.needText : colors.accentText;

  const tile = (
    key: string,
    name: string,
    icon: ComponentProps<typeof Ionicons>['name'],
    selected: boolean,
    onPress: () => void,
    variant: 'category' | 'add' = 'category',
  ) => (
    <Press
      key={key}
      scale="sm"
      accessibilityRole={variant === 'add' ? 'button' : 'tab'}
      accessibilityState={variant === 'add' ? undefined : { selected }}
      accessibilityLabel={variant === 'add' ? 'Add a category' : name}
      onPress={onPress}
      style={{ width: RAIL_TILE, alignItems: 'center', gap: spacing.sm }}
    >
      <View
        style={{
          width: RAIL_BOX,
          height: RAIL_BOX,
          borderRadius: radii.md,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: variant === 'add' ? colors.accentSoft : selected ? fill : colors.surface,
          borderWidth: variant === 'add' ? 1.5 : selected ? 0 : 1,
          borderStyle: variant === 'add' ? 'dashed' : 'solid',
          borderColor: variant === 'add' ? colors.accentBorder : colors.border,
        }}
      >
        <Ionicons
          name={icon}
          size={variant === 'add' ? 26 : 23}
          color={
            variant === 'add' ? colors.accent : selected ? colors.textInverse : colors.textSecondary
          }
        />
      </View>
      <Text
        variant="caption"
        center
        numberOfLines={2}
        style={{
          lineHeight: LABEL_LINE_HEIGHT,
          minHeight: LABEL_LINE_HEIGHT * LABEL_LINES,
          alignSelf: 'stretch',
          fontWeight: selected || variant === 'add' ? '700' : '500',
          color: variant === 'add' ? colors.accentText : selected ? text : colors.textPrimary,
        }}
      >
        {name}
      </Text>
    </Press>
  );

  return (
    <Rail gap="sm">
      {tile('all', 'All', 'apps', selectedId === null, () => onSelect(null))}
      {categories.map((c) =>
        tile(c.id, c.name, categoryIcon(c.slug), selectedId === c.id, () =>
          onSelect(selectedId === c.id ? null : c.id),
        ),
      )}
      {onAdd ? tile('add', 'Add', 'add', false, onAdd, 'add') : null}
    </Rail>
  );
}
