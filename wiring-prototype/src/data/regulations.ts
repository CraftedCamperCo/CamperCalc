import type { RegulationNote, SafetyWarning } from '../types';

export const REGULATIONS: RegulationNote[] = [
  {
    id: 'reg_fuse_1m',
    standard: 'BS 7671',
    clause: 'A721.533.1',
    text: 'The overcurrent protective device for the power supply must be fitted as close as practicable to the auxiliary battery, and in no case more than 1 metre away.',
    appliesTo: ['battery', 'fuseHolder', 'lynx_dist'],
  },
  {
    id: 'reg_bat_insulated',
    standard: 'BS 7671',
    clause: 'A721.55.3.3 & BS EN 1648-2:2018 4.3.3',
    text: 'Auxiliary battery terminals must be insulated unless the battery is provided with an insulating device.',
    appliesTo: ['battery'],
  },
  {
    id: 'reg_bat_compartment',
    standard: 'BS 7671',
    clause: 'A721.55.3.4',
    text: 'An auxiliary battery must be placed in a separate compartment with easy access for maintenance or removal, and secured to prevent movement when the motorcaravan is in motion.',
    appliesTo: ['battery'],
  },
  {
    id: 'reg_bat_compartment_sealed',
    standard: 'BS EN 1648-2:2018',
    clause: '4.3.6.3',
    text: 'The interior of an auxiliary battery compartment must have gas-tight joints, be sealed to prevent ingress into the habitable compartment, and be of an electrolyte-resistant material or have an anti-corrosive finish. If the compartment opens into the interior, the lid must be sealed.',
    appliesTo: ['battery'],
  },
  {
    id: 'reg_cable_sheathing',
    standard: 'BS 7671',
    clause: 'A721.55.3.6 & BS EN 1648-2:2018 5.2.6',
    text: 'Cables from an auxiliary battery must be protected by additional sheathing or taping from the battery terminal up to the overcurrent protective device.',
    appliesTo: ['battery', 'cable'],
  },
  {
    id: 'reg_vibration_protection',
    standard: 'BS 7671',
    clause: '721.522.7.1',
    text: 'All wiring must be protected against mechanical damage due to vibration, either by location or by enhanced mechanical protection. Wiring passing through metalwork must be protected by suitable bushes or grommets. Take precautions to avoid damage from sharp edges or abrasive parts.',
    appliesTo: ['cable'],
  },
  {
    id: 'reg_cable_separation',
    standard: 'BS 7671',
    clause: '721.528.1 & BS EN 1648-2:2018 4.5',
    text: 'Cables of low voltage (230V AC) systems must be run separately from the cables of extra-low voltage (12V DC) systems, so far as is reasonably practicable, so that there is no risk of physical contact between the two wiring systems.',
    appliesTo: ['ac_cable'],
  },
  {
    id: 'reg_rcd_protection',
    standard: 'BS 7671',
    clause: '721.415.1 & 721.43.1',
    text: 'All AC final circuits must be protected by a Type A 30mA RCD (residual current device) and appropriately rated DP Type B MCBs.',
    appliesTo: ['consumerUnit', 'ac'],
  },
  {
    id: 'reg_ip_rating',
    standard: 'BS 7671',
    clause: '416.2.2',
    text: 'Live parts must not be visible or accessible. Each cable must enter an enclosure via its own gland to achieve the necessary IP ratings, preventing access to live parts and protecting from dust and water ingress.',
    appliesTo: ['consumerUnit', 'enclosure'],
  },
  {
    id: 'reg_cu_noncombustible',
    standard: 'BS 7671',
    clause: '421.1.201',
    text: 'Consumer units and similar switchgear assemblies must have their enclosure manufactured from non-combustible material (metal consumer units are recommended).',
    appliesTo: ['consumerUnit'],
  },
  {
    id: 'reg_cable_support',
    standard: 'BS EN 1648-1:2018',
    clause: '5.3.4',
    text: 'Cables must be supported at maximum intervals of 400mm for vertical runs. Horizontal runs, unless run in conduits or ducts, must be secured at maximum intervals of 250mm.',
    appliesTo: ['cable'],
  },
  {
    id: 'reg_disconnect_appliances',
    standard: 'BS EN 1648-2:2018',
    clause: '4.3.7 & BS 7671 A721.55.3.7',
    text: 'Switch off all appliances and lamps before disconnecting the auxiliary battery.',
    appliesTo: ['battery', 'isolator'],
  },
  {
    id: 'reg_appliance_installation',
    standard: 'BS 7671',
    clause: 'A721.55.7.2 & BS EN 1648-2:2018 7.2',
    text: 'All 12V ELV appliances must be fitted and connected in accordance with the appliance manufacturer\'s instructions.',
    appliesTo: ['dcLoads'],
  },
  {
    id: 'reg_dc_fusing',
    standard: 'BS 7671',
    clause: 'A721.533.1.6',
    text: 'Each DC circuit must be individually fused to protect against overcurrent.',
    appliesTo: ['fuseHolder', 'fuse'],
  },
  {
    id: 'reg_pv_disconnect',
    standard: 'BS EN 1648-1:2018',
    clause: '4.4.2',
    text: 'A PV array switch-disconnector must be fitted between the solar panels and the charge controller.',
    appliesTo: ['solar', 'pv_disconnect'],
  },
  {
    id: 'reg_pdu_label',
    standard: 'BS 7671',
    clause: '721.514.1',
    text: 'A Particulars of Distribution Unit (PDU) sticker must be affixed as close as possible to the consumer unit.',
    appliesTo: ['consumerUnit'],
  },
  {
    id: 'reg_mounting',
    standard: 'Victron Energy',
    clause: 'Installation Manual',
    text: 'Mount all components vertically on a non-flammable surface (e.g. aluminium sheet) with power terminals facing downwards. Observe a minimum clearance of 10cm above and below each product for optimal cooling.',
    appliesTo: ['inverterCharger', 'mppt', 'dcdc', 'charger'],
  },
  {
    id: 'reg_eic',
    standard: 'BS 7671',
    clause: 'General',
    text: 'The electrical system must have an Electrical Installation Certificate (EIC) issued by a qualified electrician prior to first use.',
    appliesTo: ['system'],
  },
  {
    id: 'reg_pe_bonding',
    standard: 'BS 7671',
    clause: '411.3.1.2',
    text: 'Main protective bonding conductors must connect to the main earthing terminal extraneous-conductive-parts, including metallic gas installation pipes and structural metallic parts of the motorcaravan.',
    appliesTo: ['earthing'],
  },
];

