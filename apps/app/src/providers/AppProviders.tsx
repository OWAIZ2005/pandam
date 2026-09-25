/**
 * Composes every app-wide provider in one place so the router layout stays
 * declarative. Order: gesture handler → safe-area → query cache → analytics →
 * auth bootstrap (loads the native session token before anything renders) →
 * toasts.
 *
 * Toasts sit INSIDE the safe-area provider (they read the bottom inset to
 * clear the home indicator) but outside the router, so a toast survives a
 * navigation — "your offer was sent" should still be readable on the screen
 * you land on afterwards.
 */
import { QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ScreenBackdropProvider, ToastProvider } from '@pandam/ui';

import { PandamBackground } from '@/components/brand/PandamBackground';

import { AnalyticsProvider } from '@/lib/analytics';
import { AuthBootstrap } from '@/lib/auth/AuthBootstrap';
import { createQueryClient } from '@/lib/query';

/** The one ambient background every standard screen paints (see Screen). */
const APP_BACKDROP = <PandamBackground variant="glow" />;

export function AppProviders({ children }: { children: ReactNode }) {
  // Lazy state initialiser → one stable QueryClient for the component's life.
  const [queryClient] = useState(createQueryClient);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AnalyticsProvider>
            <ToastProvider>
              <ScreenBackdropProvider value={APP_BACKDROP}>
                <AuthBootstrap>{children}</AuthBootstrap>
              </ScreenBackdropProvider>
            </ToastProvider>
          </AnalyticsProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
