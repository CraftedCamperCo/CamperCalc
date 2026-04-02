# Analytics Event Plan (Launch)

Use this as the minimum event set for launch funnel visibility.

## Required Events

- `view_product`
  - params: `product_id`, `category`, `price`
- `add_to_basket`
  - params: `product_id`, `category`, `quantity`, `line_total`
- `begin_checkout`
  - params: `basket_value`, `item_count`
- `checkout_redirected`
  - params: `checkout_provider` (`stripe`), `session_id` (if available)
- `purchase_success`
  - params: `order_id`, `value`, `currency`, `item_count`
- `purchase_cancelled`
  - params: `session_id` (if available)
- `checkout_error`
  - params: `error_code`, `error_message`

## Minimum Dashboard Views

- Product views -> add to basket conversion
- Add to basket -> begin checkout conversion
- Begin checkout -> purchase success conversion
- Payment failure count by day
- Top drop-off step by day

## Ownership

- App emits client events
- Webhook confirms server-side purchase events
- Review dashboard daily during first 14 days post-launch

## External Inputs Needed

- Final analytics provider/account (GA4, PostHog, or Mixpanel)
- Measurement keys / API tokens
- Consent approach for web tracking (Cookie policy alignment)

