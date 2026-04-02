# Business Operations Checks (Launch)

Version: 2026-03-09

Use this to confirm commercial operations are launch-ready.

## Finance and Compliance

- [ ] Confirm legal entity details are correct across app, website, Stripe, and invoices.
- [ ] Confirm VAT registration status and VAT handling approach.
- [ ] Confirm bookkeeping workflow for daily order reconciliation.
- [ ] Confirm refund accounting process and monthly reporting.

## Invoicing and Receipts

- [ ] Enable Stripe payment receipts for all successful payments.
- [ ] Decide VAT invoice path:
  - [ ] Stripe-generated invoice documents, or
  - [ ] Custom invoice PDF generated from order data.
- [ ] Confirm invoice numbering format and storage location.
- [ ] Confirm customer support process for invoice re-issue.

## Order and Fulfilment Operations

- [ ] Confirm order export/forwarding process to dropship supplier.
- [ ] Confirm SLA for order acceptance and dispatch acknowledgement.
- [ ] Confirm process for substitutions/backorders/out-of-stock.
- [ ] Confirm returns authorisation process (RMA or equivalent).

## Support and Complaints

- [ ] Publish support contact path and response-time expectation.
- [ ] Define escalation matrix for payment, fulfilment, and product issues.
- [ ] Publish complaints handling process and response windows.

## Security and Access

- [ ] Rotate exposed/shared secrets and enforce least-privilege access.
- [ ] Audit who has access to Stripe, Supabase, domain, and email systems.
- [ ] Confirm backup and incident response contacts.

