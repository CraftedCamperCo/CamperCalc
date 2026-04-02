# Go / No-Go Checklist (April 1 Launch)

Decision meeting target: 2026-03-28  
Rule: Any unchecked P0 item = **No-Go**

## P0 - Must Pass

- [ ] Checkout starts reliably from basket
- [ ] Payment success returns user into app success flow
- [ ] Payment cancel returns user into app cancel flow
- [ ] Stripe webhook records `orders` rows for successful payments
- [ ] Project purchase linkage updates after successful payment
- [ ] Support page is live and reachable in app
- [ ] Terms, Privacy, Returns, Shipping, Cookies pages live in app
- [ ] No critical crash in auth, projects, shop, basket, checkout
- [ ] Production secrets present and rotated where required

## P1 - Should Pass Before Hard Launch

- [ ] Customer order confirmation emails sent
- [ ] FAQ page finalized and reviewed
- [ ] Monitoring dashboard active (payments, webhook errors, crash alerts)
- [ ] Soft launch bug list triaged and P1s fixed
- [ ] Manual refund/cancellation runbook tested once

## Release Sign-Off

- Product sign-off: [ ]
- Engineering sign-off: [ ]
- Operations sign-off: [ ]
- Commercial sign-off: [ ]
- Final decision: GO [ ] / NO-GO [ ]

## Notes

- Decision notes:
- Risks accepted:
- Rollback owner:

