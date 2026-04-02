/**
 * Sentry initialisation for CamperPlan.
 *
 * Setup steps (one-time, 5 minutes):
 * 1. Go to https://sentry.io → create a free account
 * 2. New Project → React Native → name it "camperplan-app"
 * 3. Copy the DSN (looks like https://abc123@o0.ingest.sentry.io/123)
 * 4. Add to .env.local:   EXPO_PUBLIC_SENTRY_DSN=https://...
 * 5. Restart the dev server
 *
 * That's it — crashes, JS errors, and checkout breadcrumbs will appear in Sentry.
 */

import * as Sentry from '@sentry/react-native';

const DSN = process.env.EXPO_PUBLIC_SENTRY_DSN ?? '';

export function initialiseSentry() {
  if (!DSN) {
    if (__DEV__) console.warn('[Sentry] No DSN set. Add EXPO_PUBLIC_SENTRY_DSN to .env.local');
    return;
  }

  Sentry.init({
    dsn: DSN,
    environment: __DEV__ ? 'development' : 'production',
    // Only send errors in production, breadcrumbs always
    enabled: !__DEV__,
    // Capture 100% of errors on launch, reduce if volume gets high
    sampleRate: 1.0,
    // Performance tracing — set lower if needed
    tracesSampleRate: __DEV__ ? 0 : 0.2,
    // Attach device/OS context automatically
    attachStacktrace: true,
    // Ignore irrelevant noise
    ignoreErrors: [
      'Network request failed',
      'The network connection was lost',
      'Load failed',
    ],
    beforeSend(event) {
      // Strip any card/payment details from error payloads (GDPR/PCI safety)
      if (event.request?.data) {
        const data = event.request.data as Record<string, unknown>;
        if (data.card_number) data.card_number = '[REDACTED]';
        if (data.cvv) data.cvv = '[REDACTED]';
      }
      return event;
    },
  });
}
