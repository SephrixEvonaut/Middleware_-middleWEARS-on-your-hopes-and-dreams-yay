import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Gesture Settings Schema
export const gestureSettingsSchema = z.object({
  multiPressWindow: z.number().min(100).max(1000).default(350),
  longPressMin: z.number().min(50).max(200).default(80),
  longPressMax: z.number().min(100).max(300).default(140),
  cancelThreshold: z.number().min(100).max(500).default(200),
  debounceDelay: z.number().min(0).max(50).default(10),
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

// Gesture Types
export const gestureTypeSchema = z.enum([
  "single_press",
  "double_press",
  "triple_press",
  "quadruple_press",
  "long_press",
  "cancel_and_hold",
]);

// Input Mapping Schema
export const inputMappingSchema = z.object({
  id: z.string(),
  deviceType: z.enum(["keyboard", "azeron", "razer_mmo", "swiftpoint", "fsr_sensor"]),
  inputId: z.string(),
  gestureType: gestureTypeSchema,
  actionName: z.string(),
  actionDescription: z.string().optional(),
  priority: z.number().default(0),
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
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Insert and Select Schemas
export const insertProfileSchema = createInsertSchema(profiles, {
  name: z.string().min(1, "Profile name is required"),
  devices: devicesConfigSchema,
  gestureSettings: gestureSettingsSchema,
  inputMappings: z.array(inputMappingSchema).default([]),
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
export type GestureType = z.infer<typeof gestureTypeSchema>;
export type InputMapping = z.infer<typeof inputMappingSchema>;

// Gesture Event Schema (for runtime gesture detection)
export const gestureEventSchema = z.object({
  timestamp: z.number(),
  type: z.enum(["press", "release"]),
  duration: z.number().optional(),
  detected: gestureTypeSchema.optional(),
});

export type GestureEvent = z.infer<typeof gestureEventSchema>;
