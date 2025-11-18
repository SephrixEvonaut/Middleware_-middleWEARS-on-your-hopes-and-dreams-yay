/**
 * GestureManager - Per-key gesture detection state machine
 * Supports simultaneous multi-key sequence tracking with dynamic timing windows
 */

export type GesturePhase = "idle" | "recording" | "executing" | "cooldown";

export type LongPressTier = "none" | "long" | "super_long" | "canceled";

export interface KeyGestureEvent {
  timestamp: number;
  type: "press" | "release";
  duration?: number;
}

export interface KeyTimelineState {
  // Identity
  keyCode: string;
  modifierHash: string;
  
  // Lifecycle
  phase: GesturePhase;
  
  // Press tracking
  pressCount: number;
  pressHistory: KeyGestureEvent[];
  
  // Timing windows
  waitWindowMs: number; // Dynamic: 80ms + (50ms * tapCount)
  pressStartTime: number | null;
  lastTapTime: number | null;
  
  // Long press tier
  longPressTier: LongPressTier;
  
  // Timers
  waitTimer: NodeJS.Timeout | null;
  longPressTimer: NodeJS.Timeout | null;
  
  // Result
  detectedGesture: string | null;
}

// Timing constants
const BASE_WAIT_MS = 80;
const INCREMENTAL_WAIT_MS = 50;
const LONG_PRESS_MIN = 90;
const SUPER_LONG_PRESS_MIN = 180;
const CANCEL_THRESHOLD_MS = 250;
const EMERGENCY_CANCEL_MS = 28;

export class GestureManager {
  private keyStates: Map<string, KeyTimelineState>;
  private onGestureDetected?: (key: string, gesture: string, modifiers: string) => void;
  private onGestureAttempt?: (key: string, gesture: string, modifiers: string) => void;
  private onStateUpdate?: () => void;
  
  constructor(
    onGestureDetected?: (key: string, gesture: string, modifiers: string) => void,
    onStateUpdate?: () => void,
    onGestureAttempt?: (key: string, gesture: string, modifiers: string) => void
  ) {
    this.keyStates = new Map();
    this.onGestureDetected = onGestureDetected;
    this.onStateUpdate = onStateUpdate;
    this.onGestureAttempt = onGestureAttempt;
  }
  
  /**
   * Get composite key for Map storage: "modifierHash|keyCode"
   */
  private getCompositeKey(keyCode: string, modifierHash: string): string {
    return `${modifierHash}|${keyCode}`;
  }
  
  /**
   * Initialize or retrieve key state
   */
  private getOrCreateState(keyCode: string, modifierHash: string): KeyTimelineState {
    const compositeKey = this.getCompositeKey(keyCode, modifierHash);
    
    if (!this.keyStates.has(compositeKey)) {
      this.keyStates.set(compositeKey, {
        keyCode,
        modifierHash,
        phase: "idle",
        pressCount: 0,
        pressHistory: [],
        waitWindowMs: BASE_WAIT_MS,
        pressStartTime: null,
        lastTapTime: null,
        longPressTier: "none",
        waitTimer: null,
        longPressTimer: null,
        detectedGesture: null,
      });
    }
    
    return this.keyStates.get(compositeKey)!;
  }
  
  /**
   * Clear all timers for a key state
   */
  private clearTimers(state: KeyTimelineState): void {
    if (state.waitTimer) {
      clearTimeout(state.waitTimer);
      state.waitTimer = null;
    }
    if (state.longPressTimer) {
      clearTimeout(state.longPressTimer);
      state.longPressTimer = null;
    }
  }
  
  /**
   * Reset a specific key's state and remove from map
   */
  private resetKeyState(state: KeyTimelineState): void {
    this.clearTimers(state);
    
    // Remove from map to prevent memory leak
    const compositeKey = this.getCompositeKey(state.keyCode, state.modifierHash);
    this.keyStates.delete(compositeKey);
  }
  
