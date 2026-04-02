/**
 * Generates a multi-page A4 PDF document for the wiring schematic using
 * the actual Victron product imagery (base64-embedded), formatted with
 * proper page breaks, company branding, and legal disclaimers.
 */
import type { WiringSpec, SystemConfig } from './wiringTypes';
import { generateSchematicSVG } from './schematicSVG';

const C = { accent: '#D9A05B', dark: '#1A1A1A', red: '#C0392B', green: '#27AE60', grey: '#888' };

const COMPANY_FOOTER = `
<div class="company-footer">
  <div class="footer-logo">CamperPlan by Crafted</div>
  <div class="footer-details">
    Crafted Camper Co (Yorkshire) LTD<br/>
    dan@craftedcamper.co · craftedcamper.co<br/>
  </div>
  <div class="footer-legal">
    <strong>IMPORTANT DISCLAIMER:</strong> All electrical calculations, cable sizes, fuse ratings, and system recommendations provided in this document
    are for planning and informational purposes only. They do not constitute professional electrical advice. All electrical installations
    must be inspected, tested, and certified by a qualified/competent electrician before first use. An Electrical Installation Certificate (EIC)
    is required. Crafted Camper Co (Yorkshire) LTD accepts no liability for any damage, injury, or loss arising from the use of this document
    or the installation of any electrical system based on its contents. It is the sole responsibility of the installer to ensure compliance
    with BS 7671:2018+A2:2022 (IET Wiring Regulations), BS EN 1648-1/2, and all applicable local and national regulations.
  </div>
</div>`;

function pageCSS() {
  return `
  @page { size: A4 landscape; margin: 10mm 12mm 14mm 12mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; color: #1A1A1A; font-size: 10px; line-height: 1.5; background: #fff; }
  .page { page-break-after: always; min-height: 100vh; position: relative; padding: 0; }
  .page:last-child { page-break-after: auto; }
  .page-landscape { }
  .page-inner { padding: 0 8px; }

  /* Cover */
  .cover-bar { background: #1A1A1A; color: #fff; padding: 24px 28px; display: flex; justify-content: space-between; align-items: flex-start; }
  .cover-bar h1 { font-size: 22px; font-weight: 800; color: #D9A05B; letter-spacing: 1px; margin-top: 10px; }
  .cover-bar .sub { font-size: 10px; color: rgba(255,255,255,0.6); margin-top: 6px; line-height: 1.8; }
  .badge { background: #D9A05B; color: #1A1A1A; font-size: 9px; font-weight: 800; padding: 4px 12px; border-radius: 5px; letter-spacing: 0.5px; white-space: nowrap; }
  .logo-img { height: 30px; margin-bottom: 8px; }

  /* Headings */
  h2 { font-size: 10px; font-weight: 800; color: #D9A05B; letter-spacing: 2px; text-transform: uppercase; margin: 16px 0 8px; border-bottom: 1px solid #E0DCDA; padding-bottom: 5px; }

  /* Spec cards */
  .spec-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 10px 0 14px; }
  .spec-card { background: #F8F9FA; border: 1px solid #E0DCDA; border-radius: 6px; padding: 10px; }
  .spec-card .lbl { font-size: 7px; font-weight: 800; color: #888; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 3px; }
  .spec-card .val { font-size: 16px; font-weight: 800; }

  /* Tables */
  table { width: 100%; border-collapse: collapse; font-size: 9px; margin-bottom: 12px; }
  th { background: #1A1A1A; color: #D9A05B; padding: 6px 8px; text-align: left; font-size: 8px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; }
  td { padding: 6px 8px; border-bottom: 1px solid #F0ECE9; vertical-align: top; }
  tr:nth-child(even) td { background: #FAFAFA; }
  .total-row td { font-weight: 800; color: #D9A05B; background: #1A1A1A; }

  /* Boxes */
  .warn { background: rgba(192,57,43,.07); border: 1px solid rgba(192,57,43,.25); border-radius: 6px; padding: 8px 12px; margin: 5px 0; font-size: 10px; color: #C0392B; font-weight: 600; }
  .discount { background: rgba(46,76,61,.07); border: 1px solid rgba(46,76,61,.25); border-radius: 6px; padding: 10px 12px; margin: 10px 0; font-size: 10px; font-weight: 600; color: #2E4C3D; }
  .safety { background: #C0392B; color: #fff; padding: 12px; text-align: center; font-weight: 800; font-size: 11px; border-radius: 6px; margin: 10px 0; letter-spacing: 0.5px; }

  /* Diagram — page 1 full-bleed schematic */
  .diagram-wrap { background: #F8F9FA; border: 1px solid #E0DCDA; border-radius: 8px; padding: 8px; margin: 10px 0; overflow: hidden; }
  .diagram-wrap svg { display: block; width: 100%; height: auto; }

  /* Schematic-only page: fixed A4 landscape sizing (no vh units) */
  .schematic-page {
    padding: 0;
    overflow: hidden;
    page-break-inside: avoid;
    page-break-after: always;
    position: relative;
    width: 277mm;   /* A4 landscape printable width (297 - 2×10mm margin) */
    height: 182mm;  /* A4 landscape printable height (210 - 14mm - 14mm margin) */
    max-height: 182mm;
    margin: 0;
  }
  .diagram-full {
    overflow: hidden;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding-bottom: 1mm;
  }
  .diagram-full svg {
    display: block;
    width: 100%;
    height: auto;
    max-height: 180mm;
    margin: 0;
  }

  /* Footer */
  .company-footer { border-top: 1px solid #E0DCDA; padding-top: 10px; margin-top: 16px; text-align: center; font-size: 8px; color: #888; }
  .company-footer .footer-logo { font-size: 10px; font-weight: 800; color: #D9A05B; margin-bottom: 4px; }
  .company-footer .footer-details { margin-bottom: 6px; }
  .company-footer .footer-legal { text-align: left; font-size: 7px; line-height: 1.4; color: #999; border: 1px solid #E8E4E0; border-radius: 4px; padding: 8px; margin-top: 6px; }
  `;
}

