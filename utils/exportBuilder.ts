import { CamperState } from '@/context/CamperContext';
import { calculate } from './calculator';
import { calculateWater } from './waterCalculator';
import { calculateInsulation } from './insulationCalculator';
import { getVariant, variantLabel } from './vanDatabase';

export interface ExportSections {
  camperProfile: boolean;
  insulation: boolean;
  electrical: boolean;
  water: boolean;
  buildSummary: boolean;
}

export function generateBuildHTML(state: CamperState, sections: ExportSections, projectName: string): string {
  const spec = calculate(state);
  const waterSpec = calculateWater(state);

  let insulationResult: any = null;
  if (state.van) {
    const variant = getVariant(state.van.manufacturerId, state.van.model, state.van.wheelbase, state.van.roofHeight);
    if (variant) {
      const vanLabel = `${state.van.manufacturerName} ${state.van.model} (${variantLabel(variant)})`;
      insulationResult = calculateInsulation(variant, state.climates, vanLabel);
    }
  }

  const vanLabel = state.van ? `${state.van.manufacturerName} ${state.van.model} — ${state.van.wheelbase}${state.van.roofHeight ? ` ${state.van.roofHeight} Roof` : ''}` : 'Not specified';

  const css = `
    @page { size: A4 portrait; margin: 18mm 15mm 22mm 15mm; }
    * { box-sizing: border-box; }
    html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1A1A1A; margin: 0; padding: 28px 32px; background: #fff; line-height: 1.6; font-size: 11px; }
    .header { text-align: center; margin-bottom: 32px; border-bottom: 2px solid #D9A05B; padding-bottom: 24px; }
    .header h1 { font-size: 22px; color: #1A1A1A; margin: 0 0 6px; letter-spacing: 1px; }
    .header .subtitle { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 3px; }
    .header .project { font-size: 16px; color: #D9A05B; margin-top: 12px; font-weight: 700; }
    .header .van { font-size: 12px; color: #666; margin-top: 4px; }
    .section { margin-bottom: 24px; page-break-inside: avoid; }
    .section h2 { font-size: 12px; text-transform: uppercase; letter-spacing: 2px; color: #D9A05B; margin: 0 0 12px; border-bottom: 1px solid #eee; padding-bottom: 6px; }
    .grid { display: flex; flex-wrap: wrap; gap: 10px; }
    .card { background: #f8f7f4; border-radius: 6px; padding: 12px; flex: 1; min-width: 140px; }
    .card .label { font-size: 8px; text-transform: uppercase; letter-spacing: 1.5px; color: #888; margin-bottom: 3px; }
    .card .value { font-size: 18px; font-weight: 800; color: #1A1A1A; }
    .card .sub { font-size: 10px; color: #999; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { text-align: left; padding: 6px 10px; font-size: 10px; border-bottom: 1px solid #eee; }
    th { font-size: 8px; text-transform: uppercase; letter-spacing: 1px; color: #888; font-weight: 600; }
    td:last-child { text-align: right; font-weight: 600; }
    .company-footer { text-align: center; margin-top: 24px; padding-top: 12px; border-top: 1px solid #eee; color: #999; font-size: 8px; }
    .company-footer .logo-text { font-size: 10px; font-weight: 800; color: #D9A05B; margin-bottom: 3px; }
    .disclaimer { background: #fffbf0; border-left: 3px solid #D9A05B; padding: 10px 14px; margin: 14px 0; font-size: 10px; color: #666; border-radius: 0 6px 6px 0; }
    .safety-warn { background: rgba(192,57,43,0.06); border: 1px solid rgba(192,57,43,0.2); border-radius: 6px; padding: 10px 14px; margin: 10px 0; font-size: 10px; color: #C0392B; font-weight: 600; }
    .legal-footer { font-size: 7px; color: #aaa; border: 1px solid #E8E4E0; border-radius: 4px; padding: 8px; margin-top: 10px; line-height: 1.4; text-align: left; }
  `;

  let body = '';

  body += `<div class="header">
    <h1>CAMPERPLAN BY CRAFTED</h1>
    <div class="subtitle">Build Specification Report</div>
    <div class="project">${projectName}</div>
    <div class="van">${vanLabel}</div>
  </div>`;

  if (sections.camperProfile) {
    body += `<div class="section">
      <h2>Camper Profile</h2>
      <div class="grid">
        <div class="card"><div class="label">Usage</div><div class="value">${state.usage}</div></div>
        <div class="card"><div class="label">Crew</div><div class="value">${state.party}</div></div>
        <div class="card"><div class="label">Off-Grid Days</div><div class="value">${state.daysOffGrid}</div></div>
      </div>
      <div class="grid" style="margin-top:12px">
        <div class="card"><div class="label">Climates</div><div class="value" style="font-size:14px">${state.climates.join(', ')}</div></div>
        <div class="card"><div class="label">Destinations</div><div class="value" style="font-size:14px">${state.destinations.join(', ')}</div></div>
      </div>
      <table>
        <tr><td>Works from van</td><td>${state.worksFromVan ? 'Yes' : 'No'}</td></tr>
        <tr><td>Has pets</td><td>${state.hasPets ? 'Yes' : 'No'}</td></tr>
        <tr><td>Has children</td><td>${state.hasChildren ? 'Yes' : 'No'}</td></tr>
        <tr><td>Shower type</td><td>${state.showerType === 'indoor' ? 'Indoor Shower' : state.showerType === 'outdoor' ? 'Outdoor Shower' : 'No Shower'}</td></tr>
        ${state.showerType === 'indoor' ? `<tr><td>Shower frequency</td><td>${state.showerFrequency === 'daily' ? 'Daily' : state.showerFrequency === 'every2' ? 'Every 2 days' : 'Every 3 days'}</td></tr>` : ''}
      </table>
    </div>`;
  }

  if (sections.insulation && state.insulationEnabled && insulationResult) {
    body += `<div class="section">
      <h2>Insulation Specification</h2>
      <div class="grid">
        <div class="card"><div class="label">Total Area</div><div class="value">${insulationResult.surfaceAreas.total} m²</div></div>
        <div class="card"><div class="label">Climate</div><div class="value" style="font-size:14px">${insulationResult.climateLabel}</div></div>
      </div>
      <table>
        <tr><th>Material</th><th>Quantity</th></tr>
        ${insulationResult.products.map((p: any) => `<tr><td>${p.name}${p.thicknessMm ? ` (${p.thicknessMm}mm)` : ''}</td><td>${p.quantityM2} ${p.unit} — ${p.packEstimate}</td></tr>`).join('')}
      </table>
    </div>`;
  }

  if (sections.electrical) {
    body += `<div class="section">
      <h2>Electrical System</h2>
      <div class="grid">
        <div class="card"><div class="label">Battery Bank</div><div class="value">${spec.recommendedBankAh} Ah</div><div class="sub">LiFePO4 recommended</div></div>
        <div class="card"><div class="label">Solar</div><div class="value">${spec.recommendedSolarW} W</div></div>
        <div class="card"><div class="label">Daily Consumption</div><div class="value">${spec.dailyAh} Ah</div></div>
      </div>
      <div class="grid" style="margin-top:12px">
        <div class="card"><div class="label">Inverter</div><div class="value">${spec.inverterSize > 0 ? `${spec.inverterSize} VA` : 'None'}</div></div>
        <div class="card"><div class="label">DC-DC Charger</div><div class="value">${spec.dcDcChargerSize}A</div></div>
      </div>
      <table>
        <tr><th>Category</th><th>Daily (Ah)</th></tr>
        <tr><td>Base draw</td><td>${spec.consumption.base} Ah</td></tr>
        <tr><td>Party multiplier</td><td>${spec.consumption.party} Ah</td></tr>
        <tr><td>Cooking</td><td>${spec.consumption.cooking} Ah</td></tr>
        <tr><td>Heating</td><td>${spec.consumption.heating} Ah</td></tr>
        <tr><td>Hot water</td><td>${spec.consumption.hotWater} Ah</td></tr>
        <tr><td>Appliances</td><td>${spec.consumption.appliances} Ah</td></tr>
      </table>
    </div>`;
  }

  if (sections.water && state.waterEnabled) {
    body += `<div class="section">
      <h2>Water System</h2>
      <div class="grid">
        <div class="card"><div class="label">Fresh Water Tank</div><div class="value">${waterSpec.freshTankRecommended}L</div></div>
        <div class="card"><div class="label">Grey Water Tank</div><div class="value">${waterSpec.greyTankRecommended}L</div></div>
        <div class="card"><div class="label">Daily Usage</div><div class="value">${waterSpec.dailyLitres}L</div></div>
      </div>
      <table>
        <tr><th>Fixture</th><th>Daily (L)</th></tr>
        ${waterSpec.breakdown.map((b: any) => `<tr><td>${b.label}</td><td>${b.litres}L</td></tr>`).join('')}
      </table>
    </div>`;
  }

  if (sections.buildSummary) {
    body += `<div class="section">
      <h2>Build Summary</h2>
      <table>
        <tr><td>Cooking fuel</td><td>${state.cookFuel}</td></tr>
        <tr><td>Heating fuel</td><td>${state.heatFuel}</td></tr>
        <tr><td>Water heating fuel</td><td>${state.waterFuel}</td></tr>
        <tr><td>Solar generation</td><td>${spec.generation.solar} Ah/day</td></tr>
        <tr><td>Alternator charging</td><td>${spec.generation.alternator} Ah/day</td></tr>
        <tr><td>Shore power charging</td><td>${spec.generation.shorePower} Ah/day</td></tr>
        <tr><td>Total generation</td><td>${spec.generation.solar + spec.generation.alternator + spec.generation.shorePower} Ah/day</td></tr>
        ${spec.dailyLPG > 0 ? `<tr><td>LPG usage (${state.daysOffGrid} days)</td><td>${(spec.dailyLPG * state.daysOffGrid).toFixed(1)}L</td></tr>` : ''}
        ${spec.dailyDiesel > 0 ? `<tr><td>Diesel usage (${state.daysOffGrid} days)</td><td>${(spec.dailyDiesel * state.daysOffGrid).toFixed(1)}L${spec.dieselTankPct != null ? ` (approx. ${spec.dieselTankPct}% of fuel tank)` : ''}</td></tr>` : ''}
      </table>
    </div>`;
  }

  body += `<div class="disclaimer">
    These calculations are estimates based on industry-standard averages and the inputs you provided. Actual consumption, tank sizes, and insulation quantities may vary based on specific products, usage habits, and installation methods. We recommend consulting a professional for final specifications.
  </div>`;

  if (sections.electrical) {
    body += `<div class="safety-warn">
      ⚠ ELECTRICAL SAFETY: All electrical installations must be inspected, tested, and certified by a qualified/competent electrician before first use. An Electrical Installation Certificate (EIC) is required. Crafted Camper Co (Yorkshire) LTD accepts no liability for any damage, injury, or loss arising from installations based on this document.
    </div>`;
  }

  body += `<div class="company-footer">
    <div class="logo-text">CamperPlan by Crafted</div>
    Crafted Camper Co (Yorkshire) LTD<br/>
    dan@craftedcamper.co · craftedcamper.co<br/>
    Generated ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
  </div>`;

  body += `<div class="legal-footer">
    <strong>DISCLAIMER:</strong> This document is provided for planning and informational purposes only. It does not constitute professional electrical, plumbing, or engineering advice. All electrical installations must be carried out by a qualified/competent electrician and certified with an Electrical Installation Certificate (EIC) before first use, in compliance with BS 7671:2018+A2:2022, BS EN 1648-1/2, and all applicable regulations. Crafted Camper Co (Yorkshire) LTD accepts no responsibility or liability for any damage, injury, loss, or consequence arising from the use of this document or any installation based on its contents. Product specifications and prices are subject to change. It is the sole responsibility of the installer to verify compliance with all applicable standards.
  </div>`;

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>${css}</style></head><body>${body}</body></html>`;
}
