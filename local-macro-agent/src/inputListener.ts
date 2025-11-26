// ============================================================================
// INPUT LISTENER - Global keyboard/mouse capture
// ============================================================================
// 
// NOTE: This module provides a fallback implementation using process.stdin
// for testing. For production use with global hotkeys (works even when
// SWTOR is focused), you'll need to install native dependencies.
//
// OPTION 1: Use 'iohook' (recommended for global hooks)
//   npm install iohook
//   Note: Requires native compilation, may need Visual Studio Build Tools
//
// OPTION 2: Use 'node-global-key-listener' (easier install)
//   npm install node-global-key-listener
//
// OPTION 3: Use this fallback (stdin-based, for testing only)
//   Works in terminal, doesn't capture when other apps are focused
//
// ============================================================================

import { InputKey } from './types.js';

export interface KeyEvent {
  key: string;
  type: 'down' | 'up';
  timestamp: number;
}

export interface MouseEvent {
  button: 'LEFT_CLICK' | 'RIGHT_CLICK' | 'MIDDLE_CLICK';
  type: 'down' | 'up';
  timestamp: number;
}

export type InputCallback = (event: KeyEvent | MouseEvent) => void;

export class InputListener {
  private callback: InputCallback;
  private isListening: boolean = false;
  private pressedKeys: Set<string> = new Set();

  constructor(callback: InputCallback) {
    this.callback = callback;
  }

  /**
   * Start listening for input events
   * Uses stdin for testing - replace with iohook for production
   */
  start(): void {
    if (this.isListening) return;
    this.isListening = true;

    console.log('\n🎧 Input Listener started (stdin mode)');
    console.log('   Press keys to test gesture detection');
    console.log('   Press Ctrl+C to exit\n');

    // Configure stdin for raw mode
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.setEncoding('utf8');

      process.stdin.on('data', (data: string) => {
        const key = data.toString();

        // Handle Ctrl+C to exit
        if (key === '\u0003') {
          console.log('\n👋 Exiting...');
          process.exit();
        }

        // Handle key press (simulate down + up)
        const upperKey = key.toUpperCase();
        
        // Emit key down
        this.callback({
          key: upperKey,
          type: 'down',
          timestamp: Date.now(),
        });

        // Emit key up after a short delay (simulate quick tap)
        setTimeout(() => {
          this.callback({
            key: upperKey,
            type: 'up',
            timestamp: Date.now(),
          });
        }, 50);
      });
    } else {
      console.log('⚠️  stdin not in TTY mode, using line-based input');
      console.log('   Type a key and press Enter to simulate keypresses\n');

      process.stdin.resume();
      process.stdin.setEncoding('utf8');

      process.stdin.on('data', (data: string) => {
        const key = data.toString().trim().toUpperCase();
        if (!key) return;

        // Emit key down
        this.callback({
          key,
          type: 'down',
          timestamp: Date.now(),
        });

        // Emit key up after a short delay
        setTimeout(() => {
          this.callback({
            key,
            type: 'up',
            timestamp: Date.now(),
          });
        }, 50);
      });
    }
  }

  /**
   * Stop listening for input events
   */
  stop(): void {
    this.isListening = false;
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(false);
    }
    console.log('🛑 Input Listener stopped');
  }

  /**
   * Check if listener is active
   */
  isActive(): boolean {
    return this.isListening;
  }
}

// ============================================================================
// PRODUCTION INPUT LISTENER (using iohook)
// ============================================================================
// Uncomment and use this version when you install iohook:
//
// import ioHook from 'iohook';
//
// export class ProductionInputListener {
//   private callback: InputCallback;
//   private isListening: boolean = false;
//
//   constructor(callback: InputCallback) {
//     this.callback = callback;
//   }
//
//   start(): void {
//     if (this.isListening) return;
//     this.isListening = true;
//
//     ioHook.on('keydown', (event) => {
//       this.callback({
//         key: this.mapKeyCode(event.keycode),
//         type: 'down',
//         timestamp: Date.now(),
//       });
//     });
//
//     ioHook.on('keyup', (event) => {
//       this.callback({
//         key: this.mapKeyCode(event.keycode),
//         type: 'up',
//         timestamp: Date.now(),
//       });
//     });
//
//     ioHook.on('mousedown', (event) => {
//       const button = this.mapMouseButton(event.button);
//       if (button) {
//         this.callback({
//           button,
//           type: 'down',
//           timestamp: Date.now(),
//         });
//       }
//     });
//
//     ioHook.on('mouseup', (event) => {
//       const button = this.mapMouseButton(event.button);
//       if (button) {
//         this.callback({
//           button,
//           type: 'up',
//           timestamp: Date.now(),
//         });
//       }
//     });
//
//     ioHook.start();
//     console.log('🎧 Global Input Listener started (iohook)');
//   }
//
//   private mapKeyCode(keycode: number): string {
//     // Map keycodes to key names
//     const keyMap: Record<number, string> = {
//       30: 'A', 48: 'B', 46: 'C', 32: 'D', 18: 'E',
//       33: 'F', 34: 'G', 35: 'H', 23: 'I', 36: 'J',
//       37: 'K', 38: 'L', 50: 'M', 49: 'N', 24: 'O',
//       25: 'P', 16: 'Q', 19: 'R', 31: 'S', 20: 'T',
//       22: 'U', 47: 'V', 17: 'W', 45: 'X', 21: 'Y',
//       44: 'Z',
//       2: '1', 3: '2', 4: '3', 5: '4', 6: '5', 7: '6',
//       8: '7', 9: '8', 10: '9', 11: '0',
//     };
//     return keyMap[keycode] || `KEY_${keycode}`;
//   }
//
//   private mapMouseButton(button: number): 'LEFT_CLICK' | 'RIGHT_CLICK' | 'MIDDLE_CLICK' | null {
//     switch (button) {
//       case 1: return 'LEFT_CLICK';
//       case 2: return 'RIGHT_CLICK';
//       case 3: return 'MIDDLE_CLICK';
//       default: return null;
//     }
//   }
//
//   stop(): void {
//     ioHook.stop();
//     this.isListening = false;
//     console.log('🛑 Global Input Listener stopped');
//   }
// }
