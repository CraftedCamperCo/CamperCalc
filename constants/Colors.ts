export interface ThemeColors {
  background: string;
  card: string;
  cardBorder: string;
  text: string;
  textSecondary: string;
  tint: string;
  accent: string;
  success: string;
  successBright: string;
  danger: string;
  tabIconDefault: string;
  tabIconSelected: string;
  tabBarBg: string;
  blurTint: 'dark' | 'light';
  surfaceTint: string;
  stickyHeaderBg: string;
  mountainStroke: string;
}

const accent = '#D9A05B';
const success = '#2E4C3D';

// Light — ultra-premium Apple-like off-white. Clean, airy, glass-over-canvas.
const light: ThemeColors = {
  background: '#F5F5F7',       // Apple's signature cool off-white
  card: '#FFFFFF',
  cardBorder: 'rgba(0,0,0,0.04)',
  text: '#1D1D1F',             // Apple near-black
  textSecondary: '#86868B',    // Apple mid-grey
  tint: accent,
  accent,
  success,
  successBright: '#3A7D4F',
  danger: '#D93025',
  tabIconDefault: '#ADADAD',
  tabIconSelected: accent,
  tabBarBg: 'rgba(245,245,247,0.85)',
  blurTint: 'light',
  surfaceTint: 'rgba(255,255,255,0.65)',
  stickyHeaderBg: 'rgba(245,245,247,0.92)',
  mountainStroke: 'rgba(0,0,0,0.055)',
};

// Dark — medium charcoal grey, not pure black.
const dark: ThemeColors = {
  background: '#1E1E22',
  card: '#28282E',
  cardBorder: '#35353D',
  text: '#F0EEE8',
  textSecondary: '#9A9AA0',
  tint: accent,
  accent,
  success,
  successBright: '#4CAF50',
  danger: '#FF453A',
  tabIconDefault: '#636368',
  tabIconSelected: accent,
  tabBarBg: 'rgba(28,28,34,0.88)',
  blurTint: 'dark',
  surfaceTint: 'rgba(255,255,255,0.06)',
  stickyHeaderBg: 'rgba(28,28,34,0.95)',
  mountainStroke: 'rgba(255,255,255,0.07)',
};

export default { light, dark };
