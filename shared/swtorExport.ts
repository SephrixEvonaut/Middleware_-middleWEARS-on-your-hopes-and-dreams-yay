import type { Profile, InputMapping, ModifierMode } from "./schema";

// Safe keys for SWTOR keybinding (68 total - excludes modifiers and special keys)
// Excludes: Alt, Shift, Ctrl, Windows, Tab, Capslock, Escape, Delete, PrtScrn, Enter, Backspace
export const SAFE_KEYS = [
  // Letters (26)
  "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M",
  "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z",
  
  // Numbers (10)
  "1", "2", "3", "4", "5", "6", "7", "8", "9", "0",
  
  // Function keys (12)
  "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12",
  
  // Navigation (8)
  "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight",
  "Home", "End", "PageUp", "PageDown",
  
  // Punctuation and special (12 including Space)
  "`", "-", "=", "[", "]", "\\", ";", "'", ",", ".", "/",
  "Space",
] as const;

export type SafeKey = typeof SAFE_KEYS[number];

// Forbidden keys that include modifiers or special keys
export const FORBIDDEN_KEYS = [
  "Alt", "Shift", "Ctrl", "Control", "Windows", "Win", "Cmd", "Command", "Meta",
  "Tab", "Capslock", "CapsLock", "Escape", "Esc", "Delete", "Del",
  "PrtScrn", "PrintScreen", "Enter", "Return", "Backspace", "Insert"
] as const;

/**
 * Validates that a key is safe for SWTOR keybinds (no modifiers)
 * Returns true if key is in SAFE_KEYS list, false otherwise
 */
export function isSafeKey(key: string): key is SafeKey {
  return SAFE_KEYS.includes(key as SafeKey);
}

/**
 * Validates that a key is NOT a forbidden modifier or special key
 * Returns error message if forbidden, null if safe
 */
export function validateKeyIsSafe(key: string): string | null {
  const upperKey = key.toUpperCase();
  
  for (const forbidden of FORBIDDEN_KEYS) {
    if (upperKey === forbidden.toUpperCase()) {
      return `Key "${key}" is forbidden - it's a modifier or special key that violates anti-cheat compliance`;
    }
  }
  
  if (!isSafeKey(key)) {
    return `Key "${key}" is not in the safe key list (68 allowed keys)`;
  }
  
  return null; // Key is safe
}

// SWTOR Action names (common actions - user can customize actionName in mappings)
export interface SWTORBinding {
  action: string; // e.g., "QuickSlot1", "TargetNextEnemy", custom action names
  primary?: string; // Primary key binding (e.g., "1", "F1", "Space")
  secondary?: string; // Secondary key binding (optional)
}

export interface SWTORKeybindFile {
  characterName: string;
  bindings: SWTORBinding[];
}

// Maps InputMapping to SWTOR-compatible key outputs
export interface GestureKeyMapping {
  inputId: string; // Original input (e.g., "A", "Azeron 1")
  deviceType: string;
  gestureType: string;
  actionName: string;
  outputKey: SafeKey; // Translated safe key for SWTOR
  modifierMode: ModifierMode; // Which mode this mapping belongs to
}

/**
 * Translates profile mappings to safe keyboard outputs for a specific modifier mode
 * Maps each gesture to a unique safe key, detecting collisions
 * CRITICAL: Only processes mappings for the specified modifierMode to ensure proper isolation
 */
export function translateMappingsToSafeKeys(
  profile: Profile,
  modifierMode: ModifierMode = "normal"
): GestureKeyMapping[] {
  const mappings: GestureKeyMapping[] = [];
  const usedKeys = new Set<SafeKey>();
  let keyIndex = 0;

  // Filter mappings to ONLY those matching this modifier mode
  // This ensures each modifier mode gets independent safe key mappings
  const relevantMappings = profile.inputMappings.filter(
    (m) => m.modifierHash === modifierMode
  );

  console.log(`[SWTOR Export] Processing ${relevantMappings.length} mappings for modifier mode: ${modifierMode}`);

  for (const mapping of relevantMappings) {
    // Find next available safe key
    while (keyIndex < SAFE_KEYS.length && usedKeys.has(SAFE_KEYS[keyIndex])) {
      keyIndex++;
    }

    if (keyIndex >= SAFE_KEYS.length) {
      console.warn(`[SWTOR Export] Ran out of safe keys at mapping index ${mappings.length} for mode ${modifierMode}`);
      break;
    }

    const outputKey = SAFE_KEYS[keyIndex];
    usedKeys.add(outputKey);

    mappings.push({
      inputId: mapping.inputId,
      deviceType: mapping.deviceType,
      gestureType: mapping.gestureType,
      actionName: mapping.actionName,
      outputKey,
      modifierMode,
    });

    console.log(`[SWTOR Export] ${mapping.inputId} + ${mapping.gestureType} (${modifierMode}) → ${outputKey}`);
    keyIndex++;
  }

  return mappings;
}

/**
 * Generates SWTOR KeyBindings XML from gesture mappings
 */
export function generateSWTORXML(
  characterName: string,
  mappings: GestureKeyMapping[]
): string {
  const bindings: SWTORBinding[] = mappings.map((m) => ({
    action: m.actionName,
    primary: m.outputKey,
  }));

  return buildSWTORXML({ characterName, bindings });
}

/**
 * Builds SWTOR-compatible XML structure
 * Based on documented structure: <KeyBindings><Binding><Action/><Primary/><Secondary/></Binding></KeyBindings>
 */
function buildSWTORXML(keybindFile: SWTORKeybindFile): string {
  const { characterName, bindings } = keybindFile;
  
  const xmlBindings = bindings.map((binding) => {
    const primaryTag = binding.primary 
      ? `    <Primary>${escapeXML(binding.primary)}</Primary>`
      : '';
    const secondaryTag = binding.secondary 
      ? `    <Secondary>${escapeXML(binding.secondary)}</Secondary>`
      : '';
    
    return `  <Binding>
    <Action>${escapeXML(binding.action)}</Action>
${primaryTag}${secondaryTag ? '\n' + secondaryTag : ''}
  </Binding>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="utf-8"?>
<!-- SWTOR KeyBindings for ${escapeXML(characterName)} -->
<!-- Generated by Gesture Mapper - ${new Date().toISOString()} -->
<KeyBindings>
${xmlBindings}
</KeyBindings>`;
}

/**
 * Escapes special XML characters
 */
function escapeXML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Main export function - generates SWTOR keybind XML for a profile
 */
export function exportSWTORKeybinds(
  profile: Profile,
  characterName: string,
  modifierMode: ModifierMode = "normal"
): string {
  const mappings = translateMappingsToSafeKeys(profile, modifierMode);
  return generateSWTORXML(characterName, mappings);
}
