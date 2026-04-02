import type { SystemConfig, CableRunLength } from '../types';

interface Props {
  config: SystemConfig;
  onChange: (config: SystemConfig) => void;
}

export function ConfigPanel({ config, onChange }: Props) {
  const set = <K extends keyof SystemConfig>(key: K, value: SystemConfig[K]) => {
    onChange({ ...config, [key]: value });
  };

  return (
    <div className="rounded-xl p-6" style={{ background: '#1A1A1A' }}>
      <h2 className="text-lg font-bold mb-4" style={{ color: '#D9A05B' }}>System Configuration</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        {/* Battery */}
        <div>
          <label className="block text-xs font-medium mb-1 text-gray-400">Battery Capacity</label>
          <select
            value={config.batteryAh}
            onChange={e => set('batteryAh', Number(e.target.value))}
            className="w-full rounded-lg px-3 py-2 text-sm"
            style={{ background: '#2C2C2E', color: '#fff', border: '1px solid #444' }}
          >
            <option value={100}>100 Ah</option>
            <option value={200}>200 Ah</option>
            <option value={280}>280 Ah</option>
            <option value={330}>330 Ah</option>
          </select>
        </div>

        {/* Inverter */}
        <div>
          <label className="block text-xs font-medium mb-1 text-gray-400">Inverter Size</label>
          <select
            value={config.inverterVA}
            onChange={e => set('inverterVA', Number(e.target.value) as SystemConfig['inverterVA'])}
            className="w-full rounded-lg px-3 py-2 text-sm"
            style={{ background: '#2C2C2E', color: '#fff', border: '1px solid #444' }}
          >
            <option value={0}>No Inverter</option>
            <option value={800}>800 VA</option>
            <option value={1600}>1600 VA</option>
            <option value={2000}>2000 VA</option>
            <option value={3000}>3000 VA</option>
          </select>
        </div>

        {/* Solar */}
        <div>
          <label className="block text-xs font-medium mb-1 text-gray-400">Solar Panels</label>
          <select
            value={config.solarWatts}
            onChange={e => set('solarWatts', Number(e.target.value) as SystemConfig['solarWatts'])}
            className="w-full rounded-lg px-3 py-2 text-sm"
            style={{ background: '#2C2C2E', color: '#fff', border: '1px solid #444' }}
          >
            <option value={0}>No Solar</option>
            <option value={200}>200W (1 panel)</option>
            <option value={400}>400W (2 panels)</option>
            <option value={600}>600W (3 panels)</option>
          </select>
        </div>

        {/* DC-DC */}
        <div>
          <label className="block text-xs font-medium mb-1 text-gray-400">DC-DC Charger</label>
          <select
            value={config.dcDcAmps}
            onChange={e => set('dcDcAmps', Number(e.target.value) as SystemConfig['dcDcAmps'])}
            className="w-full rounded-lg px-3 py-2 text-sm"
            style={{ background: '#2C2C2E', color: '#fff', border: '1px solid #444' }}
          >
            <option value={0}>No DC-DC</option>
            <option value={18}>Orion 18A</option>
            <option value={30}>Orion 30A</option>
            <option value={50}>Orion XS 50A</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {/* Shore Power */}
        <div>
          <label className="block text-xs font-medium mb-1 text-gray-400">Shore Power (Hookup)</label>
          <button
            onClick={() => set('hasShore', !config.hasShore)}
            className="w-full rounded-lg px-3 py-2 text-sm font-medium transition-colors"
            style={{
              background: config.hasShore ? '#2E4C3D' : '#2C2C2E',
              color: config.hasShore ? '#fff' : '#888',
              border: `1px solid ${config.hasShore ? '#2E4C3D' : '#444'}`,
            }}
          >
            {config.hasShore ? 'Enabled' : 'Disabled'}
          </button>
        </div>

        {/* Lynx Distribution */}
        <div>
          <label className="block text-xs font-medium mb-1 text-gray-400">Lynx Distributor</label>
          <button
            onClick={() => set('useLynx', !config.useLynx)}
            className="w-full rounded-lg px-3 py-2 text-sm font-medium transition-colors"
            style={{
              background: config.useLynx ? '#D9A05B' : '#2C2C2E',
              color: config.useLynx ? '#1A1A1A' : '#888',
              border: `1px solid ${config.useLynx ? '#D9A05B' : '#444'}`,
            }}
          >
            {config.useLynx ? 'Lynx System' : 'Simple Busbar'}
          </button>
        </div>

        {/* Cable Runs */}
        <div>
          <label className="block text-xs font-medium mb-1 text-gray-400">Cable Run Length</label>
          <div className="flex gap-1">
            {(['short', 'medium', 'long'] as CableRunLength[]).map(len => (
              <button
                key={len}
                onClick={() => set('cableRunLength', len)}
                className="flex-1 rounded-lg px-2 py-2 text-xs font-medium transition-colors"
                style={{
                  background: config.cableRunLength === len ? '#D9A05B' : '#2C2C2E',
                  color: config.cableRunLength === len ? '#1A1A1A' : '#888',
                  border: `1px solid ${config.cableRunLength === len ? '#D9A05B' : '#444'}`,
                }}
              >
                {len === 'short' ? '0-2m' : len === 'medium' ? '2-5m' : '5-10m'}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
