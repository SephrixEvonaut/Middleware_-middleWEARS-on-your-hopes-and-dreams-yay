import { z } from "zod";

// ============================================================================
// INPUT KEYS - 22 Total
// ============================================================================

export const inputKeySchema = z.enum([
  // Movement (4)
  "W", "A", "S", "D",
  // Actions (8)
  "B", "I", "T", "C", "H", "Y", "U", "P",
  // Numbers (6)
  "1", "2", "3", "4", "5", "6",
  // Mouse (2)
  "LEFT_CLICK", "RIGHT_CLICK",
]);

export type InputKey = z.infer<typeof inputKeySchema>;

// ============================================================================
// GESTURE TYPES - 9 Variants per Key
// ============================================================================

export const gestureTypeSchema = z.enum([
  "single",              // Single press
  "long",                // Long press (80-140ms)
  "double",              // Double press
  "double_long",         // Double press, 2nd is long
  "triple",              // Triple press
  "triple_long",         // Triple press, 3rd is long
  "quadruple_long",      // Quadruple press, 4th is long
  "super_long",          // Super long hold (300-2000ms) - Alternative sequence
  "cancel",              // Very very long hold (>3000ms) - Abort + optional cancel macro
]);

export type GestureType = z.infer<typeof gestureTypeSchema>;

// ============================================================================
// TARGET MODIFIERS
// ============================================================================

export const targetModifierSchema = z.enum([
  "none",
  "nearest_enemy",
  "previous_enemy",
  "next_enemy",
  "acquire_center_target",
  "target_of_target",
  "focus_target",
  "group_member_1",
  "group_member_2",
  "group_member_3",
  "self",
]);

export type TargetModifier = z.infer<typeof targetModifierSchema>;

// ============================================================================
// ABILITY TEMPLATES
// ============================================================================

export const abilityTemplateSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  category: z.enum([
    "damage",
    "healing",
    "defensive",
    "crowd_control",
    "utility",
    "targeting",
  ]),
  substitutionGroup: z.string().optional(), // e.g., "basic_attack" for crushing_blow/force_scream/smash
  defaultPressCount: z.number().default(1),
  defaultPressInterval: z.number().default(25), // MS between presses
  description: z.string().optional(),
});

export type AbilityTemplate = z.infer<typeof abilityTemplateSchema>;

// ============================================================================
// MACRO STEP - One action in a sequence
// ============================================================================

export const macroStepSchema = z.object({
  id: z.string(),
  order: z.number(), // Execution order
  ability: z.string(), // References AbilityTemplate.id
  pressCount: z.number().min(1).max(10).default(1), // How many times to spam
  pressInterval: z.number().min(10).max(200).default(25), // MS between each press
  waitAfter: z.number().min(0).max(500).default(40), // MS to wait before next step
  targetModifier: targetModifierSchema.default("none"),
});

export type MacroStep = z.infer<typeof macroStepSchema>;

// ============================================================================
// MACRO BINDING - Maps gesture to sequence
// ============================================================================

export const macroBindingSchema = z.object({
  id: z.string(),
  inputKey: inputKeySchema,
  gestureType: gestureTypeSchema,
  sequence: z.array(macroStepSchema),
  enabled: z.boolean().default(true),
  description: z.string().optional(),
});

export type MacroBinding = z.infer<typeof macroBindingSchema>;

// ============================================================================
// GESTURE SETTINGS - Timing thresholds
// ============================================================================

export const gestureSettingsSchema = z.object({
  // Multi-press timing
  multiPressWindow: z.number().min(100).max(1000).default(350),
  debounceDelay: z.number().min(0).max(50).default(10),
  
  // Long press tiers
  longPressMin: z.number().min(50).max(150).default(80),
  longPressMax: z.number().min(100).max(200).default(140),
  
  // Super long press
  superLongMin: z.number().min(200).max(500).default(300),
  superLongMax: z.number().min(500).max(3000).default(2000),
  
  // Cancel threshold
  cancelThreshold: z.number().min(2500).max(5000).default(3000),
});

export type GestureSettings = z.infer<typeof gestureSettingsSchema>;

// ============================================================================
// MACRO PROFILE - Top-level container
// ============================================================================

export const macroProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  favorite: z.boolean().default(false),
  gestureSettings: gestureSettingsSchema,
  macroBindings: z.array(macroBindingSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type MacroProfile = z.infer<typeof macroProfileSchema>;

// Insert schemas for API validation
export const insertMacroProfileSchema = macroProfileSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMacroBindingSchema = macroBindingSchema.omit({ id: true });
export const insertMacroStepSchema = macroStepSchema.omit({ id: true });
export const insertAbilityTemplateSchema = abilityTemplateSchema;

export type InsertMacroProfile = z.infer<typeof insertMacroProfileSchema>;
export type InsertMacroBinding = z.infer<typeof insertMacroBindingSchema>;
export type InsertMacroStep = z.infer<typeof insertMacroStepSchema>;
