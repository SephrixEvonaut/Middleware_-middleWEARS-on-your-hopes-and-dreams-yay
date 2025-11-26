import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Gesture Settings Schema
export const gestureSettingsSchema = z.object({
  multiPressWindow: z.number().min(100).max(1000).default(350),
  longPressMin: z.number().min(50).max(500).default(150),
  longPressMax: z.number().min(100).max(1000).default(500),
  cancelThreshold: z.number().min(100).max(500).default(200),
  debounceDelay: z.number().min(0).max(50).default(10),
  // Charge-Release Settings
  chargeMinHold: z.number().min(100).max(1000).default(300),
  chargeMaxHold: z.number().min(500).max(5000).default(2000),
  // Output Sequence Settings
  outputKeyPadding: z.number().min(0).max(200).default(25),
});

// Device Configurations
export const keyboardConfigSchema = z.object({
  enabled: z.boolean().default(true),
  sharpKeysCompat: z.boolean().default(true),
  customKeyMap: z.record(z.string(), z.string()).default({}),
  detectRemapping: z.boolean().default(true),
});

export const azeronConfigSchema = z.object({
  enabled: z.boolean().default(true),
  buttonCount: z.number().min(1).max(50).default(29),
  thumbPad: z.boolean().default(true),
  sensitivity: z.number().min(0).max(100).default(50),
});

export const razerMMOConfigSchema = z.object({
  enabled: z.boolean().default(true),
  sideButtons: z.number().min(1).max(20).default(12),
  dpiStages: z.array(z.number()).default([800, 1600, 3200]),
  pollingRate: z.number().default(1000),
});

export const swiftpointConfigSchema = z.object({
  enabled: z.boolean().default(true),
  tiltSensors: z.boolean().default(true),
  tiltSensitivity: z.number().min(0).max(100).default(50),
  hapticFeedback: z.boolean().default(true),
});

export const fsrSensorConfigSchema = z.object({
  enabled: z.boolean().default(true),
  analogThresholds: z.array(z.number()).default([0, 25, 50, 75, 100]),
  calibrationCurve: z.enum(["linear", "exponential", "logarithmic"]).default("linear"),
  deadzone: z.number().min(0).max(20).default(5),
});

export const devicesConfigSchema = z.object({
  keyboard: keyboardConfigSchema,
  azeron: azeronConfigSchema,
  razerMMO: razerMMOConfigSchema,
  swiftpoint: swiftpointConfigSchema,
  fsrSensor: fsrSensorConfigSchema,
});

// Modifier State (Sticky Keys functionality)
export const modifierStateSchema = z.object({
  ctrl: z.boolean().default(false),
  shift: z.boolean().default(false),
  alt: z.boolean().default(false),
});

export type ModifierState = z.infer<typeof modifierStateSchema>;

export const modifierModeSchema = z.enum([
  "normal",
  "ctrl",
  "shift",
  "alt",
  "ctrl_shift",
  "ctrl_alt",
  "shift_alt",
  "ctrl_shift_alt",
]);

export type ModifierMode = z.infer<typeof modifierModeSchema>;

// Gesture Types
export const gestureTypeSchema = z.enum([
  "single_press",
  "double_press",
  "triple_press",
  "quadruple_press",
  "long_press",
  "cancel_and_hold",
  "charge_release",
]);

export type GestureType = z.infer<typeof gestureTypeSchema>;

// Input Mapping Schema
export const inputMappingSchema = z.object({
  id: z.string(),
  deviceType: z.enum(["keyboard", "azeron", "razer_mmo", "swiftpoint", "fsr_sensor"]),
  inputId: z.string(),
  gestureType: gestureTypeSchema,
  modifierHash: modifierModeSchema.default("normal"), // Modifier mode when mapping was created
  actionName: z.string(),
  actionDescription: z.string().optional(),
  priority: z.number().default(0),
  canvasPosition: z.object({ x: z.number(), y: z.number() }).optional(),
  actionSlot: z.number().optional(),
  chargeLevel: z.number().min(0).max(100).optional(), // For charge_release gesture
});

