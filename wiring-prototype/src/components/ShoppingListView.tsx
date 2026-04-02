import { useState } from 'react';
import type { WiringSpec } from '../types';

interface Props {
  spec: WiringSpec;
}

const CATEGORY_ORDER = [
  'Core Components',
  'Cable',
  'Terminal Lugs',
  'Fuses & Protection',
  'Isolators & Switches',
  'Enclosures & Distribution',
  'Earthing & Bonding',
  'Consumables',
  'Tools Required',
];

function ProductThumbnail({ imageUrl, name }: { imageUrl: string; name: string }) {
  const [showPopup, setShowPopup] = useState(false);

  return (
    <span
      className="relative inline-block"
      onMouseEnter={() => setShowPopup(true)}
      onMouseLeave={() => setShowPopup(false)}
    >
      <img
        src={imageUrl}
        alt={name}
        style={{ width: 40, height: 40, objectFit: 'contain', borderRadius: 4, background: '#f5f5f5' }}
      />
      {showPopup && (
        <span
          style={{
            position: 'absolute',
            left: 48,
            top: -40,
            zIndex: 50,
            background: '#fff',
            border: '2px solid #D9A05B',
            borderRadius: 8,
            padding: 8,
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          }}
        >
          <img
            src={imageUrl}
            alt={name}
            style={{ width: 180, height: 180, objectFit: 'contain' }}
          />
          <span
            style={{
              display: 'block',
              textAlign: 'center',
              fontSize: 11,
              color: '#333',
              marginTop: 4,
              fontWeight: 600,
            }}
          >
            {name}
          </span>
        </span>
      )}
    </span>
  );
}

export function ShoppingListView({ spec }: Props) {
  const grouped = new Map<string, typeof spec.shoppingList>();
  for (const item of spec.shoppingList) {
    const list = grouped.get(item.category) ?? [];
    list.push(item);
    grouped.set(item.category, list);
  }

  const totalCost = spec.shoppingList.reduce((sum, item) => sum + item.estimatedPrice, 0);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: '#1A1A1A' }}>Shopping List</h2>
          <p className="text-sm" style={{ color: '#888' }}>
            Complete bill of materials for your {spec.archetype.replace(/_/g, ' ').toLowerCase()} system
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm" style={{ color: '#888' }}>Estimated Total</div>
          <div className="text-3xl font-bold" style={{ color: '#D9A05B' }}>£{totalCost.toFixed(2)}</div>
        </div>
      </div>

      {CATEGORY_ORDER.map(category => {
        const items = grouped.get(category);
        if (!items || items.length === 0) return null;

        const categoryTotal = items.reduce((sum, item) => sum + item.estimatedPrice, 0);

        return (
          <div key={category} className="mb-6">
            <div className="flex items-center justify-between py-2 px-4 rounded-t-lg" style={{ background: '#1A1A1A' }}>
              <h3 className="text-sm font-bold text-white">{category}</h3>
              <span className="text-sm" style={{ color: '#D9A05B' }}>£{categoryTotal.toFixed(2)}</span>
            </div>
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs" style={{ color: '#888' }}>
                  <th className="py-2 px-2 font-medium w-12"></th>
                  <th className="py-2 px-4 font-medium">Item</th>
                  <th className="py-2 px-4 font-medium">Description</th>
                  <th className="py-2 px-4 font-medium text-center">Qty</th>
                  <th className="py-2 px-4 font-medium text-right">Est. Price</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i} className="border-b" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
                    <td className="py-2 px-2 text-center">
                      {item.imageUrl ? (
                        <ProductThumbnail imageUrl={item.imageUrl} name={item.name} />
                      ) : (
                        <span
                          style={{
                            display: 'inline-block',
                            width: 40,
                            height: 40,
                            borderRadius: 4,
                            background: '#f0f0f0',
                            lineHeight: '40px',
                            textAlign: 'center',
                            fontSize: 16,
                            color: '#bbb',
                          }}
                        >
                          ●
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-4 text-sm font-medium" style={{ color: '#333' }}>
                      {item.productUrl ? (
                        <a href={item.productUrl} target="_blank" rel="noreferrer" className="underline" style={{ color: '#2E4C3D' }}>
                          {item.name}
                        </a>
                      ) : item.name}
                    </td>
                    <td className="py-2 px-4 text-xs" style={{ color: '#666' }}>{item.description}</td>
                    <td className="py-2 px-4 text-sm text-center" style={{ color: '#333' }}>
                      {item.quantity} {item.unit}
                    </td>
                    <td className="py-2 px-4 text-sm text-right font-medium" style={{ color: '#D9A05B' }}>
                      £{item.estimatedPrice.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
