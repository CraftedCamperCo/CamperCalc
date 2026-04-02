/**
 * Compatibility map between existing in-app IDs and supplier/export SKUs.
 * This preserves recommendation + cart flows while enabling catalog expansion.
 */
export const LEGACY_ID_TO_SUPPLIER_SKU: Record<string, string> = {
  eco_100: '119518',
  eco_314: '119519',
  eco_460: '119962',
  eco_628: '119770',
  fogstar_105: '118341',
  fogstar_230: '120319',
  fogstar_280: '119705',
  fogstar_300: '120320',
  fogstar_460: '120321',
  fogstar_608: '120322',
};

export const RECOMMENDATION_CRITICAL_LEGACY_IDS = [
  'eco_100',
  'eco_314',
  'eco_460',
  'eco_628',
  'fogstar_105',
  'fogstar_230',
  'fogstar_280',
  'fogstar_300',
  'fogstar_460',
  'fogstar_608',
  'mp_800',
  'mp_1600',
  'mp_2000',
  'mp_3000',
  'bluesolar_75_15',
  'bluesolar_100_20',
  'bluesolar_100_30',
  'bluesolar_150_35',
  'mppt_75_15',
  'mppt_100_20',
  'mppt_100_30',
  'mppt_150_35',
  'orion_18_budget',
  'orion_18',
  'orion_30',
  'orion_50',
  'smartshunt_500',
  'bp_65',
  'lynx_dist',
  'fuse_block_12way',
] as const;
