/**
 * Interception Driver Executor - Phase 2
 * 
 * Uses the Interception driver for kernel-level input injection.
 * Input appears to come from real hardware devices, making it much
 * harder for anti-cheat systems to detect.
 * 
 * Detection level: HARD (kernel-level, no LLKHF_INJECTED flag)
 * 
 * Requirements:
 * - Interception driver installed (https://github.com/oblitum/Interception)
 * - Windows only
 * - Administrator privileges for driver installation
 * 
 * How it works:
 * 1. Interception hooks into the Windows input stack at kernel level
 * 2. We create a "virtual" keyboard device context
 * 3. Input sent through this context appears to come from hardware
 * 4. No software injection flags are set
 */

import { SequenceStep, MacroBinding, SEQUENCE_CONSTRAINTS } from './types.js';

// Interception key codes (scan codes)
// These are hardware scan codes, not virtual key codes
const SCAN_CODES: Record<string, number> = {
  // Number row
  '1': 0x02, '2': 0x03, '3': 0x04, '4': 0x05, '5': 0x06,
  '6': 0x07, '7': 0x08, '8': 0x09, '9': 0x0A, '0': 0x0B,
  
  // QWERTY row
  'q': 0x10, 'w': 0x11, 'e': 0x12, 'r': 0x13, 't': 0x14,
  'y': 0x15, 'u': 0x16, 'i': 0x17, 'o': 0x18, 'p': 0x19,
  
  // ASDF row
  'a': 0x1E, 's': 0x1F, 'd': 0x20, 'f': 0x21, 'g': 0x22,
  'h': 0x23, 'j': 0x24, 'k': 0x25, 'l': 0x26,
  
  // ZXCV row
  'z': 0x2C, 'x': 0x2D, 'c': 0x2E, 'v': 0x2F, 'b': 0x30,
  'n': 0x31, 'm': 0x32,
  
  // Function keys
  'f1': 0x3B, 'f2': 0x3C, 'f3': 0x3D, 'f4': 0x3E,
  'f5': 0x3F, 'f6': 0x40, 'f7': 0x41, 'f8': 0x42,
  'f9': 0x43, 'f10': 0x44, 'f11': 0x57, 'f12': 0x58,
  
  // Special keys
  'space': 0x39, 'enter': 0x1C, 'escape': 0x01,
  'tab': 0x0F, 'backspace': 0x0E,
  
  // Numpad
  'num0': 0x52, 'num1': 0x4F, 'num2': 0x50, 'num3': 0x51,
  'num4': 0x4B, 'num5': 0x4C, 'num6': 0x4D,
  'num7': 0x47, 'num8': 0x48, 'num9': 0x49,
  'numplus': 0x4E, 'numminus': 0x4A,
  'nummultiply': 0x37, 'numdivide': 0x35,
  
  // Arrow keys (extended)
  'up': 0x48, 'down': 0x50, 'left': 0x4B, 'right': 0x4D,
  
  // Other
  'minus': 0x0C, 'equals': 0x0D,
  'leftbracket': 0x1A, 'rightbracket': 0x1B,
  'semicolon': 0x27, 'quote': 0x28,
  'comma': 0x33, 'period': 0x34, 'slash': 0x35,
  'backslash': 0x2B, 'grave': 0x29,
};

// Interception stroke structure
interface InterceptionKeyStroke {
  code: number;      // Scan code
  state: number;     // 0 = down, 1 = up
  information: number;
}

// Interception context handle
type InterceptionContext = number;
type InterceptionDevice = number;

// Key states for Interception
const KEY_DOWN = 0x00;
const KEY_UP = 0x01;
const KEY_E0 = 0x02;  // Extended key flag

// FFI bindings interface (will be loaded dynamically)
interface InterceptionFFI {
  interception_create_context(): InterceptionContext;
  interception_destroy_context(context: InterceptionContext): void;
  interception_get_hardware_id(context: InterceptionContext, device: InterceptionDevice, buffer: Buffer, size: number): number;
  interception_send(context: InterceptionContext, device: InterceptionDevice, stroke: Buffer, nstroke: number): number;
  interception_wait(context: InterceptionContext): InterceptionDevice;
  interception_receive(context: InterceptionContext, device: InterceptionDevice, stroke: Buffer, nstroke: number): number;
  interception_is_keyboard(device: InterceptionDevice): boolean;
  interception_is_mouse(device: InterceptionDevice): boolean;
}

export class InterceptionExecutor {
  private context: InterceptionContext | null = null;
  private keyboardDevice: InterceptionDevice = 1; // Default to first keyboard
  private ffi: InterceptionFFI | null = null;
  private initialized: boolean = false;
  private dllPath: string;

  constructor(dllPath: string = 'C:\\Program Files\\Interception\\library\\x64\\interception.dll') {
    this.dllPath = dllPath;
  }

