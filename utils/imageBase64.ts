/**
 * Loads product images as base64 data URIs so they can be embedded in
 * HTML strings (WebView interactive viewer, expo-print PDF export).
 *
 * Uses expo-asset to get local URIs and the new expo-file-system File API to read them.
 */
import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';

const ASSETS: Record<string, number> = {
  battery:    require('../assets/images/third-party/fogstar-drift-230ah.png'),
  mppt:       require('../assets/images/victron/mppt-100-30.png'),
  inverter:   require('../assets/images/victron/multiplus-2000.png'),
  dcdc:       require('../assets/images/victron/orion-tr-smart-30.png'),
  shunt:      require('../assets/images/victron/smartshunt-500a.png'),
  lynx:       require('../assets/images/victron/lynx-distributor.png'),
  bp:         require('../assets/images/victron/battery-protect-65a.png'),
  logo:       require('../assets/images/crafted-logo.png'),
};

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

let cached: Record<string, string> | null = null;

export async function loadImageBase64Map(): Promise<Record<string, string>> {
  if (cached) return cached;

  const map: Record<string, string> = {};
  const entries = Object.entries(ASSETS);

  await Promise.all(entries.map(async ([key, module]) => {
    try {
      const asset = Asset.fromModule(module);
      await asset.downloadAsync();
      if (asset.localUri) {
        const file = new File(asset.localUri);
        const ab = await file.arrayBuffer();
        const b64 = arrayBufferToBase64(ab);
        map[key] = `data:image/png;base64,${b64}`;
      }
    } catch {
      map[key] = '';
    }
  }));

  cached = map;
  return map;
}
