import type { SupplierProduct } from './supplierCatalog';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export interface InvoiceCustomer {
  name: string;
  email: string;
  phone: string;
}

export interface InvoiceData {
  customer: InvoiceCustomer;
  items: SupplierProduct[];
  totalRRP: number;
  totalCrafted: number;
  savings: number;
  hasCraftedDiscount: boolean;
  reference: string;
  date: string;
}

function generateReference(): string {
  const now = new Date();
  const yr = now.getFullYear().toString().slice(-2);
  const mo = String(now.getMonth() + 1).padStart(2, '0');
  const dy = String(now.getDate()).padStart(2, '0');
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `CC-${yr}${mo}${dy}-${rand}`;
}

function buildHtml(data: InvoiceData): string {
  const { customer, items, totalRRP, totalCrafted, savings, hasCraftedDiscount, reference, date } = data;

  const useDiscounted = hasCraftedDiscount;
  const displayTotal = useDiscounted ? totalCrafted : totalRRP;

  const itemRows = items.map(item => {
    const price = useDiscounted ? item.craftedPrice : item.supplierPrice;
    return `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:13px;color:#333;">${item.name}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:13px;color:#333;text-align:center;">1</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:13px;color:#999;text-align:right;">${useDiscounted ? `<s>£${item.supplierPrice.toFixed(2)}</s>` : ''}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:13px;color:#333;text-align:right;font-weight:600;">£${price.toFixed(2)}</td>
      </tr>`;
  }).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    @page { margin: 40px; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #333; margin: 0; padding: 0; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; border-bottom: 3px solid #D9A05B; padding-bottom: 20px; }
    .brand { }
    .brand h1 { font-size: 22px; font-weight: 800; color: #1A1A1A; margin: 0 0 4px 0; letter-spacing: 0.5px; }
    .brand p { font-size: 10px; color: #999; margin: 0; letter-spacing: 2px; text-transform: uppercase; }
    .invoice-meta { text-align: right; }
    .invoice-meta h2 { font-size: 18px; color: #D9A05B; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 2px; }
    .invoice-meta p { font-size: 12px; color: #666; margin: 2px 0; }
    .customer { background: #f8f8f6; border-radius: 8px; padding: 16px 20px; margin-bottom: 24px; }
    .customer h3 { font-size: 10px; color: #D9A05B; margin: 0 0 8px 0; letter-spacing: 2px; text-transform: uppercase; }
    .customer p { font-size: 13px; margin: 3px 0; color: #333; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th { background: #1A1A1A; color: #fff; padding: 10px 12px; font-size: 10px; letter-spacing: 1px; text-transform: uppercase; text-align: left; }
    th:nth-child(2), th:nth-child(3), th:nth-child(4) { text-align: right; }
    .totals { text-align: right; margin-bottom: 32px; }
    .totals .line { display: flex; justify-content: flex-end; gap: 32px; padding: 6px 0; font-size: 13px; }
    .totals .line span:first-child { color: #999; }
    .totals .line span:last-child { font-weight: 600; min-width: 80px; text-align: right; }
    .totals .total-line { font-size: 18px; font-weight: 800; border-top: 2px solid #D9A05B; padding-top: 8px; margin-top: 4px; }
    .totals .savings-line span { color: #2E4C3D !important; font-weight: 700; }
    .footer { border-top: 1px solid #eee; padding-top: 16px; font-size: 11px; color: #999; line-height: 1.6; }
    .footer strong { color: #666; }
    .supplier-note { background: #f0ece3; border-radius: 6px; padding: 12px 16px; margin-bottom: 24px; font-size: 12px; color: #666; }
    .supplier-note strong { color: #D9A05B; }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">
      <h1>Crafted Camper Co.</h1>
      <p>CamperPlan by Crafted</p>
    </div>
    <div class="invoice-meta">
      <h2>Invoice</h2>
      <p><strong>Ref:</strong> ${reference}</p>
      <p><strong>Date:</strong> ${date}</p>
    </div>
  </div>

  <div class="customer">
    <h3>Customer Details</h3>
    <p><strong>${customer.name}</strong></p>
    <p>${customer.email}</p>
    <p>${customer.phone}</p>
  </div>

  <table>
    <thead>
      <tr>
        <th>Product</th>
        <th style="text-align:center">Qty</th>
        <th style="text-align:right">${useDiscounted ? 'RRP' : ''}</th>
        <th style="text-align:right">Price</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
    </tbody>
  </table>

  <div class="totals">
    <div class="line">
      <span>Subtotal (RRP)</span>
      <span>£${totalRRP.toFixed(2)}</span>
    </div>
    ${useDiscounted ? `
    <div class="line savings-line">
      <span>Crafted Discount (5%)</span>
      <span>-£${savings.toFixed(2)}</span>
    </div>
    ` : ''}
    <div class="line total-line">
      <span>Total</span>
      <span>£${displayTotal.toFixed(2)}</span>
    </div>
  </div>

  <div class="supplier-note">
    Products supplied by <strong>Batteries and Solar Ltd</strong> — batteriesandsolar.co.uk<br>
    All prices are inclusive of VAT where applicable. Prices subject to change.
  </div>

  <div class="footer">
    <strong>Crafted Camper Co.</strong> — Premium campervan build planning<br>
    This invoice is for reference purposes. Products should be ordered directly through the supplier links provided in the app, or by contacting dan@craftedcamper.co for assisted ordering.<br><br>
    <strong>Note:</strong> This is a component recommendation list, not a confirmed order. Please verify all product specifications match your build requirements before purchasing.
  </div>
</body>
</html>`;
}

export async function generateInvoice(
  customer: InvoiceCustomer,
  items: SupplierProduct[],
  totalRRP: number,
  totalCrafted: number,
  savings: number,
  hasCraftedDiscount: boolean,
): Promise<{ uri: string; data: InvoiceData }> {
  const reference = generateReference();
  const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  const data: InvoiceData = { customer, items, totalRRP, totalCrafted, savings, hasCraftedDiscount, reference, date };
  const html = buildHtml(data);

  const { uri } = await Print.printToFileAsync({ html, base64: false });
  return { uri, data };
}

export async function shareInvoice(uri: string): Promise<void> {
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Save or Share Your Invoice',
      UTI: 'com.adobe.pdf',
    });
  }
}
