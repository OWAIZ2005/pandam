import { useLocalSearchParams } from 'expo-router';

import { ItemEditScreen } from '@/components/ItemEditScreen';

export default function EditNeedScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ItemEditScreen kind="need" id={id ?? ''} />;
}
