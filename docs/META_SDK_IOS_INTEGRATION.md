# Meta SDK iOS Integration Brief

**For:** Cursor / engineering implementation
**Owner:** Dan Andrews (dan@craftedcamper.co)
**Repo:** CamperCalc (Expo SDK 51+, React Native, EAS Build)
**Status:** Web Pixel installed via `+html.tsx` (env-driven, ID `1487137036183593`). iOS native SDK not installed.

---

## Why this matters

Meta Ads Manager can run "App Install" and "App Promotion" campaigns optimised for in-app actions (purchase, registration, project_created). To do this, Meta needs to receive in-app events from the actual native iOS build. The web Pixel does NOT cover the native app.

Without the SDK installed:
- App Install campaigns can run but only optimise for installs (no value optimisation)
- Meta cannot find lookalikes off paying customers
- ROAS measurement is impossible
- Scaling beyond simple install campaigns is blocked

The SDK must be installed before we move beyond Phase 1 (web conversion campaigns) into Phase 2 (App Install + value-optimised campaigns).

---

## Prerequisite browser tasks (Dan does these BEFORE Cursor implements)

1. **Register the iOS app in Meta Events Manager:**
   - Go to https://business.facebook.com/events_manager2
   - Click "Connect Data Sources" > "App" > Connect
   - Choose iOS, link the App Store Connect listing for "CamperPlan by Crafted" (App ID 6761789983)
   - This generates a **Meta App ID** (different from the Apple App ID) and a **Client Token**
   - Copy both values

2. **Configure SKAdNetwork conversion schema:**
   - In the same Events Manager flow, set up the SKAN conversion value schema
   - Priority order for events (most valuable first):
     1. Purchase (revenue)
     2. InitiateCheckout
     3. AddToCart
     4. CompleteRegistration
     5. ProjectCreated (custom event)
     6. AppInstall

3. **Add credentials to repo env files** (manually, do not commit secrets):
   - `EXPO_PUBLIC_META_APP_ID=<from step 1>`
   - `EXPO_PUBLIC_META_CLIENT_TOKEN=<from step 1>`
   - Add the same to `.env.example` with empty values, document them

Once both values are in env, Cursor can implement.

---

## Implementation tasks

### 1. Install the package

```bash
npx expo install react-native-fbsdk-next
```

The `react-native-fbsdk-next` package is the actively maintained Expo-compatible Facebook SDK wrapper.

### 2. Configure the Expo config plugin

Edit `app.json` (or `app.config.ts` if used). Add to the `plugins` array:

```json
[
  "react-native-fbsdk-next",
  {
    "appID": "EXPO_PUBLIC_META_APP_ID",
    "clientToken": "EXPO_PUBLIC_META_CLIENT_TOKEN",
    "displayName": "CamperPlan",
    "scheme": "fbEXPO_PUBLIC_META_APP_ID",
    "advertiserIDCollectionEnabled": false,
    "autoLogAppEventsEnabled": true,
    "isAutoInitEnabled": true,
    "iosUserTrackingPermission": "This identifier will be used to deliver personalised ads to you."
  }
]
```

The plugin handles all native iOS Info.plist edits, URL schemes, and ATSConfiguration entries automatically during the prebuild step. Do not edit the iOS native files directly.

**Important:** Replace `EXPO_PUBLIC_META_APP_ID` and `EXPO_PUBLIC_META_CLIENT_TOKEN` strings with actual values OR use a `app.config.ts` that reads from env. Recommended: use `app.config.ts` so secrets aren't checked into source.

### 3. Add the App Tracking Transparency prompt

Apple requires an explicit ATT prompt before the SDK can collect tracking data on iOS 14.5+.

Add a startup hook in `app/_layout.tsx` (or wherever the root layout lives):

```typescript
import * as TrackingTransparency from 'expo-tracking-transparency';
import { Settings } from 'react-native-fbsdk-next';

useEffect(() => {
  if (Platform.OS !== 'ios') return;

  (async () => {
    const { status } = await TrackingTransparency.requestTrackingPermissionsAsync();
    Settings.initializeSDK();
    Settings.setAdvertiserTrackingEnabled(status === 'granted');
  })();
}, []);
```