export const SAFETY_WARNINGS: SafetyWarning[] = [
  {
    id: 'warn_230v',
    text: '230V IS EXTREMELY HAZARDOUS. Do not touch any live wired parts of the installation. When in doubt, always consult a qualified electrician.',
    severity: 'danger',
  },
  {
    id: 'warn_qualified',
    text: 'This installation must be completed by a skilled, competent and qualified fitter in accordance with manufacturer specifications, BS 7671, BS EN 1648-2 and on-site conditions.',
    severity: 'danger',
  },
  {
    id: 'warn_responsibility',
    text: 'All cable and fuse sizes are based on manufacturer-stated recommendations. Torque values are as mentioned in their manuals. Every realisation remains the responsibility of the fitter.',
    severity: 'warning',
  },
  {
    id: 'warn_earthing',
    text: 'Grounding requirements vary according to your region. An earth connection must be made to all metal enclosures as shown in this diagram.',
    severity: 'warning',
  },
  {
    id: 'warn_battery_short',
    text: 'Battery terminals can produce extremely high short-circuit currents. Always use insulated tools and do not wear metallic jewellery when working near batteries.',
    severity: 'danger',
  },
  {
    id: 'warn_isolate_first',
    text: 'Always ensure battery isolator, solar disconnect, shore power and engine are isolated (turned off) before disconnecting the battery or working on any circuits.',
    severity: 'danger',
  },
];

export function getRegulationsForComponent(componentType: string): RegulationNote[] {
  return REGULATIONS.filter(r => r.appliesTo.includes(componentType));
}
