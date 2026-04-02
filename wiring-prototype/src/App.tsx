import { useState, useMemo, useRef, Component } from 'react';
import type { ReactNode } from 'react';
import type { SystemConfig } from './types';
import { generateWiringSpec } from './engine/wiringRules';
import { ConfigPanel } from './components/ConfigPanel';
import { SchematicRenderer } from './components/SchematicRenderer';
import { ShoppingListView } from './components/ShoppingListView';
import { InstallGuideView } from './components/InstallGuideView';
import './index.css';

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 40, color: '#C0392B', fontFamily: 'monospace' }}>
          <h1>Runtime Error</h1>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{this.state.error.message}</pre>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12, color: '#666' }}>{this.state.error.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

type TabId = 'schematic' | 'shopping' | 'guide';

const DEFAULT_CONFIG: SystemConfig = {
  batteryAh: 280,
  inverterVA: 2000,
  solarWatts: 400,
  dcDcAmps: 30,
  hasShore: true,
  cableRunLength: 'short',
  useLynx: true,
};

function AppInner() {
  const [config, setConfig] = useState<SystemConfig>(DEFAULT_CONFIG);
  const [activeTab, setActiveTab] = useState<TabId>('schematic');
  const svgRef = useRef<HTMLDivElement>(null);

  const spec = useMemo(() => generateWiringSpec(config), [config]);

  const tabs: { id: TabId; label: string }[] = [
    { id: 'schematic', label: 'Wiring Schematic' },
    { id: 'shopping', label: 'Shopping List' },
    { id: 'guide', label: 'Installation Guide' },
  ];

  const handleExportSVG = () => {
    const svgEl = document.getElementById('schematic-svg');
    if (!svgEl) return;
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svgEl);
    const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crafted-camper-schematic-${spec.archetype.toLowerCase()}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPNG = () => {
    const svgEl = document.getElementById('schematic-svg');
    if (!svgEl) return;
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svgEl);
    const canvas = document.createElement('canvas');
    const scale = 3;
    canvas.width = 1200 * scale;
    canvas.height = (config.hasShore ? 950 : 750) * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const img = new Image();
    const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    img.onload = () => {
      ctx.fillStyle = '#F8F9FA';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob(blob => {
        if (!blob) return;
        const pngUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = pngUrl;
        a.download = `crafted-camper-schematic-${spec.archetype.toLowerCase()}.png`;
        a.click();
        URL.revokeObjectURL(pngUrl);
      }, 'image/png');
    };
    img.src = url;
  };

  const handlePrintList = () => {
    const printContent = document.getElementById('shopping-list-container');
    if (!printContent) return;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`
      <html><head><title>Shopping List - Crafted Camper Co.</title>
      <style>body{font-family:system-ui,sans-serif;padding:20px;color:#333}
      table{width:100%;border-collapse:collapse}th,td{padding:6px 8px;text-align:left;border-bottom:1px solid #eee}
      th{font-size:11px;color:#888}h2,h3{margin:0}.cat-header{background:#1a1a1a;color:#fff;padding:8px 12px;border-radius:4px}
      </style></head><body>${printContent.innerHTML}</body></html>
    `);
    w.document.close();
    w.print();
  };

  return (
    <div className="min-h-screen" style={{ background: '#F2EDE4' }}>
      {/* Header */}
      <header className="py-4 px-6" style={{ background: '#1A1A1A' }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#D9A05B' }}>CRAFTED CAMPER CO.</h1>
            <p className="text-xs" style={{ color: '#888' }}>Automated Wiring Planner — Prototype</p>
          </div>
          <div className="text-right">
            <div className="text-xs" style={{ color: '#888' }}>System Type</div>
            <div className="text-sm font-bold" style={{ color: '#D9A05B' }}>
              {spec.archetype.replace(/_/g, ' ')}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Config Panel */}
        <ConfigPanel config={config} onChange={setConfig} />

        {/* Tabs */}
        <div className="flex gap-2 mt-6 mb-4">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="px-5 py-2.5 rounded-lg text-sm font-medium transition-all"
              style={{
                background: activeTab === tab.id ? '#D9A05B' : '#fff',
                color: activeTab === tab.id ? '#1A1A1A' : '#888',
                border: `1px solid ${activeTab === tab.id ? '#D9A05B' : '#ddd'}`,
                boxShadow: activeTab === tab.id ? '0 2px 8px rgba(217,160,91,0.3)' : 'none',
              }}
            >
              {tab.label}
            </button>
          ))}

          <div className="flex-1" />

          {activeTab === 'schematic' && (
            <div className="flex gap-2">
              <button
                onClick={handleExportSVG}
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{ background: '#2E4C3D', color: '#fff' }}
              >
                Export SVG
              </button>
              <button
                onClick={handleExportPNG}
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{ background: '#1A1A1A', color: '#D9A05B', border: '1px solid #D9A05B' }}
              >
                Export PNG
              </button>
            </div>
          )}
          {activeTab === 'shopping' && (
            <button
              onClick={handlePrintList}
              className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{ background: '#2E4C3D', color: '#fff' }}
            >
              Print List
            </button>
          )}
        </div>

        {/* Content */}
        <div className="rounded-xl overflow-hidden" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
          {activeTab === 'schematic' && (
            <div ref={svgRef} className="p-4" style={{ background: '#F8F9FA' }}>
              <SchematicRenderer spec={spec} config={config} />
            </div>
          )}

          {activeTab === 'shopping' && (
            <div id="shopping-list-container" className="p-6">
              <ShoppingListView spec={spec} />
            </div>
          )}

          {activeTab === 'guide' && (
            <div className="p-6">
              <InstallGuideView spec={spec} />
            </div>
          )}
        </div>

        {/* Footer stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
          {[
            { label: 'Components', value: spec.components.length },
            { label: 'Wire Connections', value: spec.connections.length },
            { label: 'Shopping Items', value: spec.shoppingList.length },
            { label: 'Install Steps', value: spec.installationSteps.length },
            { label: 'Est. Total Cost', value: `£${spec.shoppingList.reduce((s, i) => s + i.estimatedPrice, 0).toFixed(0)}` },
          ].map(stat => (
            <div key={stat.label} className="rounded-lg p-3 text-center" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.06)' }}>
              <div className="text-xs" style={{ color: '#888' }}>{stat.label}</div>
              <div className="text-lg font-bold" style={{ color: '#1A1A1A' }}>{stat.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppInner />
    </ErrorBoundary>
  );
}
