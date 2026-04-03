/**
 * Generates an HTML page wrapping the full wiring schematic SVG for display
 * in a WebView. Supports native pinch-to-zoom and drag-to-pan in all directions.
 */
import type { WiringSpec, SystemConfig } from './wiringTypes';
import { generateSchematicSVG } from './schematicSVG';

export function generateSchematicWebviewHTML(
  spec: WiringSpec,
  config: SystemConfig,
  imageMap: Record<string, string>,
): string {
  const { page1, page2 } = generateSchematicSVG(spec, config, imageMap);

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=0.5, minimum-scale=0.15, maximum-scale=5.0, user-scalable=yes">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 100%; height: 100%; overflow: auto; background: #F8F9FA; -webkit-overflow-scrolling: touch; }
  .wrap { min-height: 100%; }
  svg { display: block; width: 100%; height: auto; }
  [data-action="buy"] { cursor: pointer; }
</style>
</head>
<body>
<div class="wrap">
${page1}
</div>
<script>
window.__REFERENCE_SHEET_SVG__ = ${JSON.stringify(page2)};
document.addEventListener('click', function(e) {
  var el = e.target.closest('[data-action="buy"]');
  if (el) {
    var productId = el.getAttribute('data-product-id');
    if (productId && window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ action: 'buy', productId: productId }));
    }
  }
});
</script>
</body>
</html>`;
}
