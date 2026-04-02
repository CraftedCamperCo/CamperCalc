/**
 * Curated Egger laminate decor catalogue for furniture kit configurator.
 * Hex values approximate the real decor colour for use in 3D viewer materials.
 * Swatch URLs reference Egger's public product pages.
 */

export interface EggerDecor {
  code: string;
  name: string;
  hexColor: string;
  category: 'woodgrain' | 'solid' | 'material';
  productUrl: string;
}

export const EGGER_DECORS: EggerDecor[] = [
  // ── Woodgrain — Oaks ──
  { code: 'H1180_ST37', name: 'Natural Halifax Oak', hexColor: '#C4A882', category: 'woodgrain', productUrl: 'https://www.egger.com/en/furniture-interior-design/decors/H1180_37' },
  { code: 'H1181_ST37', name: 'Tobacco Halifax Oak', hexColor: '#8B6B4A', category: 'woodgrain', productUrl: 'https://www.egger.com/en/furniture-interior-design/decors/H1181_37' },
  { code: 'H1176_ST37', name: 'White Halifax Oak', hexColor: '#D9CCBA', category: 'woodgrain', productUrl: 'https://www.egger.com/en/furniture-interior-design/decors/H1176_37' },
  { code: 'H3303_ST10', name: 'Natural Hamilton Oak', hexColor: '#B89B6F', category: 'woodgrain', productUrl: 'https://www.egger.com/en/furniture-interior-design/decors/H3303_10' },
  { code: 'H3157_ST12', name: 'Vicenza Oak', hexColor: '#A68B6B', category: 'woodgrain', productUrl: 'https://www.egger.com/en/furniture-interior-design/decors/H3157_12' },
  { code: 'H3158_ST19', name: 'Grey Vicenza Oak', hexColor: '#9E9588', category: 'woodgrain', productUrl: 'https://www.egger.com/en/furniture-interior-design/decors/H3158_19' },
  { code: 'H3171_ST12', name: 'Oiled Kendal Oak', hexColor: '#8A7352', category: 'woodgrain', productUrl: 'https://www.egger.com/en/furniture-interior-design/decors/H3171_12' },
  { code: 'H1385_ST40', name: 'Natural Casella Oak', hexColor: '#BFA57A', category: 'woodgrain', productUrl: 'https://www.egger.com/en/furniture-interior-design/decors/H1385_40' },

  // ── Woodgrain — Walnut ──
  { code: 'H3710_ST12', name: 'Natural Carini Walnut', hexColor: '#7A5E3E', category: 'woodgrain', productUrl: 'https://www.egger.com/en/furniture-interior-design/decors/H3710_12' },
  { code: 'H3790_ST12', name: 'Honey Carini Walnut', hexColor: '#9B7A4F', category: 'woodgrain', productUrl: 'https://www.egger.com/en/furniture-interior-design/decors/H3790_12' },
  { code: 'H3794_ST12', name: 'Chocolate Carini Walnut', hexColor: '#5A3E2A', category: 'woodgrain', productUrl: 'https://www.egger.com/en/furniture-interior-design/decors/H3794_12' },

  // ── Woodgrain — Other ──
  { code: 'H1816_ST7', name: 'Natural Maple', hexColor: '#D4BC93', category: 'woodgrain', productUrl: 'https://www.egger.com/en/furniture-interior-design/decors/H1816_7' },
  { code: 'H8911_ST10', name: 'Multiplex Oak', hexColor: '#C2A67A', category: 'woodgrain', productUrl: 'https://www.egger.com/en/furniture-interior-design/decors/H8911_10' },
  { code: 'H1225_ST12', name: 'Trondheim Ash', hexColor: '#CABFA8', category: 'woodgrain', productUrl: 'https://www.egger.com/en/furniture-interior-design/decors/H1225_12' },

  // ── Solid colours ──
  { code: 'W1100_ST9', name: 'Alpine White', hexColor: '#F0EDE6', category: 'solid', productUrl: 'https://www.egger.com/en/furniture-interior-design/decors/W1100_9' },
  { code: 'U702_ST9', name: 'Cashmere Grey', hexColor: '#C7BFB2', category: 'solid', productUrl: 'https://www.egger.com/en/furniture-interior-design/decors/U702_9' },
  { code: 'U727_ST9', name: 'Stone Grey', hexColor: '#9B9690', category: 'solid', productUrl: 'https://www.egger.com/en/furniture-interior-design/decors/U727_9' },
  { code: 'U961_ST7', name: 'Graphite Grey', hexColor: '#5A5A5E', category: 'solid', productUrl: 'https://www.egger.com/en/furniture-interior-design/decors/U961_7' },
  { code: 'U999_ST19', name: 'Black', hexColor: '#1A1A1A', category: 'solid', productUrl: 'https://www.egger.com/en/furniture-interior-design/decors/U999_19' },
  { code: 'U604_ST9', name: 'Reed Green', hexColor: '#6B7E5C', category: 'solid', productUrl: 'https://www.egger.com/en/furniture-interior-design/decors/U604_9' },
  { code: 'U599_ST9', name: 'Indigo Blue', hexColor: '#3B4F6E', category: 'solid', productUrl: 'https://www.egger.com/en/furniture-interior-design/decors/U599_9' },
];

export const CUSTOM_DECOR_OPTION: Pick<EggerDecor, 'code' | 'name' | 'category'> = {
  code: 'CUSTOM',
  name: 'Request Custom Egger Decor',
  category: 'solid',
};
