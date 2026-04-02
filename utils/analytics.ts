/**
 * CamperPlan Analytics
 *
 * Lightweight event abstraction. All funnel events go through here.
 * Ready to connect to any provider (PostHog, Mixpanel, Amplitude, etc.)
 * by replacing the `send` function — every call site stays the same.
 *
 * Current behaviour: dev = console.log, prod = no-op until a provider is wired in.
 */

import * as Sentry from '@sentry/react-native';

const IS_DEV = __DEV__;

function send(event: string, props?: Record<string, unknown>) {
  if (IS_DEV) {
    console.log(`[analytics] ${event}`, props ?? '');
  }
  // TODO: Replace with your analytics provider call, e.g.:
  // posthog.capture(event, props);
  // mixpanel.track(event, props);
}

// ─── App lifecycle ────────────────────────────────────────────────────────────

export function trackAppOpen() {
  send('app_open');
}

export function trackAuthSuccess(method: 'email' | 'google' | 'apple') {
  send('auth_success', { method });
  Sentry.setTag('auth_method', method);
}

export function trackAuthError(error: string) {
  send('auth_error', { error });
}

// ─── Onboarding ───────────────────────────────────────────────────────────────

export function trackExperienceSelected(level: string) {
  send('experience_selected', { level });
}

export function trackProjectCreated() {
  send('project_created');
}

// ─── Planning journey ─────────────────────────────────────────────────────────

export function trackTabViewed(tab: string) {
  send('tab_viewed', { tab });
}

export function trackRecommendationsViewed(batteryAh: number, solarW: number, estimateGBP: number) {
  send('recommendations_viewed', { batteryAh, solarW, estimateGBP });
}

// ─── Shop ────────────────────────────────────────────────────────────────────

export function trackProductViewed(productId: string, productName: string, priceGBP: number) {
  send('product_viewed', { productId, productName, priceGBP });
}

export function trackAddToBasket(productId: string, productName: string, priceGBP: number, quantity: number) {
  send('add_to_basket', { productId, productName, priceGBP, quantity });
  Sentry.addBreadcrumb({ category: 'shop', message: `Added ${productName} to basket`, level: 'info' });
}

export function trackRemoveFromBasket(productId: string) {
  send('remove_from_basket', { productId });
}

export function trackBasketViewed(itemCount: number, totalGBP: number) {
  send('basket_viewed', { itemCount, totalGBP });
}

// ─── Checkout funnel ──────────────────────────────────────────────────────────

export function trackBeginCheckout(itemCount: number, totalGBP: number) {
  send('begin_checkout', { itemCount, totalGBP });
  Sentry.addBreadcrumb({ category: 'checkout', message: 'Checkout started', level: 'info', data: { totalGBP } });
}

export function trackCheckoutSuccess(orderId: string, totalGBP: number) {
  send('checkout_success', { orderId, totalGBP });
  Sentry.addBreadcrumb({ category: 'checkout', message: `Order ${orderId} completed`, level: 'info', data: { totalGBP } });
}

export function trackCheckoutCancel() {
  send('checkout_cancel');
  Sentry.addBreadcrumb({ category: 'checkout', message: 'Checkout cancelled', level: 'info' });
}

export function trackCheckoutError(error: string) {
  send('checkout_error', { error });
  Sentry.captureMessage(`Checkout error: ${error}`, 'error');
}

// ─── Sales Suite ──────────────────────────────────────────────────────────────

export function trackSalesSuiteUnlocked(totalSpendGBP: number) {
  send('sales_suite_unlocked', { totalSpendGBP });
}

export function trackSchematicViewed() {
  send('schematic_viewed');
}

export function trackSchematicExported(format: 'pdf' | 'png' | 'share') {
  send('schematic_exported', { format });
}

// ─── User identity (call after login) ────────────────────────────────────────

export function identifyUser(userId: string, email?: string) {
  Sentry.setUser({ id: userId, email });
  send('identify', { userId });
}

export function clearUser() {
  Sentry.setUser(null);
}
