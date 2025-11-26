// ============================================================================
// SWTOR MACRO AGENT - TYPE DEFINITIONS
// ============================================================================

// 22 Input Keys for gesture detection
export const INPUT_KEYS = [
  "W", "A", "S", "D",
  "B", "I", "T", "C", "H", "Y", "U", "P",
  "1", "2", "3", "4", "5", "6",
  "LEFT_CLICK", "RIGHT_CLICK", "MIDDLE_CLICK", "SCROLL_UP"
] as const;

export type InputKey = typeof INPUT_KEYS[number];

// 9 Gesture Types
export const GESTURE_TYPES = [
  "single",
  "long",
  "double", 
  "double_long",
  "triple",
  "triple_long",
  "quadruple_long",
  "super_long",
  "cancel"
] as const;

export type GestureType = typeof GESTURE_TYPES[number];

// Timing configuration for a single keypress in a sequence
export interface SequenceStep {
  key: string;           // The key to press (e.g., "a", "b", "f1")
  minDelay: number;      // Minimum ms before next press (>= 25ms)
  maxDelay: number;      // Maximum ms before next press (variance >= 4ms)
  echoHits?: number;     // Number of times to repeat this key (1-6, default 1)
}

// A macro binding: gesture triggers a sequence
export interface MacroBinding {
  name: string;
  trigger: {
    key: InputKey;
    gesture: GestureType;
  };
  sequence: SequenceStep[];
  enabled: boolean;
}

// Gesture detection timing settings
export interface GestureSettings {
  multiPressWindow: number;    // Window for detecting multi-presses (ms)
  debounceDelay: number;       // Debounce for key events (ms)
  longPressMin: number;        // Minimum for long press (ms)
  longPressMax: number;        // Maximum for long press (ms)
  superLongMin: number;        // Minimum for super long (ms)
  superLongMax: number;        // Maximum for super long (ms)
  cancelThreshold: number;     // Hold time to trigger cancel (ms)
}

// Complete macro profile
export interface MacroProfile {
  name: string;
  description: string;
  gestureSettings: GestureSettings;
  macros: MacroBinding[];
}

// Gesture detection event
export interface GestureEvent {
  inputKey: InputKey;
  gesture: GestureType;
  timestamp: number;
  holdDuration?: number;
}

// Sequence execution constraints
export const SEQUENCE_CONSTRAINTS = {
  MIN_DELAY: 25,           // Never faster than 25ms
  MIN_VARIANCE: 4,         // max - min must be >= 4ms
  MAX_UNIQUE_KEYS: 4,      // Maximum 4 unique keys per sequence
  MAX_REPEATS_PER_KEY: 6,  // Each key can repeat up to 6 times
} as const;
