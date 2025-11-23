import { AbilityTemplate } from "./schema";

// ============================================================================
// ABILITY CATALOG - Seeded from PDF
// ============================================================================

export const ABILITY_CATALOG: AbilityTemplate[] = [
  // ========== DAMAGE ABILITIES ==========
  {
    id: "crushing_blow",
    displayName: "Crushing Blow",
    category: "damage",
    substitutionGroup: "basic_attack",
    defaultPressCount: 6,
    defaultPressInterval: 25,
    description: "Basic melee attack - can substitute with force scream, smash, aegis strike, vicious throw",
  },
  {
    id: "force_scream",
    displayName: "Force Scream",
    category: "damage",
    substitutionGroup: "basic_attack",
    defaultPressCount: 6,
    defaultPressInterval: 25,
  },
  {
    id: "smash",
    displayName: "Smash",
    category: "damage",
    substitutionGroup: "basic_attack",
    defaultPressCount: 6,
    defaultPressInterval: 25,
  },
  {
    id: "aegis_strike",
    displayName: "Aegis Strike",
    category: "damage",
    substitutionGroup: "basic_attack",
    defaultPressCount: 6,
    defaultPressInterval: 25,
  },
  {
    id: "vicious_throw",
    displayName: "Vicious Throw",
    category: "damage",
    substitutionGroup: "basic_attack",
    defaultPressCount: 6,
    defaultPressInterval: 25,
  },

  // ========== CROWD CONTROL ==========
  {
    id: "force_choke",
    displayName: "Force Choke",
    category: "crowd_control",
    substitutionGroup: "cc_ability",
    defaultPressCount: 4,
    defaultPressInterval: 25,
    description: "Can substitute with backhand, force push, ravage",
  },
  {
    id: "backhand",
    displayName: "Backhand",
    category: "crowd_control",
    substitutionGroup: "cc_ability",
    defaultPressCount: 4,
    defaultPressInterval: 25,
  },
  {
    id: "force_push",
    displayName: "Force Push",
    category: "crowd_control",
    substitutionGroup: "cc_ability",
    defaultPressCount: 4,
    defaultPressInterval: 25,
  },
  {
    id: "ravage",
    displayName: "Ravage",
    category: "crowd_control",
    substitutionGroup: "cc_ability",
    defaultPressCount: 4,
    defaultPressInterval: 25,
  },

  // ========== DEFENSIVE ==========
  {
    id: "aegis",
    displayName: "Aegis",
    category: "defensive",
    defaultPressCount: 1,
    defaultPressInterval: 25,
  },
  {
    id: "retaliate",
    displayName: "Retaliate",
    category: "defensive",
    defaultPressCount: 1,
    defaultPressInterval: 25,
  },
  {
    id: "saber_ward",
    displayName: "Saber Ward",
    category: "defensive",
    defaultPressCount: 1,
    defaultPressInterval: 25,
  },
  {
    id: "invincible",
    displayName: "Invincible",
    category: "defensive",
    defaultPressCount: 1,
    defaultPressInterval: 25,
  },
  {
    id: "enrage",
    displayName: "Enrage",
    category: "defensive",
    defaultPressCount: 1,
    defaultPressInterval: 25,
  },

  // ========== HEALING ==========
  {
    id: "kolto_shot",
    displayName: "Kolto Shot",
    category: "healing",
    defaultPressCount: 1,
    defaultPressInterval: 25,
  },
  {
    id: "trauma_probe",
    displayName: "Trauma Probe",
    category: "healing",
    defaultPressCount: 1,
    defaultPressInterval: 25,
  },
  {
    id: "bacta_infusion",
    displayName: "Bacta Infusion",
    category: "healing",
    defaultPressCount: 1,
    defaultPressInterval: 25,
  },
  {
    id: "supercharged_cells",
    displayName: "Supercharged Cells",
    category: "healing",
    defaultPressCount: 1,
    defaultPressInterval: 25,
  },
  {
    id: "kolto_bomb",
    displayName: "Kolto Bomb",
    category: "healing",
    defaultPressCount: 1,
    defaultPressInterval: 25,
  },
  {
    id: "medical_probe",
    displayName: "Medical Probe",
    category: "healing",
    defaultPressCount: 1,
    defaultPressInterval: 25,
  },
  {
    id: "rapid_scan",
    displayName: "Rapid Scan",
    category: "healing",
    defaultPressCount: 1,
    defaultPressInterval: 25,
  },

  // ========== UTILITY ==========
  {
    id: "leap",
    displayName: "Leap",
    category: "utility",
    defaultPressCount: 7,
    defaultPressInterval: 26, // 24-29ms range, using midpoint
  },
  {
    id: "intercede",
    displayName: "Intercede",
    category: "utility",
    defaultPressCount: 1,
    defaultPressInterval: 25,
  },
  {
    id: "guard",
    displayName: "Guard",
    category: "utility",
    defaultPressCount: 1,
    defaultPressInterval: 25,
  },
  {
    id: "phase_walk",
    displayName: "Phase Walk",
    category: "utility",
    defaultPressCount: 1,
    defaultPressInterval: 25,
  },
  {
    id: "single_taunt",
    displayName: "Single Target Taunt",
    category: "utility",
    defaultPressCount: 1,
    defaultPressInterval: 25,
  },
  {
    id: "mass_taunt",
    displayName: "Mass Taunt",
    category: "utility",
    defaultPressCount: 1,
    defaultPressInterval: 25,
  },
  {
    id: "threatening_rage",
    displayName: "Threatening Rage",
    category: "utility",
    defaultPressCount: 1,
    defaultPressInterval: 25,
  },
  {
    id: "overload",
    displayName: "Overload/Knock",
    category: "utility",
    defaultPressCount: 1,
    defaultPressInterval: 25,
  },
  {
    id: "stun_break",
    displayName: "Stun Break",
    category: "utility",
    defaultPressCount: 1,
    defaultPressInterval: 25,
  },
  {
    id: "interrupt",
    displayName: "Interrupt",
    category: "utility",
    defaultPressCount: 1,
    defaultPressInterval: 25,
  },

  // ========== TARGETING ==========
  {
    id: "nearest_enemy",
    displayName: "Nearest Enemy",
    category: "targeting",
    defaultPressCount: 1,
    defaultPressInterval: 50, // 47-54ms range
  },
  {
    id: "previous_enemy",
    displayName: "Previous Enemy",
    category: "targeting",
    defaultPressCount: 1,
    defaultPressInterval: 37, // 33-41ms range
  },
  {
    id: "next_enemy",
    displayName: "Next Enemy",
    category: "targeting",
    defaultPressCount: 1,
    defaultPressInterval: 25,
  },
  {
    id: "target_of_target",
    displayName: "Target of Target",
    category: "targeting",
    defaultPressCount: 1,
    defaultPressInterval: 30,
  },
  {
    id: "acquire_center_target",
    displayName: "Acquire Center Target",
    category: "targeting",
    defaultPressCount: 1,
    defaultPressInterval: 25,
  },
];

// Helper to get abilities by substitution group
export function getAbilitiesBySubstitutionGroup(group: string): AbilityTemplate[] {
  return ABILITY_CATALOG.filter(a => a.substitutionGroup === group);
}

// Helper to get ability by ID
export function getAbilityById(id: string): AbilityTemplate | undefined {
  return ABILITY_CATALOG.find(a => a.id === id);
}
