# Shop + Repository IA Blueprint

## Mode Split
- `Shop`: conversion-first browsing, filtering, compare-by-price/value, add to basket.
- `Repository`: specification-first browsing, fitment notes, manuals, compatibility, install context.

## Primary Entry Points
- `app/shop.tsx`
  - mode toggle (`Shop` / `Repository`)
  - global search
  - category chips
  - stock/tier/sort controls
  - product detail modal entry
- `app/repository-item.tsx`
  - full reference detail screen
  - manual deep link
  - return to shop CTA

## Shared Taxonomy
- batteries
- electrical
- solar
- water
- insulation
- appliances
- misc (hidden by default in Shop)

## Shared UX Primitives
- Search input
- Horizontal chip filters
- Sort cycle (`recommended`, `price_low`, `price_high`, `name`)
- Product cards with:
  - image/placeholder
  - stock signal
  - price
  - detail entry
  - cart action

## Navigation Responsibilities
- `shop` route = discovery + filtering + quick add
- `repository-item` route = deep content and documentation for one item
- `basket` route = cart management + checkout start
