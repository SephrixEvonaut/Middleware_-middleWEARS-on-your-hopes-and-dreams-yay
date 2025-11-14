// Complete keyboard key definitions for input mapping
// Covers all standard keyboard keys including letters, numbers, punctuation, and special keys

export interface KeyboardKey {
  id: string;
  label: string;
  category: 'letters' | 'numbers' | 'punctuation' | 'special' | 'function' | 'navigation' | 'modifiers';
  scancode?: number; // For middleware mapping
}

// Letters (A-Z)
export const LETTER_KEYS: KeyboardKey[] = [
  'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
  'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'
].map(letter => ({
  id: letter,
  label: letter.toUpperCase(),
  category: 'letters' as const,
}));

// Numbers (0-9)
export const NUMBER_KEYS: KeyboardKey[] = [
  '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'
].map(num => ({
  id: num,
  label: num,
  category: 'numbers' as const,
}));

// Punctuation and Symbols
export const PUNCTUATION_KEYS: KeyboardKey[] = [
  // Number row symbols
  { id: 'backquote', label: '` ~', category: 'punctuation' as const },
  { id: 'minus', label: '- _', category: 'punctuation' as const },
  { id: 'equal', label: '= +', category: 'punctuation' as const },
  
  // Brackets
  { id: 'bracketleft', label: '[ {', category: 'punctuation' as const },
  { id: 'bracketright', label: '] }', category: 'punctuation' as const },
  { id: 'backslash', label: '\\ |', category: 'punctuation' as const },
  
  // Punctuation
  { id: 'semicolon', label: '; :', category: 'punctuation' as const },
  { id: 'quote', label: '\' "', category: 'punctuation' as const },
  { id: 'comma', label: ', <', category: 'punctuation' as const },
  { id: 'period', label: '. >', category: 'punctuation' as const },
  { id: 'slash', label: '/ ?', category: 'punctuation' as const },
];

// Special Keys
export const SPECIAL_KEYS: KeyboardKey[] = [
  { id: 'space', label: 'Space', category: 'special' as const },
  { id: 'enter', label: 'Enter', category: 'special' as const },
  { id: 'tab', label: 'Tab', category: 'special' as const },
  { id: 'backspace', label: 'Backspace', category: 'special' as const },
  { id: 'delete', label: 'Delete', category: 'special' as const },
  { id: 'escape', label: 'Escape', category: 'special' as const },
  { id: 'capslock', label: 'Caps Lock', category: 'special' as const },
];

// Function Keys (F1-F12)
export const FUNCTION_KEYS: KeyboardKey[] = [
  'f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8', 'f9', 'f10', 'f11', 'f12'
].map(key => ({
  id: key,
  label: key.toUpperCase(),
  category: 'function' as const,
}));

// Navigation Keys
export const NAVIGATION_KEYS: KeyboardKey[] = [
  { id: 'arrowup', label: 'Arrow Up', category: 'navigation' as const },
  { id: 'arrowdown', label: 'Arrow Down', category: 'navigation' as const },
  { id: 'arrowleft', label: 'Arrow Left', category: 'navigation' as const },
  { id: 'arrowright', label: 'Arrow Right', category: 'navigation' as const },
  { id: 'home', label: 'Home', category: 'navigation' as const },
  { id: 'end', label: 'End', category: 'navigation' as const },
  { id: 'pageup', label: 'Page Up', category: 'navigation' as const },
  { id: 'pagedown', label: 'Page Down', category: 'navigation' as const },
  { id: 'insert', label: 'Insert', category: 'navigation' as const },
];

// Modifier Keys (for reference - these use toggle system)
export const MODIFIER_KEYS: KeyboardKey[] = [
  { id: 'ctrl', label: 'Ctrl', category: 'modifiers' as const },
  { id: 'shift', label: 'Shift', category: 'modifiers' as const },
  { id: 'alt', label: 'Alt', category: 'modifiers' as const },
  { id: 'meta', label: 'Win/Cmd', category: 'modifiers' as const },
];

// Combined list of ALL keyboard keys
export const ALL_KEYBOARD_KEYS: KeyboardKey[] = [
  ...LETTER_KEYS,
  ...NUMBER_KEYS,
  ...PUNCTUATION_KEYS,
  ...SPECIAL_KEYS,
  ...FUNCTION_KEYS,
  ...NAVIGATION_KEYS,
  ...MODIFIER_KEYS,
];

// Helper function to get key by ID
export function getKeyById(id: string): KeyboardKey | undefined {
  return ALL_KEYBOARD_KEYS.find(key => key.id === id);
}

// Helper function to get keys by category
export function getKeysByCategory(category: KeyboardKey['category']): KeyboardKey[] {
  return ALL_KEYBOARD_KEYS.filter(key => key.category === category);
}

// Total count: 26 letters + 10 numbers + 11 punctuation + 7 special + 12 function + 9 navigation + 4 modifiers = 79 keys
export const KEYBOARD_KEY_COUNT = ALL_KEYBOARD_KEYS.length;
