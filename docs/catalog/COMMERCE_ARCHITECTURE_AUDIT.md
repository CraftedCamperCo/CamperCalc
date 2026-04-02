# Commerce Architecture Audit

## Source-of-truth data today
- Static product list is defined in `data/victronCatalog.ts`.
- Runtime lookup map is derived from that file (`VICTRON_CATALOG_BY_ID`).
- Product type contract is `VictronProduct` in `utils/wiringTypes.ts`.

## Coupled flows
- **Shop browsing**: `app/shop.tsx` reads `VICTRON_CATALOG` directly and hardcodes category grouping.
- **Basket/cart operations**: `context/CartContext.tsx` reads `VICTRON_CATALOG_BY_ID` for all add-by-id operations.
- **Recommendations**: `context/CartContext.tsx` and `app/(tabs)/three.tsx` both hardcode recommendation IDs and tier logic.
- **Checkout**: `app/basket.tsx` sends cart items as line items to checkout session creation.
- **Wiring/add-on flows**: `app/wiring.tsx`, `app/(tabs)/insulation.tsx`, and `app/(tabs)/three.tsx` depend on specific product IDs.

## Main risks for catalog migration
1. ID drift breaking recommendation and bundle flows.
2. Category mismatch (existing UI categories vs supplier category labels).
3. Price source inconsistency (catalog estimated price vs supplier list price rules).
4. Missing metadata required by current UI (`manualUrl`, image URL, stock text).

## Migration strategy used in this overhaul
- Keep existing legacy IDs available.
- Introduce normalized catalog entities generated from the supplier workbook.
- Merge generated products into the app catalog without replacing legacy IDs.
- Add explicit compatibility mapping from legacy IDs to supplier SKUs where possible.
- Move shop UI to a new catalog service layer instead of reading `victronCatalog.ts` directly.