Install `expo-tracking-transparency` if not already present:

```bash
npx expo install expo-tracking-transparency
```

The ATT prompt should fire ONCE on first app launch, after the user has seen at least the welcome screen (Apple guidance: do not prompt on cold launch before the user understands the app).

### 4. Create the event tracking helper

**File:** `lib/metaEvents.ts`

```typescript
import { AppEventsLogger } from 'react-native-fbsdk-next';

export type MetaEventName =
  | 'fb_mobile_complete_registration'
  | 'fb_mobile_add_to_cart'
  | 'fb_mobile_initiated_checkout'
  | 'fb_mobile_purchase'
  | 'project_created';

export function trackMetaEvent(
  name: MetaEventName,
  params?: { value?: number; currency?: string; content_ids?: string[]; [key: string]: unknown }
): void {
  if (params?.value !== undefined && params?.currency) {
    AppEventsLogger.logPurchase(params.value, params.currency, params);
  } else {
    AppEventsLogger.logEvent(name, params);
  }
}
```

Use the standard Meta event names (`fb_mobile_*` prefix) where Meta has predefined ones; use plain custom event names like `project_created` for app-specific events.

### 5. Wire events into app code

Add `trackMetaEvent` calls at the following points (find existing analytics/Sentry calls and place these near them):

| App Action | Event | Params |
|---|---|---|
| User completes signup | `fb_mobile_complete_registration` | `{ registration_method: 'email' }` |
| User creates first project | `project_created` | `{ project_id }` |
| User taps "Add to basket" in shop | `fb_mobile_add_to_cart` | `{ value, currency: 'GBP', content_ids: [product_id] }` |
| User taps "Checkout" / Stripe sheet opens | `fb_mobile_initiated_checkout` | `{ value, currency: 'GBP' }` |
| Stripe webhook confirms purchase | `fb_mobile_purchase` | `{ value, currency: 'GBP', content_ids: [order_id] }` |

For Purchase: this should fire from the success screen on the client AFTER the order is confirmed by Supabase. Use the order total in pence, divided by 100 to get pounds.

### 6. Build and submit a new iOS build

```bash
# Make sure env vars are set in EAS as well as local
eas secret:create --scope project --name EXPO_PUBLIC_META_APP_ID --value "<value>"
eas secret:create --scope project --name EXPO_PUBLIC_META_CLIENT_TOKEN --value "<value>"

# Production build
eas build --platform ios --profile production

# Once build completes
eas submit --platform ios --profile production --latest
```

App Store review window is typically 24 to 72 hours.

---

## Acceptance criteria

- [ ] `react-native-fbsdk-next` installed and configured via plugin in `app.json` / `app.config.ts`
- [ ] `expo-tracking-transparency` installed, ATT prompt fires once after first user interaction
- [ ] `lib/metaEvents.ts` exports `trackMetaEvent` helper
- [ ] All 5 standard events wired into the relevant screens/handlers
- [ ] EAS production build succeeds
- [ ] Build submitted to App Store Connect
- [ ] After approval, events visible in Meta Events Manager > Apps > CamperPlan within 24 hours of a real user installing
- [ ] No regressions in existing functionality (Stripe checkout still works, Supabase auth still works, etc.)

---

## Verify the SDK is working (post-deploy)

1. Install the new App Store build on a test device
2. Open Events Manager > Apps > CamperPlan > Test Events
3. Add the test device's IDFV (find it via Xcode > Devices and Simulators > select device)
4. Open the app, perform actions (sign up, create project, add to cart)
5. Each event should appear in Test Events within seconds

---

## Reference docs

- react-native-fbsdk-next docs: https://github.com/thebergamo/react-native-fbsdk-next
- Expo plugin guide: https://github.com/thebergamo/react-native-fbsdk-next/blob/main/EXPO_INSTALLATION.md
- Meta App Events overview: https://developers.facebook.com/docs/app-events/getting-started-app-events-ios
- Standard events: https://developers.facebook.com/docs/app-events/reference#standard-events
- ATT and SKAdNetwork: https://developers.facebook.com/docs/app-events/getting-started-app-events-ios/sdk-integration#att-prompt
