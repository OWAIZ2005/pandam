import { useLocalSearchParams } from 'expo-router';

import { ItemDetail } from '@/components/ItemDetail';

export default function NeedDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ItemDetail kind="need" id={id ?? ''} />;
}
