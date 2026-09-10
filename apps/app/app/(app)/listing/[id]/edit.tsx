import { useLocalSearchParams } from 'expo-router';

import { ItemEditScreen } from '@/components/ItemEditScreen';

export default function EditListingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ItemEditScreen kind="listing" id={id ?? ''} />;
}
