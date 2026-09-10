/**
 * PostHog analytics provider. Renders a passthrough when no key is configured
 * so the app works with zero analytics setup in local development.
 */
import { PostHogProvider } from 'posthog-react-native';
import { type ReactNode } from 'react';

import { clientEnv } from './env';

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  if (!clientEnv.posthogKey) return <>{children}</>;
  return (
    <PostHogProvider
      apiKey={clientEnv.posthogKey}
      options={{ host: clientEnv.posthogHost }}
      autocapture
    >
      {children}
    </PostHogProvider>
  );
}