  /**
   * Initialize the Interception driver context
   */
  async initialize(): Promise<boolean> {
    try {
      // Dynamic import of ffi-napi (Windows only, native module)
      // These packages must be installed separately: npm install ffi-napi ref-napi
      // @ts-ignore - dynamic import, only works on Windows with native modules
      const ffi = await import('ffi-napi');
      // @ts-ignore - dynamic import
      const ref = await import('ref-napi');

      // Define the Interception library interface
      this.ffi = ffi.Library(this.dllPath, {
        'interception_create_context': ['pointer', []],
        'interception_destroy_context': ['void', ['pointer']],
        'interception_get_hardware_id': ['int', ['pointer', 'int', 'pointer', 'int']],
        'interception_send': ['int', ['pointer', 'int', 'pointer', 'int']],
        'interception_wait': ['int', ['pointer']],
        'interception_receive': ['int', ['pointer', 'int', 'pointer', 'int']],
        'interception_is_keyboard': ['bool', ['int']],
        'interception_is_mouse': ['bool', ['int']],
      }) as unknown as InterceptionFFI;

      // Create context
      this.context = this.ffi.interception_create_context();
      
      if (!this.context) {
        console.error('[InterceptionExecutor] Failed to create context - is driver installed?');
        return false;
      }

      // Find first keyboard device (devices 1-10 are keyboards)
      for (let device = 1; device <= 10; device++) {
        if (this.ffi.interception_is_keyboard(device)) {
          this.keyboardDevice = device;
          console.log(`[InterceptionExecutor] Using keyboard device: ${device}`);
          break;
        }
      }

      this.initialized = true;
      console.log('[InterceptionExecutor] Initialized successfully (kernel-level injection ready)');
      return true;
    } catch (error: any) {
      console.error('[InterceptionExecutor] Failed to initialize:', error.message);
      console.error('[InterceptionExecutor] Make sure:');
      console.error('  1. Interception driver is installed');
      console.error('  2. ffi-napi and ref-napi are installed: npm install ffi-napi ref-napi');
      console.error('  3. Running on Windows with proper permissions');
      return false;
    }
  }

  /**
   * Cleanup and destroy context
   */
  destroy(): void {
    if (this.ffi && this.context) {
      this.ffi.interception_destroy_context(this.context);
      this.context = null;
      this.initialized = false;
      console.log('[InterceptionExecutor] Context destroyed');
    }
  }

  /**
   * Convert key name to scan code
   */
  private getScanCode(key: string): number | null {
    const normalizedKey = key.toLowerCase();
    return SCAN_CODES[normalizedKey] ?? null;
  }

  /**
   * Create a keystroke buffer for Interception
   */
  private createStrokeBuffer(code: number, state: number): Buffer {
    // Interception keystroke structure is 10 bytes
    // struct InterceptionKeyStroke {
    //   unsigned short code;
    //   unsigned short state;
    //   unsigned int information;
    // };
    const buffer = Buffer.alloc(10);
    buffer.writeUInt16LE(code, 0);      // scan code
    buffer.writeUInt16LE(state, 2);     // state (0=down, 1=up)
    buffer.writeUInt32LE(0, 4);         // information (unused)
    return buffer;
  }

  /**
   * Send a single keypress (down + up) via Interception
   */
  private sendKey(key: string): boolean {
    if (!this.initialized || !this.ffi || !this.context) {
      console.error('[InterceptionExecutor] Not initialized');
      return false;
    }

    const scanCode = this.getScanCode(key);
    if (scanCode === null) {
      console.error(`[InterceptionExecutor] Unknown key: ${key}`);
      return false;
    }

    // Key down
    const downStroke = this.createStrokeBuffer(scanCode, KEY_DOWN);
    this.ffi.interception_send(this.context, this.keyboardDevice, downStroke, 1);

    // Small delay between down and up (5-15ms, human-like)
    const holdTime = Math.floor(Math.random() * 10) + 5;
    const start = Date.now();
    while (Date.now() - start < holdTime) {
      // Busy wait for precise timing
    }

    // Key up
    const upStroke = this.createStrokeBuffer(scanCode, KEY_UP);
    this.ffi.interception_send(this.context, this.keyboardDevice, upStroke, 1);

    return true;
  }

  /**
   * Calculate randomized delay between min and max
   */
  private getRandomDelay(minDelay: number, maxDelay: number): number {
    return Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
  }

  /**
   * Precise sleep using busy-wait for sub-millisecond accuracy
   */
  private preciseSleep(ms: number): Promise<void> {
    return new Promise((resolve) => {
      const start = Date.now();
      const check = () => {
        if (Date.now() - start >= ms) {
          resolve();
        } else {
          setImmediate(check);
        }
      };
      check();
    });
  }

