import { ScrollView } from 'react-native';

import { type Category } from '@pandam/types';
import { Chip, spacing } from '@pandam/ui';

export interface CategoryFilterProps {
  categories: Category[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

/** Horizontal, scrollable category chips with an "All" reset. */
export function CategoryFilter({ categories, selectedId, onSelect }: CategoryFilterProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: spacing.sm, paddingRight: spacing.xl }}
    >
      <Chip label="All" selected={selectedId === null} onPress={() => onSelect(null)} />
      {categories.map((c) => (
        <Chip
          key={c.id}
          label={c.name}
          selected={selectedId === c.id}
          onPress={() => onSelect(selectedId === c.id ? null : c.id)}
        />
      ))}
    </ScrollView>
  );
}
