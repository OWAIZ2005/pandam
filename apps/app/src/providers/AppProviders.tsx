/**
 * Composes every app-wide provider in one place so the router layout stays
 * declarative. Order matters: gesture handler outermost, then safe-area, then
 * data/analytics.
 */
import { QueryClientProvider } from '@tanstack/react-query';
import { useRef } from 'react';
import { type ReactNode } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AnalyticsProvider } from '@/lib/analytics';
import { createQueryClient } from '@/lib/query';

export function AppProviders({ children }: { children: ReactNode }) {
  const queryClient = useRef(createQueryClient()).current;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AnalyticsProvider>{children}</AnalyticsProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
