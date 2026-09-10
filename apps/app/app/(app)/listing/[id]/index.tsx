import { useLocalSearchParams } from 'expo-router';

import { ItemDetail } from '@/components/ItemDetail';

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ItemDetail kind="listing" id={id ?? ''} />;
}
