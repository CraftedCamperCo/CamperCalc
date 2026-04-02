# UI Overhaul Screen Map (Phase Delivery)

## Cluster 1 — Discovery + Catalog Foundation
- `app/shop.tsx`
  - New mode switch (`Shop` / `Repository`)
  - Search, category, stock/tier/sort filters
  - Catalog-driven cards (`APP_CATALOG`)
  - Detail modal with add/manual/open-page actions

## Cluster 2 — Repository Detail
- `app/repository-item.tsx`
  - Long-form item context
  - Commerce + compatibility details
  - Manual CTA + return navigation

## Cluster 3 — Basket/Checkout Continuity
- `app/basket.tsx` (existing)
  - Keep quantity/edit/remove/checkout behavior stable
  - Continue using CartContext contract to avoid checkout regressions

## Cluster 4 — Recommendation Compatibility
- `context/CartContext.tsx` + `data/catalogLegacyCompatibility.ts`
  - Preserve all recommendation-critical legacy IDs
  - Keep current budget/premium recommendation behavior unchanged

## QA Gate Per Cluster
- TypeScript clean
- Catalog import report generated
- Catalog integrity script passing
- Manual app flow spot checks:
  - Add/remove from Shop
  - Open repository detail
  - Basket totals and checkout launch
