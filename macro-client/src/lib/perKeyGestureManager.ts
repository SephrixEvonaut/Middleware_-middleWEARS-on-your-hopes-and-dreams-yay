import { GestureType, GestureSettings, InputKey } from "../../../macro-shared/schema";

// ============================================================================
// PER-KEY GESTURE STATE MACHINE
// Each of the 22 input keys gets its own isolated state machine
// ============================================================================

export type GestureEvent = {
  inputKey: InputKey;
  gesture: GestureType;
  timestamp: number;
};

type PressEvent = {
  timestamp: number;
  released: boolean;
};

class KeyGestureStateMachine {
  private inputKey: InputKey;
  private settings: GestureSettings;
  private pressHistory: PressEvent[] = [];
  private pressStartTime: number | null = null;
  private multiPressTimer: NodeJS.Timeout | null = null;
  private longPressTimer: NodeJS.Timeout | null = null;
  private superLongTimer: NodeJS.Timeout | null = null;
  private cancelTimer: NodeJS.Timeout | null = null;
  private onGesture: (event: GestureEvent) => void;
  private debounceTimer: NodeJS.Timeout | null = null;
  private lastReleaseTime: number = 0;

  constructor(
    inputKey: InputKey,
    settings: GestureSettings,
    onGesture: (event: GestureEvent) => void
  ) {
    this.inputKey = inputKey;
    this.settings = settings;
    this.onGesture = onGesture;
  }

  private clearAllTimers() {
    if (this.multiPressTimer) {
      clearTimeout(this.multiPressTimer);
      this.multiPressTimer = null;
    }
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
    if (this.superLongTimer) {
      clearTimeout(this.superLongTimer);
      this.superLongTimer = null;
    }
    if (this.cancelTimer) {
      clearTimeout(this.cancelTimer);
      this.cancelTimer = null;
    }
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }

  private emitGesture(gesture: GestureType) {
    this.onGesture({
      inputKey: this.inputKey,
      gesture,
      timestamp: Date.now(),
    });
    this.reset();
  }

  private reset() {
    this.clearAllTimers();
    this.pressHistory = [];
    this.pressStartTime = null;
  }

  private evaluateGesture() {
    const pressCount = this.pressHistory.length;
    const lastPress = this.pressHistory[pressCount - 1];
    
    if (!lastPress) return;

    const pressDuration = lastPress.released 
      ? (this.pressHistory[pressCount - 1].timestamp - (this.pressStartTime || 0))
      : 0;

    const isLongPress = pressDuration >= this.settings.longPressMin && 
                        pressDuration <= this.settings.longPressMax;

    // Determine gesture type based on press count and long press status
    if (pressCount === 1) {
      this.emitGesture("single");
    } else if (pressCount === 2) {
      if (isLongPress) {
        this.emitGesture("double_long");
      } else {
        this.emitGesture("double");
      }
    } else if (pressCount === 3) {
      if (isLongPress) {
        this.emitGesture("triple_long");
      } else {
        this.emitGesture("triple");
      }
    } else if (pressCount === 4) {
      if (isLongPress) {
        this.emitGesture("quadruple_long");
      } else {
        // Just emit triple if 4th wasn't long
        this.emitGesture("triple");
      }
    }
  }

  handleKeyDown() {
    const now = Date.now();

    // Debounce: ignore if too soon after last release
    if (now - this.lastReleaseTime < this.settings.debounceDelay) {
      return;
    }

    // If this is a new press sequence
    if (this.pressHistory.length === 0 || this.multiPressTimer === null) {
      this.pressStartTime = now;
    }

    // Clear existing timers for new press
    this.clearAllTimers();

    // Start long press detection
    this.longPressTimer = setTimeout(() => {
      // Standard long press detected (80-140ms)
      this.emitGesture("long");
    }, this.settings.longPressMax);

    // Start super long press detection (300-2000ms)
    this.superLongTimer = setTimeout(() => {
      this.emitGesture("super_long");
    }, this.settings.superLongMax);

    // Start cancel detection (>3000ms)
    this.cancelTimer = setTimeout(() => {
      this.emitGesture("cancel");
    }, this.settings.cancelThreshold);
  }

  handleKeyUp() {
    const now = Date.now();
    this.lastReleaseTime = now;

    // Clear long press timers since key was released
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
    if (this.superLongTimer) {
      clearTimeout(this.superLongTimer);
      this.superLongTimer = null;
    }
    if (this.cancelTimer) {
      clearTimeout(this.cancelTimer);
      this.cancelTimer = null;
    }

    // Record this press
    this.pressHistory.push({
      timestamp: now,
      released: true,
    });

    // Start multi-press window timer
    if (this.multiPressTimer) {
      clearTimeout(this.multiPressTimer);
    }

    this.multiPressTimer = setTimeout(() => {
      // Multi-press window expired, evaluate gesture
      this.evaluateGesture();
    }, this.settings.multiPressWindow);
  }

  // For testing/debugging
  getState() {
    return {
      inputKey: this.inputKey,
      pressCount: this.pressHistory.length,
      isWaitingForRelease: this.pressStartTime !== null,
      hasActiveTimer: this.multiPressTimer !== null,
    };
  }
}

// ============================================================================
// GLOBAL GESTURE MANAGER
// Manages all 22 independent state machines
// ============================================================================

export class PerKeyGestureManager {
  private stateMachines: Map<InputKey, KeyGestureStateMachine> = new Map();
  private settings: GestureSettings;
  private onGesture: (event: GestureEvent) => void;
  private keyDownStates: Map<InputKey, boolean> = new Map();

  constructor(
    settings: GestureSettings,
    onGesture: (event: GestureEvent) => void
  ) {
    this.settings = settings;
    this.onGesture = onGesture;
    this.initializeStateMachines();
  }

  private initializeStateMachines() {
    const allKeys: InputKey[] = [
      "W", "A", "S", "D",
      "B", "I", "T", "C", "H", "Y", "U", "P",
      "1", "2", "3", "4", "5", "6",
      "LEFT_CLICK", "RIGHT_CLICK",
    ];

    allKeys.forEach(key => {
      this.stateMachines.set(
        key,
        new KeyGestureStateMachine(key, this.settings, this.onGesture)
      );
      this.keyDownStates.set(key, false);
    });
  }

  updateSettings(settings: GestureSettings) {
    this.settings = settings;
    // Reinitialize all state machines with new settings
    this.initializeStateMachines();
  }

  handleKeyDown(inputKey: InputKey) {
    // Prevent repeat events from held keys
    if (this.keyDownStates.get(inputKey)) {
      return;
    }

    this.keyDownStates.set(inputKey, true);
    const machine = this.stateMachines.get(inputKey);
    if (machine) {
      machine.handleKeyDown();
    }
  }

  handleKeyUp(inputKey: InputKey) {
    this.keyDownStates.set(inputKey, false);
    const machine = this.stateMachines.get(inputKey);
    if (machine) {
      machine.handleKeyUp();
    }
  }

  // For mouse clicks
  handleMouseDown(button: "LEFT_CLICK" | "RIGHT_CLICK") {
    this.handleKeyDown(button);
  }

  handleMouseUp(button: "LEFT_CLICK" | "RIGHT_CLICK") {
    this.handleKeyUp(button);
  }

  // Get state of specific key for debugging
  getKeyState(inputKey: InputKey) {
    const machine = this.stateMachines.get(inputKey);
    return machine?.getState();
  }

  // Get all states for debugging
  getAllStates() {
    const states: Record<string, any> = {};
    this.stateMachines.forEach((machine, key) => {
      states[key] = machine.getState();
    });
    return states;
  }
}