// Drizzle Profile Table
export const profiles = pgTable("profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  favorite: boolean("favorite").default(false).notNull(),
  devices: jsonb("devices").notNull().$type<{
    keyboard: z.infer<typeof keyboardConfigSchema>;
    azeron: z.infer<typeof azeronConfigSchema>;
    razerMMO: z.infer<typeof razerMMOConfigSchema>;
    swiftpoint: z.infer<typeof swiftpointConfigSchema>;
    fsrSensor: z.infer<typeof fsrSensorConfigSchema>;
  }>(),
  gestureSettings: jsonb("gesture_settings").notNull().$type<z.infer<typeof gestureSettingsSchema>>(),
  inputMappings: jsonb("input_mappings").notNull().default([]).$type<z.infer<typeof inputMappingSchema>[]>(),
  modifierDefaults: jsonb("modifier_defaults").notNull().default({ ctrl: false, shift: false, alt: false }).$type<ModifierState>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Insert and Select Schemas
export const insertProfileSchema = createInsertSchema(profiles, {
  name: z.string().min(1, "Profile name is required"),
  devices: devicesConfigSchema,
  gestureSettings: gestureSettingsSchema,
  inputMappings: z.array(inputMappingSchema).default([]),
  modifierDefaults: modifierStateSchema.default({ ctrl: false, shift: false, alt: false }),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Select schema for runtime validation (includes all fields)
export const profileSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Profile name is required"),
  description: z.string().optional().nullable(),
  favorite: z.boolean(),
  devices: devicesConfigSchema,
  gestureSettings: gestureSettingsSchema,
  inputMappings: z.array(inputMappingSchema),
  modifierDefaults: modifierStateSchema,
  createdAt: z.union([z.string(), z.date()]).optional(),
  updatedAt: z.union([z.string(), z.date()]).optional(),
});

// Types
export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type GestureSettings = z.infer<typeof gestureSettingsSchema>;
export type KeyboardConfig = z.infer<typeof keyboardConfigSchema>;
export type AzeronConfig = z.infer<typeof azeronConfigSchema>;
export type RazerMMOConfig = z.infer<typeof razerMMOConfigSchema>;
export type SwiftpointConfig = z.infer<typeof swiftpointConfigSchema>;
export type FSRSensorConfig = z.infer<typeof fsrSensorConfigSchema>;
export type InputMapping = z.infer<typeof inputMappingSchema>;

// Gesture Event Schema (for runtime gesture detection)
export const gestureEventSchema = z.object({
  timestamp: z.number(),
  type: z.enum(["press", "release"]),
  duration: z.number().optional(),
  detected: gestureTypeSchema.optional(),
  chargeLevel: z.number().min(0).max(100).optional(), // For charge_release tracking
});

export type GestureEvent = z.infer<typeof gestureEventSchema>;

// ============================================================================
// MACRO SEQUENCE SCHEMA - For local macro agent execution
// ============================================================================

// Sequence step timing constraints
export const SEQUENCE_CONSTRAINTS = {
  MIN_DELAY: 25,           // Never faster than 25ms
  MIN_VARIANCE: 4,         // max - min must be >= 4ms
  MAX_UNIQUE_KEYS: 4,      // Maximum 4 unique keys per sequence
  MAX_REPEATS_PER_KEY: 6,  // Each key can repeat up to 6 times
} as const;

// Single step in a macro sequence
export const sequenceStepSchema = z.object({
  id: z.string(),
  key: z.string().min(1, "Key is required"),           // The key to press (e.g., "a", "f1")
  minDelay: z.number().min(SEQUENCE_CONSTRAINTS.MIN_DELAY, 
    `Minimum delay must be at least ${SEQUENCE_CONSTRAINTS.MIN_DELAY}ms`),
  maxDelay: z.number().min(SEQUENCE_CONSTRAINTS.MIN_DELAY + SEQUENCE_CONSTRAINTS.MIN_VARIANCE),
  echoHits: z.number().min(1).max(SEQUENCE_CONSTRAINTS.MAX_REPEATS_PER_KEY).default(1), // Repetitions
}).refine(
  (step) => step.maxDelay - step.minDelay >= SEQUENCE_CONSTRAINTS.MIN_VARIANCE,
  { message: `Variance (max - min) must be at least ${SEQUENCE_CONSTRAINTS.MIN_VARIANCE}ms` }
);

export type SequenceStep = z.infer<typeof sequenceStepSchema>;

// Trigger gesture types for macro sequences (matches local agent)
export const macroGestureTypeSchema = z.enum([
  "single",
  "long",
  "double",
  "double_long",
  "triple",
  "triple_long",
  "quadruple_long",
  "super_long",
  "cancel",
]);

export type MacroGestureType = z.infer<typeof macroGestureTypeSchema>;

// Available trigger keys (22 input keys)
export const MACRO_TRIGGER_KEYS = [
  "W", "A", "S", "D",
  "B", "I", "T", "C", "H", "Y", "U", "P",
  "1", "2", "3", "4", "5", "6",
  "LEFT_CLICK", "RIGHT_CLICK", "MIDDLE_CLICK", "SCROLL_UP"
] as const;

export const macroTriggerKeySchema = z.enum(MACRO_TRIGGER_KEYS);

export type MacroTriggerKey = z.infer<typeof macroTriggerKeySchema>;

// Complete macro binding
export const macroBindingSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Macro name is required"),
  description: z.string().optional(),
  trigger: z.object({
    key: macroTriggerKeySchema,
    gesture: macroGestureTypeSchema,
  }),
  sequence: z.array(sequenceStepSchema),
  enabled: z.boolean().default(true),
});

