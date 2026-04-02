# Supplier API Access Request Template

Use this message when requesting technical access from dropship partners.

---

Subject: CamperPlan launch API access request (stock, pricing, fulfilment)

Hi [Supplier Name],

We are finalizing launch for CamperPlan by Crafted Camper Co and need API access to automate product sync and order fulfilment.

Please share:

1. Product endpoints (GET)
- Full product list endpoint
- Fields available (SKU, name, description, image URL, stock, lead time, price, VAT)
- Category and attribute structure

2. Authentication
- Auth method (API key/OAuth/basic)
- Token expiry and refresh behavior
- IP allowlist requirements (if any)

3. Rate limits and reliability
- Requests per minute/hour
- Burst limits
- Error format and retry guidance

4. Order handoff endpoints (if available now)
- Create order endpoint
- Update/cancel order endpoint
- Order status endpoint/webhooks

5. Sandbox/testing
- Test credentials
- Test SKUs
- Sample payloads

6. Commercial and operations
- Who owns stock risk
- Lead time commitments
- RMA/returns flow and SLA

If API is not available yet, please provide a daily CSV export with these fields:
SKU, Name, Description, Category, Price ex VAT, Price inc VAT, Stock level, Lead time, Image URL.

Thanks,
[Your Name]  
Crafted Camper Co

---