function catLabel(cat: string): string {
  const m: Record<string, string> = {
    battery: 'Battery', inverterCharger: 'Inverter/Charger', inverter: 'Inverter',
    mppt: 'Solar MPPT', dcdc: 'DC-DC Charger', monitor: 'Battery Monitor',
    distributor: 'Distribution', protect: 'Battery Protection', charger: 'Mains Charger',
  };
  return m[cat] ?? cat;
}

export function generateSchematicPDFHTML(
  spec: WiringSpec,
  config: SystemConfig,
  projectName: string,
  imageMap: Record<string, string> = {},
): string {
  const diagram = generateSchematicSVG(spec, config, imageMap);
  const compTotal = spec.components.reduce((s, c) => s + (c.product.estimatedPrice ?? 0), 0);
  const logoSrc = imageMap.logo || '';

  const compRows = spec.components.map(c =>
    `<tr>
      <td><strong>${c.product.name}</strong><br/><span style="font-family:monospace;font-size:8px;color:${C.grey}">${c.product.model}</span></td>
      <td>${catLabel(c.product.category)}</td>
      <td>${Object.entries(c.product.specs || {}).slice(0, 3).map(([k, v]) => `${k}: ${v}`).join('<br/>')}</td>
      <td style="font-weight:700;color:${C.accent}">£${c.product.estimatedPrice ?? '—'}</td>
    </tr>`
  ).join('');

  const connRows = spec.connections.map(c =>
    `<tr>
      <td>${c.label}</td>
      <td><strong>${c.cableGauge ?? '—'}mm²</strong></td>
      <td>${c.fuseRating ? `<strong>${c.fuseRating}A</strong> ${c.fuseType ?? ''}` : '—'}</td>
    </tr>`
  ).join('');

  const regRows = spec.regulations.map(r =>
    `<tr><td>${r.standard}</td><td>${r.clause}</td><td>${r.text}</td></tr>`
  ).join('');

  const warningItems = spec.safetyWarnings
    .filter(w => w.severity === 'danger' || w.severity === 'warning')
    .map(w => `<div class="warn">${w.severity === 'danger' ? '⚠' : '⚡'} ${w.text}</div>`)
    .join('');

  return `<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Wiring Schematic — ${projectName}</title>
<style>${pageCSS()}</style>
</head><body>

<!-- PAGE 1: Full Schematic Diagram (Landscape — maximised, SVG has its own header) -->
<div class="schematic-page">
  <div class="diagram-full">${diagram}</div>
</div>

<!-- PAGE 2: System Overview + Components -->
<div class="page">
  <div class="page-inner">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
      <div style="font-size:9px;font-weight:800;color:${C.accent}">CamperPlan by Crafted — ${projectName}</div>
      <div style="font-size:8px;color:${C.grey}">Page 2 — Components</div>
    </div>

    <h2>System Overview</h2>
    <div class="spec-grid">
      <div class="spec-card"><div class="lbl">Battery Bank</div><div class="val">${config.batteryAh}<span style="font-size:11px">Ah</span></div></div>
      <div class="spec-card"><div class="lbl">Solar Array</div><div class="val">${config.solarWatts}<span style="font-size:11px">W</span></div></div>
      <div class="spec-card"><div class="lbl">Inverter / Charger</div><div class="val">${config.inverterVA}<span style="font-size:11px">VA</span></div></div>
      <div class="spec-card"><div class="lbl">DC-DC Charger</div><div class="val">${config.dcDcAmps}<span style="font-size:11px">A</span></div></div>
      <div class="spec-card"><div class="lbl">Shore Power</div><div class="val" style="font-size:13px">${config.hasShore ? '✓ Yes' : '✗ No'}</div></div>
      <div class="spec-card"><div class="lbl">Cable Run Length</div><div class="val" style="font-size:13px;text-transform:capitalize">${config.cableRunLength}</div></div>
    </div>

    <h2>Selected Components (${spec.components.length} items)</h2>
    <table>
      <thead><tr><th>Product</th><th>Category</th><th>Key Specs</th><th>Price</th></tr></thead>
      <tbody>${compRows}</tbody>
      <tr class="total-row">
        <td colspan="3" style="text-align:right;padding:8px 8px">ESTIMATED COMPONENT TOTAL (INC. VAT)</td>
        <td>£${compTotal.toLocaleString()}</td>
      </tr>
    </table>

    <div class="discount">
      <strong>Bespoke install package (£75):</strong> This package includes your tailored wiring schematic plus step-by-step installation guidance for your exact build profile.<br/>
      Support: <strong>dan@craftedcamper.co</strong> · <strong>craftedcamper.co</strong>
    </div>
  </div>
  ${COMPANY_FOOTER}
</div>

<!-- PAGE 3: Cable Runs + Regulations -->
<div class="page">
  <div class="page-inner">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
      <div style="font-size:9px;font-weight:800;color:${C.accent}">CamperPlan by Crafted — ${projectName}</div>
      <div style="font-size:8px;color:${C.grey}">Page 3 — Cables &amp; Regulations</div>
    </div>

    <h2>Cable Connections (${spec.connections.length} runs)</h2>
    <table>
      <thead><tr><th>Connection</th><th>Cable Size</th><th>Fuse / Breaker</th></tr></thead>
      <tbody>${connRows}</tbody>
    </table>

    ${regRows ? `<h2>Applicable Regulations</h2>
    <table>
      <thead><tr><th>Standard</th><th>Clause</th><th>Requirement</th></tr></thead>
      <tbody>${regRows}</tbody>
    </table>` : ''}

    <h2>Earthing &amp; Bonding</h2>
    <table>
      <thead><tr><th>Requirement</th><th>Specification</th></tr></thead>
      <tbody>
        <tr><td>Chassis Ground Bond</td><td>≥${spec.earthingSpec?.chassisGroundCable ?? 35}mm² from negative busbar to vehicle chassis</td></tr>
        <tr><td>Exposed Metal Parts</td><td>All exposed metal parts must be bonded to vehicle chassis</td></tr>
        <tr><td>Earth Continuity</td><td>Earth continuity conductor to be included in all AC cable runs</td></tr>
        <tr><td>Reference Standard</td><td>BS 7671:2018+A2:2022 Section 411 — Protective Earthing</td></tr>
      </tbody>
    </table>
  </div>
  ${COMPANY_FOOTER}
</div>

<!-- PAGE 4: Safety, Warnings & Legal -->
<div class="page">
  <div class="page-inner">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
      <div style="font-size:9px;font-weight:800;color:${C.accent}">CamperPlan by Crafted — ${projectName}</div>
      <div style="font-size:8px;color:${C.grey}">Page 4 — Safety &amp; Legal</div>
    </div>

    <h2>Safety Requirements</h2>
    ${warningItems || `
    <div class="warn">⚠ All DC wiring must use Tri-Rated cable to BS 6231. All AC wiring must use H07RN-F flexible cable to BS EN 50525.</div>
    <div class="warn">⚠ A main fuse or circuit breaker must be fitted within 300mm of the battery positive terminal.</div>
    `}
    <div class="warn">⚠ All electrical installations must be inspected, tested, and certified by a qualified/competent electrician before first use.</div>
    <div class="warn">⚠ An Electrical Installation Certificate (EIC) must be issued and retained.</div>
    <div class="warn">⚠ 230V shore power circuits must be protected by a 30mA Type A RCD.</div>
    <div class="warn">⚠ Battery terminals and exposed conductors must be insulated with appropriate terminal covers.</div>

    <div class="safety">⚠ 230V IS EXTREMELY HAZARDOUS — ALL INSTALLATION MUST BE CARRIED OUT BY A QUALIFIED/COMPETENT PERSON — EIC REQUIRED BEFORE FIRST USE ⚠</div>

    <h2>Regulatory Compliance</h2>
    <p style="font-size:9px;line-height:1.6;margin-bottom:12px">
      This schematic has been designed with reference to the following standards. It is the responsibility
      of the installing electrician to verify compliance with all applicable current regulations:
    </p>
    <table>
      <thead><tr><th>Standard</th><th>Description</th></tr></thead>
      <tbody>
        <tr><td>BS 7671:2018+A2:2022</td><td>IET Wiring Regulations (18th Edition) — Requirements for Electrical Installations</td></tr>
        <tr><td>BS EN 1648-1:2004+A1</td><td>Leisure accommodation vehicles — 12V DC extra-low voltage electrical installations</td></tr>
        <tr><td>BS EN 1648-2:2004+A1</td><td>Leisure accommodation vehicles — 230V AC electrical installations</td></tr>
        <tr><td>BS 6231</td><td>Electric cables — Single core PVC insulated flexible cables (Tri-Rated)</td></tr>
        <tr><td>BS EN 50525</td><td>Electric cables — Low voltage energy cables (H07RN-F)</td></tr>
        <tr><td>IEC 62619</td><td>Secondary lithium cells — Safety requirements for industrial applications</td></tr>
      </tbody>
    </table>

    <h2>Terms &amp; Disclaimer</h2>
    <div style="font-size:8px;line-height:1.5;color:#666;border:1px solid #E0DCDA;border-radius:6px;padding:12px;margin-top:8px">
      <p style="margin-bottom:6px">
        <strong>Planning Aid Only:</strong> This wiring schematic and specification sheet is provided as a planning aid and
        informational resource only. It does not constitute professional electrical engineering advice, nor does it replace
        the need for a qualified electrician to design, install, inspect, and certify the electrical system.
      </p>
      <p style="margin-bottom:6px">
        <strong>No Liability:</strong> Crafted Camper Co (Yorkshire) LTD and the CamperPlan
        application accept no responsibility or liability for any damage, injury, loss, or consequence (direct or indirect)
        arising from the use of this document, the installation of any electrical system based on its contents, or any
        reliance placed upon the information provided herein.
      </p>
      <p style="margin-bottom:6px">
        <strong>Installer Responsibility:</strong> It is the sole responsibility of the person or organisation carrying out
        the electrical installation to verify all cable sizes, fuse ratings, component compatibility, and regulatory compliance.
        All installations must meet or exceed the requirements of BS 7671:2018+A2:2022 and all other applicable standards.
      </p>
      <p style="margin-bottom:6px">
        <strong>Component Specifications:</strong> Product specifications and estimated prices are sourced from manufacturer
        published data and are subject to change. Actual specifications should be verified with the manufacturer prior to purchase.
      </p>
      <p>
        <strong>Certification:</strong> An Electrical Installation Certificate (EIC) must be obtained from a qualified electrician
        prior to first use of any installed system. Failure to do so may invalidate insurance and pose a serious risk to life.
      </p>
    </div>
  </div>
  ${COMPANY_FOOTER}
</div>

</body></html>`;
}