  /**
   * Handle key press start
   */
  startPress(keyCode: string, modifierHash: string = "normal"): void {
    const state = this.getOrCreateState(keyCode, modifierHash);
    const now = Date.now();
    
    // Clear ALL existing timers (new press interrupts everything)
    this.clearTimers(state);
    
    // Record press event
    state.pressHistory.push({
      timestamp: now,
      type: "press",
    });
    
    state.pressStartTime = now;
    state.phase = "recording";
    state.pressCount++;
    
    // Update wait window dynamically: 80ms + (50ms per tap)
    state.waitWindowMs = BASE_WAIT_MS + (INCREMENTAL_WAIT_MS * (state.pressCount - 1));
    
    console.log(`[GestureManager] ${keyCode} press #${state.pressCount} (${modifierHash}), wait window: ${state.waitWindowMs}ms`);
    
    // Start long press detection timer
    state.longPressTimer = setTimeout(() => {
      this.checkLongPressTier(state);
    }, LONG_PRESS_MIN);
    
    this.notifyStateUpdate();
  }
  
  /**
   * Check and update long press tier during hold
   */
  private checkLongPressTier(state: KeyTimelineState): void {
    if (!state.pressStartTime) return;
    
    const holdDuration = Date.now() - state.pressStartTime;
    
    if (holdDuration >= CANCEL_THRESHOLD_MS) {
      // Cancel entire sequence for this key - track as failed attempt
      console.log(`[GestureManager] ${state.keyCode} exceeded 250ms - canceling sequence`);
      
      // Track failed attempt (sequence was too long)
      if (this.onGestureAttempt && state.pressCount > 0) {
        const gesture = this.determineGesture(state);
        this.onGestureAttempt(state.keyCode, gesture, state.modifierHash);
      }
      
      this.resetKeyState(state);
      this.notifyStateUpdate();
      return;
    }
    
    if (holdDuration >= SUPER_LONG_PRESS_MIN) {
      state.longPressTier = "super_long";
      // Pause wait window - long press is ongoing
      this.notifyStateUpdate();
      
      // Schedule cancel check
      state.longPressTimer = setTimeout(() => {
        this.checkLongPressTier(state);
      }, CANCEL_THRESHOLD_MS - holdDuration);
      return;
    }
    
    if (holdDuration >= LONG_PRESS_MIN) {
      state.longPressTier = "long";
      // Pause wait window - long press is ongoing
      this.notifyStateUpdate();
      
      // Schedule super long check
      state.longPressTimer = setTimeout(() => {
        this.checkLongPressTier(state);
      }, SUPER_LONG_PRESS_MIN - holdDuration);
      return;
    }
  }
  
  /**
   * Handle key release
   */
  endPress(keyCode: string, modifierHash: string = "normal"): void {
    const compositeKey = this.getCompositeKey(keyCode, modifierHash);
    const state = this.keyStates.get(compositeKey);
    
    if (!state || !state.pressStartTime) {
      console.log(`[GestureManager] endPress ignored: ${keyCode} (${modifierHash}) - no active press`);
      return;
    }
    
    const now = Date.now();
    const holdDuration = now - state.pressStartTime;
    
    console.log(`[GestureManager] ${keyCode} release after ${holdDuration}ms, pressCount=${state.pressCount}`);
    
    // Clear long press timer
    if (state.longPressTimer) {
      clearTimeout(state.longPressTimer);
      state.longPressTimer = null;
    }
    
    // Record release event
    state.pressHistory.push({
      timestamp: now,
      type: "release",
      duration: holdDuration,
    });
    
    state.pressStartTime = null;
    state.lastTapTime = now;
    
    // Determine if this was a tap or long press
    if (holdDuration >= LONG_PRESS_MIN && holdDuration < CANCEL_THRESHOLD_MS) {
      // Long press detected - emit immediately
      const gesture = holdDuration >= SUPER_LONG_PRESS_MIN ? "super_long_press" : "long_press";
      
      console.log(`[GestureManager] Long press detected: ${gesture} (hold=${holdDuration}ms)`);
      
      // Track attempt
      if (this.onGestureAttempt) {
        this.onGestureAttempt(state.keyCode, gesture, state.modifierHash);
      }
      
      this.emitGesture(state, gesture);
      this.resetKeyState(state);
      this.notifyStateUpdate(); // Update UI after reset
      return;
    }
    
    // Short tap - start wait window
    console.log(`[GestureManager] Tap detected, starting ${state.waitWindowMs}ms wait window`);
    state.phase = "executing";
    state.waitTimer = setTimeout(() => {
      this.finalizeGesture(state);
    }, state.waitWindowMs);
    
    this.notifyStateUpdate();
  }
  
