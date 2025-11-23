import { MacroBinding, MacroStep, InputKey } from "../../../macro-shared/schema";
import { getAbilityById } from "../../../macro-shared/abilities";

// ============================================================================
// MACRO EXECUTOR
// Executes macro sequences with high-precision timing (ms-accurate)
// Per-key FIFO queues prevent interference
// ============================================================================

type ExecutionStep = {
  ability: string;
  pressCount: number;
  pressIndex: number; // Which press we're on (0 to pressCount-1)
  pressInterval: number;
  waitAfter: number;
  targetModifier: string;
  nextPressTime: number; // When to execute next press
  completed: boolean;
};

type MacroExecution = {
  inputKey: InputKey;
  binding: MacroBinding;
  steps: ExecutionStep[];
  currentStepIndex: number;
  startTime: number;
  cancelled: boolean;
};

export type MacroExecutionEvent = {
  type: "started" | "step" | "completed" | "cancelled";
  inputKey: InputKey;
  bindingId: string;
  step?: MacroStep;
  output?: string; // The actual key/command being sent
};

export class MacroExecutor {
  private executionQueues: Map<InputKey, MacroExecution[]> = new Map();
  private animationFrameId: number | null = null;
  private onOutput: (event: MacroExecutionEvent) => void;
  private isRunning: boolean = false;

  constructor(onOutput: (event: MacroExecutionEvent) => void) {
    this.onOutput = onOutput;
    this.initializeQueues();
  }

  private initializeQueues() {
    const allKeys: InputKey[] = [
      "W", "A", "S", "D",
      "B", "I", "T", "C", "H", "Y", "U", "P",
      "1", "2", "3", "4", "5", "6",
      "LEFT_CLICK", "RIGHT_CLICK",
    ];

    allKeys.forEach(key => {
      this.executionQueues.set(key, []);
    });
  }

  // Start executing a macro binding
  execute(binding: MacroBinding) {
    const queue = this.executionQueues.get(binding.inputKey);
    if (!queue) return;

    // Create execution steps from binding
    const steps: ExecutionStep[] = binding.sequence.map(step => ({
      ability: step.ability,
      pressCount: step.pressCount,
      pressIndex: 0,
      pressInterval: step.pressInterval,
      waitAfter: step.waitAfter,
      targetModifier: step.targetModifier,
      nextPressTime: performance.now(),
      completed: false,
    }));

    const execution: MacroExecution = {
      inputKey: binding.inputKey,
      binding,
      steps,
      currentStepIndex: 0,
      startTime: performance.now(),
      cancelled: false,
    };

    queue.push(execution);

    this.onOutput({
      type: "started",
      inputKey: binding.inputKey,
      bindingId: binding.id,
    });

    // Start execution loop if not already running
    if (!this.isRunning) {
      this.start();
    }
  }

  // Cancel all pending macros for a specific key
  cancel(inputKey: InputKey) {
    const queue = this.executionQueues.get(inputKey);
    if (!queue) return;

    queue.forEach(execution => {
      if (!execution.cancelled) {
        execution.cancelled = true;
        this.onOutput({
          type: "cancelled",
          inputKey: execution.inputKey,
          bindingId: execution.binding.id,
        });
      }
    });

    // Clear queue
    this.executionQueues.set(inputKey, []);
  }

  // Main execution loop using requestAnimationFrame for precision
  private start() {
    this.isRunning = true;
    this.tick();
  }

  private tick() {
    const now = performance.now();
    let hasActiveExecutions = false;

    // Process all queues
    this.executionQueues.forEach((queue, inputKey) => {
      if (queue.length === 0) return;

      const execution = queue[0]; // FIFO - process first in queue
      if (execution.cancelled) {
        queue.shift(); // Remove cancelled execution
        return;
      }

      hasActiveExecutions = true;

      // Get current step
      const step = execution.steps[execution.currentStepIndex];
      if (!step || step.completed) {
        // Move to next step
        execution.currentStepIndex++;
        
        if (execution.currentStepIndex >= execution.steps.length) {
          // Macro completed
          this.onOutput({
            type: "completed",
            inputKey: execution.inputKey,
            bindingId: execution.binding.id,
          });
          queue.shift(); // Remove completed execution
        }
        return;
      }

      // Check if it's time to execute next press
      if (now >= step.nextPressTime) {
        // Execute the press
        const ability = getAbilityById(step.ability);
        const output = this.formatOutput(step, ability?.displayName || step.ability);
        
        this.onOutput({
          type: "step",
          inputKey: execution.inputKey,
          bindingId: execution.binding.id,
          step: execution.binding.sequence[execution.currentStepIndex],
          output,
        });

        // Update step state
        step.pressIndex++;
        
        if (step.pressIndex >= step.pressCount) {
          // All presses done, mark step completed and wait
          step.completed = true;
          step.nextPressTime = now + step.waitAfter;
        } else {
          // Schedule next press
          step.nextPressTime = now + step.pressInterval;
        }
      }
    });

    // Continue loop if there are active executions
    if (hasActiveExecutions) {
      this.animationFrameId = requestAnimationFrame(() => this.tick());
    } else {
      this.stop();
    }
  }

  private formatOutput(step: ExecutionStep, abilityName: string): string {
    let output = abilityName;
    
    if (step.targetModifier && step.targetModifier !== "none") {
      output = `${step.targetModifier} → ${output}`;
    }
    
    if (step.pressCount > 1) {
      output = `${output} (${step.pressIndex + 1}/${step.pressCount})`;
    }
    
    return output;
  }

  private stop() {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  // Get current execution state for debugging
  getExecutionState(inputKey: InputKey) {
    const queue = this.executionQueues.get(inputKey);
    if (!queue || queue.length === 0) return null;

    const execution = queue[0];
    return {
      bindingId: execution.binding.id,
      currentStep: execution.currentStepIndex,
      totalSteps: execution.steps.length,
      elapsedTime: performance.now() - execution.startTime,
    };
  }

  // Clear all queues and stop
  reset() {
    this.executionQueues.forEach((queue, key) => {
      queue.forEach(execution => {
        execution.cancelled = true;
      });
      this.executionQueues.set(key, []);
    });
    this.stop();
  }
}
