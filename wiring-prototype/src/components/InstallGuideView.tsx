import type { WiringSpec } from '../types';

interface Props {
  spec: WiringSpec;
}

export function InstallGuideView({ spec }: Props) {
  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-2" style={{ color: '#1A1A1A' }}>Installation Guide</h2>
      <p className="text-sm mb-6" style={{ color: '#888' }}>
        Step-by-step instructions for your {spec.archetype.replace(/_/g, ' ').toLowerCase()} system.
        Each step includes specific cable sizes, torque values, and applicable regulations.
      </p>

      {/* Safety banner */}
      <div className="rounded-lg p-4 mb-8" style={{ background: 'rgba(192,57,43,0.08)', border: '2px solid #C0392B' }}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">⚠</span>
          <span className="font-bold text-sm" style={{ color: '#C0392B' }}>SAFETY WARNINGS</span>
        </div>
        {spec.safetyWarnings.map(w => (
          <p key={w.id} className="text-xs mb-1" style={{ color: w.severity === 'danger' ? '#C0392B' : '#8B6914' }}>
            • {w.text}
          </p>
        ))}
      </div>

      {spec.installationSteps.map(step => (
        <div key={step.stepNumber} className="mb-6 rounded-lg overflow-hidden" style={{ border: '1px solid rgba(0,0,0,0.1)' }}>
          {/* Step header */}
          <div className="flex items-center gap-3 py-3 px-4" style={{ background: '#1A1A1A' }}>
            <span
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
              style={{ background: '#D9A05B', color: '#1A1A1A' }}
            >
              {step.stepNumber}
            </span>
            <h3 className="text-sm font-bold text-white">{step.title}</h3>
          </div>

          <div className="p-4" style={{ background: '#fff' }}>
            {/* Instructions */}
            <ul className="space-y-1.5 mb-3">
              {step.instructions.map((inst, i) => (
                <li key={i} className="text-sm flex gap-2" style={{ color: '#333' }}>
                  <span style={{ color: '#D9A05B' }}>›</span>
                  <span>{inst}</span>
                </li>
              ))}
            </ul>

            {/* Cable specs */}
            {step.cableSpecs && step.cableSpecs.length > 0 && (
              <div className="rounded p-3 mb-2" style={{ background: 'rgba(217,160,91,0.06)', border: '1px solid rgba(217,160,91,0.2)' }}>
                <div className="text-xs font-bold mb-1" style={{ color: '#D9A05B' }}>CABLE SPECIFICATIONS:</div>
                {step.cableSpecs.map((spec, i) => (
                  <div key={i} className="text-xs" style={{ color: '#555' }}>• {spec}</div>
                ))}
              </div>
            )}

            {/* Torque values */}
            {step.torqueValues && step.torqueValues.length > 0 && (
              <div className="rounded p-3 mb-2" style={{ background: 'rgba(46,76,61,0.06)', border: '1px solid rgba(46,76,61,0.2)' }}>
                <div className="text-xs font-bold mb-1" style={{ color: '#2E4C3D' }}>TORQUE VALUES:</div>
                {step.torqueValues.map((tv, i) => (
                  <div key={i} className="text-xs" style={{ color: '#555' }}>• {tv}</div>
                ))}
              </div>
            )}

            {/* Regulations */}
            {step.regulations && step.regulations.length > 0 && (
              <div className="rounded p-3 mb-2" style={{ background: 'rgba(26,26,26,0.03)', border: '1px dashed rgba(0,0,0,0.15)' }}>
                <div className="text-xs font-bold mb-1" style={{ color: '#1A1A1A' }}>APPLICABLE REGULATIONS:</div>
                {step.regulations.map((reg, i) => (
                  <div key={i} className="text-xs" style={{ color: '#555' }}>• {reg}</div>
                ))}
              </div>
            )}

            {/* Warnings */}
            {step.warnings && step.warnings.length > 0 && (
              <div className="rounded p-3" style={{ background: 'rgba(192,57,43,0.05)', border: '1px solid rgba(192,57,43,0.2)' }}>
                <div className="text-xs font-bold mb-1" style={{ color: '#C0392B' }}>⚠ WARNING:</div>
                {step.warnings.map((w, i) => (
                  <div key={i} className="text-xs" style={{ color: '#C0392B' }}>• {w}</div>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