  /**
   * Finalize and emit gesture after wait window expires
   */
  private finalizeGesture(state: KeyTimelineState): void {
    const gesture = this.determineGesture(state);
    
    console.log(`[GestureManager] Finalizing: ${state.keyCode} → ${gesture} (pressCount=${state.pressCount})`);
    
    // Track attempt
    if (this.onGestureAttempt) {
      this.onGestureAttempt(state.keyCode, gesture, state.modifierHash);
    }
    
    this.emitGesture(state, gesture);
    this.resetKeyState(state);
    this.notifyStateUpdate();
  }
  
  /**
   * Determine gesture type from tap count
   */
  private determineGesture(state: KeyTimelineState): string {
    switch (state.pressCount) {
      case 1:
        return "single_press";
      case 2:
        return "double_press";
      case 3:
        return "triple_press";
      case 4:
        return "quadruple_press";
      default:
        return `${state.pressCount}_press`;
    }
  }
  
  /**
   * Emit detected gesture
   */
  private emitGesture(state: KeyTimelineState, gesture: string): void {
    console.log(`[GestureManager] Detected: ${state.keyCode} → ${gesture} (${state.modifierHash})`);
    state.detectedGesture = gesture;
    
    if (this.onGestureDetected) {
      this.onGestureDetected(state.keyCode, gesture, state.modifierHash);
    }
  }
  
  /**
   * Emergency cancel - right click held < 28ms
   */
  handleEmergencyCancel(): void {
    console.log("[GestureManager] EMERGENCY CANCEL - resetting all sequences");
    
    // Track all active sequences as failed attempts before clearing
    for (const state of Array.from(this.keyStates.values())) {
      if (state.pressCount > 0 && this.onGestureAttempt) {
        const gesture = this.determineGesture(state);
        this.onGestureAttempt(state.keyCode, gesture, state.modifierHash);
      }
      this.clearTimers(state);
    }
    
    this.keyStates.clear();
    this.notifyStateUpdate();
  }
  
  /**
   * Check if right click qualifies as emergency cancel
   */
  checkEmergencyCancel(holdDuration: number): boolean {
    return holdDuration < EMERGENCY_CANCEL_MS;
  }
  
  /**
   * Get all active key states (for visualization)
   */
  getAllStates(): Map<string, KeyTimelineState> {
    return new Map(this.keyStates);
  }
  
  /**
   * Get state for specific key
   */
  getKeyState(keyCode: string, modifierHash: string = "normal"): KeyTimelineState | undefined {
    const compositeKey = this.getCompositeKey(keyCode, modifierHash);
    return this.keyStates.get(compositeKey);
  }
  
  /**
   * Notify subscribers of state update
   */
  private notifyStateUpdate(): void {
    if (this.onStateUpdate) {
      this.onStateUpdate();
    }
  }
  
  /**
   * Cleanup all timers
   */
  dispose(): void {
    for (const state of Array.from(this.keyStates.values())) {
      this.clearTimers(state);
    }
    this.keyStates.clear();
  }
}
