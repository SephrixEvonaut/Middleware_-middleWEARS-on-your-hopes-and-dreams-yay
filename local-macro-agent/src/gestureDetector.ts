// ============================================================================
// GESTURE DETECTOR - Per-key gesture detection with 9 gesture types
// ============================================================================

import { 
  InputKey, 
  GestureType, 
  GestureSettings, 
  GestureEvent,
  INPUT_KEYS 
} from './types.js';

export type GestureCallback = (event: GestureEvent) => void;

interface PressRecord {
  timestamp: number;
  isLong: boolean;
}

// Per-key state machine for gesture detection
class KeyGestureStateMachine {
  private key: InputKey;
  private settings: GestureSettings;
  private callback: GestureCallback;
  
  private pressHistory: PressRecord[] = [];
  private keyDownTime: number | null = null;
  private gestureTimer: ReturnType<typeof setTimeout> | null = null;
  private longPressTimer: ReturnType<typeof setTimeout> | null = null;
  private cancelTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(key: InputKey, settings: GestureSettings, callback: GestureCallback) {
    this.key = key;
    this.settings = settings;
    this.callback = callback;
  }

  private clearTimers(): void {
    if (this.gestureTimer) {
      clearTimeout(this.gestureTimer);
      this.gestureTimer = null;
    }
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
    if (this.cancelTimer) {
      clearTimeout(this.cancelTimer);
      this.cancelTimer = null;
    }
  }

  private emitGesture(gesture: GestureType, holdDuration?: number): void {
    this.callback({
      inputKey: this.key,
      gesture,
      timestamp: Date.now(),
      holdDuration,
    });
    this.pressHistory = [];
  }

  private resolveGesture(): void {
    const count = this.pressHistory.length;
    const lastPress = this.pressHistory[count - 1];

    if (count === 0) return;

    let gesture: GestureType;

    if (count === 1) {
      gesture = lastPress.isLong ? 'long' : 'single';
    } else if (count === 2) {
      gesture = lastPress.isLong ? 'double_long' : 'double';
    } else if (count === 3) {
      gesture = lastPress.isLong ? 'triple_long' : 'triple';
    } else if (count >= 4) {
      gesture = 'quadruple_long'; // 4+ presses, last is long
    } else {
      gesture = 'single';
    }

    this.emitGesture(gesture);
  }

  handleKeyDown(): void {
    const now = Date.now();
    this.keyDownTime = now;

    // Clear existing timers
    this.clearTimers();

    // Start long press detection
    this.longPressTimer = setTimeout(() => {
      // Still holding - mark as long press
    }, this.settings.longPressMin);

    // Start super long detection
    const superLongTimer = setTimeout(() => {
      if (this.keyDownTime !== null) {
        const holdDuration = Date.now() - this.keyDownTime;
        if (holdDuration >= this.settings.superLongMin) {
          this.emitGesture('super_long', holdDuration);
          this.keyDownTime = null;
          this.clearTimers();
        }
      }
    }, this.settings.superLongMin);

    // Start cancel detection
    this.cancelTimer = setTimeout(() => {
      if (this.keyDownTime !== null) {
        const holdDuration = Date.now() - this.keyDownTime;
        this.emitGesture('cancel', holdDuration);
        this.keyDownTime = null;
        this.pressHistory = [];
        this.clearTimers();
      }
    }, this.settings.cancelThreshold);
  }

  handleKeyUp(): void {
    if (this.keyDownTime === null) return;

    const now = Date.now();
    const holdDuration = now - this.keyDownTime;
    this.keyDownTime = null;

    // Clear cancel timer
    if (this.cancelTimer) {
      clearTimeout(this.cancelTimer);
      this.cancelTimer = null;
    }

    // Check if this was a super long hold (already handled in keyDown timer)
    if (holdDuration >= this.settings.superLongMin) {
      return; // Already emitted
    }

    // Determine if this was a long press
    const isLong = holdDuration >= this.settings.longPressMin && 
                   holdDuration <= this.settings.longPressMax;

    // Check if this press is within multi-press window
    const lastPress = this.pressHistory[this.pressHistory.length - 1];
    const isWithinWindow = lastPress && 
                           (now - lastPress.timestamp) < this.settings.multiPressWindow;

    if (!isWithinWindow) {
      // Start fresh press sequence
      this.pressHistory = [];
    }

    // Record this press
    this.pressHistory.push({
      timestamp: now,
      isLong,
    });

    // Clear existing gesture timer
    if (this.gestureTimer) {
      clearTimeout(this.gestureTimer);
    }

    // Set timer to resolve gesture after multi-press window
    this.gestureTimer = setTimeout(() => {
      this.resolveGesture();
    }, this.settings.multiPressWindow);
  }

  reset(): void {
    this.clearTimers();
    this.pressHistory = [];
    this.keyDownTime = null;
  }
}

// Main gesture detector - manages all 22 key state machines
export class GestureDetector {
  private machines: Map<InputKey, KeyGestureStateMachine> = new Map();
  private callback: GestureCallback;
  private settings: GestureSettings;

  constructor(settings: GestureSettings, callback: GestureCallback) {
    this.settings = settings;
    this.callback = callback;

    // Create independent state machine for each input key
    for (const key of INPUT_KEYS) {
      this.machines.set(key, new KeyGestureStateMachine(key, settings, callback));
    }

    console.log(`🎯 GestureDetector initialized for ${INPUT_KEYS.length} keys`);
  }

  handleKeyDown(key: string): void {
    const upperKey = key.toUpperCase() as InputKey;
    const machine = this.machines.get(upperKey);
    if (machine) {
      machine.handleKeyDown();
    }
  }

  handleKeyUp(key: string): void {
    const upperKey = key.toUpperCase() as InputKey;
    const machine = this.machines.get(upperKey);
    if (machine) {
      machine.handleKeyUp();
    }
  }

  handleMouseDown(button: 'LEFT_CLICK' | 'RIGHT_CLICK' | 'MIDDLE_CLICK'): void {
    const machine = this.machines.get(button);
    if (machine) {
      machine.handleKeyDown();
    }
  }

  handleMouseUp(button: 'LEFT_CLICK' | 'RIGHT_CLICK' | 'MIDDLE_CLICK'): void {
    const machine = this.machines.get(button);
    if (machine) {
      machine.handleKeyUp();
    }
  }

  reset(): void {
    for (const machine of this.machines.values()) {
      machine.reset();
    }
  }

  updateSettings(settings: GestureSettings): void {
    this.settings = settings;
    // Recreate machines with new settings
    this.machines.clear();
    for (const key of INPUT_KEYS) {
      this.machines.set(key, new KeyGestureStateMachine(key, settings, this.callback));
    }
  }
}
