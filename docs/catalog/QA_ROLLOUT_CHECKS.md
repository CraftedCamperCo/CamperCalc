# Catalog + UI QA Rollout Checks

## Automated checks
Run:

```bash
npm run catalog:validate
```

This performs:
- workbook import from `Crafted Campers.xlsx`
- catalog integrity checks
- full TypeScript compile

## Manual checks (critical)
- Shop mode:
  - search returns expected items by SKU/name
  - stock/tier/category filters narrow correctly
  - sort rotates through all modes
  - add/remove basket state updates immediately
- Repository mode:
  - item details open from modal
  - `Open page` route loads content
  - manual links open externally
- Basket:
  - quantities can increment/decrement/remove
  - totals update correctly
  - checkout launch still works

## Data quality notes from latest import
- Missing images/manual URLs exist in supplier sheet and should be enriched in next pass.
- Duplicate SKU detected: `109339`.

## Safe rollout recommendation
- Keep recommendation + calculator flows pinned to legacy IDs.
- Keep supplier catalog additive (merged), not replacing legacy IDs until SKU mapping is complete.