  /**
   * Validate a sequence before execution
   */
  validateSequence(sequence: SequenceStep[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check unique keys constraint
    const uniqueKeys = new Set(sequence.map(s => s.key.toLowerCase()));
    if (uniqueKeys.size > SEQUENCE_CONSTRAINTS.MAX_UNIQUE_KEYS) {
      errors.push(`Too many unique keys: ${uniqueKeys.size} (max ${SEQUENCE_CONSTRAINTS.MAX_UNIQUE_KEYS})`);
    }

    // Check each step
    for (const step of sequence) {
      // Min delay check
      if (step.minDelay < SEQUENCE_CONSTRAINTS.MIN_DELAY) {
        errors.push(`Step ${step.key}: minDelay ${step.minDelay}ms < minimum ${SEQUENCE_CONSTRAINTS.MIN_DELAY}ms`);
      }

      // Variance check
      const variance = step.maxDelay - step.minDelay;
      if (variance < SEQUENCE_CONSTRAINTS.MIN_VARIANCE) {
        errors.push(`Step ${step.key}: variance ${variance}ms < minimum ${SEQUENCE_CONSTRAINTS.MIN_VARIANCE}ms`);
      }

      // Echo hits check
      const echoHits = step.echoHits || 1;
      if (echoHits > SEQUENCE_CONSTRAINTS.MAX_REPEATS_PER_KEY) {
        errors.push(`Step ${step.key}: echoHits ${echoHits} > maximum ${SEQUENCE_CONSTRAINTS.MAX_REPEATS_PER_KEY}`);
      }

      // Key mapping check
      if (!this.getScanCode(step.key)) {
        errors.push(`Step ${step.key}: unknown key (no scan code mapping)`);
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Execute a sequence of keypresses with timing
   * Uses Interception driver for kernel-level injection
   */
  async executeSequence(sequence: SequenceStep[]): Promise<boolean> {
    if (!this.initialized) {
      console.error('[InterceptionExecutor] Not initialized - call initialize() first');
      return false;
    }

    // Validate before execution
    const validation = this.validateSequence(sequence);
    if (!validation.valid) {
      console.error('[InterceptionExecutor] Sequence validation failed:');
      validation.errors.forEach(e => console.error(`  - ${e}`));
      return false;
    }

    console.log(`[InterceptionExecutor] Executing ${sequence.length} steps (Interception/kernel mode)`);

    for (let i = 0; i < sequence.length; i++) {
      const step = sequence[i];
      const echoHits = step.echoHits || 1;

      // Execute each echo hit
      for (let hit = 0; hit < echoHits; hit++) {
        // Send the key via Interception
        const success = this.sendKey(step.key);
        if (!success) {
          console.error(`[InterceptionExecutor] Failed to send key: ${step.key}`);
          return false;
        }

        console.log(`  [${i + 1}/${sequence.length}] ${step.key} (hit ${hit + 1}/${echoHits}) via Interception`);

        // Delay before next keypress (except after last hit of last step)
        const isLastHit = hit === echoHits - 1;
        const isLastStep = i === sequence.length - 1;
        
        if (!isLastStep || !isLastHit) {
          const delay = this.getRandomDelay(step.minDelay, step.maxDelay);
          await this.preciseSleep(delay);
        }
      }
    }

    console.log('[InterceptionExecutor] Sequence completed successfully');
    return true;
  }

  /**
   * Check if Interception driver is available
   */
  static async isAvailable(): Promise<boolean> {
    try {
      const fs = await import('fs');
      const defaultPath = 'C:\\Program Files\\Interception\\library\\x64\\interception.dll';
      return fs.existsSync(defaultPath);
    } catch {
      return false;
    }
  }
}

/**
 * Fallback executor that mimics Interception API but uses console logging
 * Useful for testing on non-Windows systems or without driver installed
 */
export class MockInterceptionExecutor {
  private initialized: boolean = false;

  async initialize(): Promise<boolean> {
    console.log('[MockInterception] Initialized in MOCK mode (no actual keypresses)');
    console.log('[MockInterception] Install Interception driver for real kernel-level injection');
    this.initialized = true;
    return true;
  }

  destroy(): void {
    this.initialized = false;
    console.log('[MockInterception] Destroyed');
  }

  validateSequence(sequence: SequenceStep[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const uniqueKeys = new Set(sequence.map(s => s.key.toLowerCase()));
    
    if (uniqueKeys.size > SEQUENCE_CONSTRAINTS.MAX_UNIQUE_KEYS) {
      errors.push(`Too many unique keys: ${uniqueKeys.size}`);
    }

    for (const step of sequence) {
      if (step.minDelay < SEQUENCE_CONSTRAINTS.MIN_DELAY) {
        errors.push(`Step ${step.key}: minDelay too low`);
      }
      if (step.maxDelay - step.minDelay < SEQUENCE_CONSTRAINTS.MIN_VARIANCE) {
        errors.push(`Step ${step.key}: variance too low`);
      }
    }

    return { valid: errors.length === 0, errors };
  }

  async executeSequence(sequence: SequenceStep[]): Promise<boolean> {
    if (!this.initialized) return false;

    const validation = this.validateSequence(sequence);
    if (!validation.valid) {
      console.error('[MockInterception] Validation failed:', validation.errors);
      return false;
    }

    console.log(`[MockInterception] Would execute ${sequence.length} steps:`);
    for (const step of sequence) {
      const echoHits = step.echoHits || 1;
      console.log(`  - ${step.key} x${echoHits} (${step.minDelay}-${step.maxDelay}ms delay)`);
    }
    return true;
  }
}

export default InterceptionExecutor;