export type MacroBinding = z.infer<typeof macroBindingSchema>;

// Gesture detection settings for local agent
export const macroGestureSettingsSchema = z.object({
  multiPressWindow: z.number().min(100).max(1000).default(350),
  debounceDelay: z.number().min(0).max(50).default(10),
  longPressMin: z.number().min(50).max(300).default(80),
  longPressMax: z.number().min(100).max(500).default(140),
  superLongMin: z.number().min(200).max(1000).default(300),
  superLongMax: z.number().min(500).max(5000).default(2000),
  cancelThreshold: z.number().min(1000).max(10000).default(3000),
  // Global timing defaults for new steps
  defaultMinDelay: z.number().min(SEQUENCE_CONSTRAINTS.MIN_DELAY).max(200).default(30),
  defaultMaxDelay: z.number().min(SEQUENCE_CONSTRAINTS.MIN_DELAY + SEQUENCE_CONSTRAINTS.MIN_VARIANCE).max(300).default(40),
  defaultEchoHits: z.number().min(1).max(SEQUENCE_CONSTRAINTS.MAX_REPEATS_PER_KEY).default(1),
});

export type MacroGestureSettings = z.infer<typeof macroGestureSettingsSchema>;

// Complete macro profile for export to local agent
export const macroProfileSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  gestureSettings: macroGestureSettingsSchema,
  macros: z.array(macroBindingSchema),
});

export type MacroProfile = z.infer<typeof macroProfileSchema>;

// Validation helper to check sequence constraints
export function validateSequence(steps: SequenceStep[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Expand echo hits to count actual keypresses
  const expandedSteps: { key: string }[] = [];
  for (const step of steps) {
    for (let i = 0; i < (step.echoHits || 1); i++) {
      expandedSteps.push({ key: step.key });
    }
  }
  
  // Count unique keys
  const uniqueKeys = new Set(expandedSteps.map(s => s.key));
  if (uniqueKeys.size > SEQUENCE_CONSTRAINTS.MAX_UNIQUE_KEYS) {
    errors.push(`Too many unique keys: ${uniqueKeys.size}/${SEQUENCE_CONSTRAINTS.MAX_UNIQUE_KEYS}`);
  }
  
  // Count repeats per key
  const keyCounts = new Map<string, number>();
  for (const step of expandedSteps) {
    keyCounts.set(step.key, (keyCounts.get(step.key) || 0) + 1);
  }
  
  Array.from(keyCounts.entries()).forEach(([key, count]) => {
    if (count > SEQUENCE_CONSTRAINTS.MAX_REPEATS_PER_KEY) {
      errors.push(`Key "${key}" exceeds max repeats: ${count}/${SEQUENCE_CONSTRAINTS.MAX_REPEATS_PER_KEY}`);
    }
  });
  
  // Check timing constraints
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    
    if (step.minDelay < SEQUENCE_CONSTRAINTS.MIN_DELAY) {
      errors.push(`Step ${i + 1}: minDelay ${step.minDelay}ms < ${SEQUENCE_CONSTRAINTS.MIN_DELAY}ms minimum`);
    }
    
    const variance = step.maxDelay - step.minDelay;
    if (variance < SEQUENCE_CONSTRAINTS.MIN_VARIANCE) {
      errors.push(`Step ${i + 1}: variance ${variance}ms < ${SEQUENCE_CONSTRAINTS.MIN_VARIANCE}ms minimum`);
    }
  }
  
  return { valid: errors.length === 0, errors };
}
