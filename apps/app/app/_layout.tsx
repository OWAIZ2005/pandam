import '../src/styles/global.css';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { initMonitoring } from '@/lib/monitoring';
import { AppProviders } from '@/providers/AppProviders';

export default function RootLayout() {
  useEffect(() => {
    initMonitoring();
  }, []);

  return (
    <AppProviders>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </AppProviders>
  );
}
