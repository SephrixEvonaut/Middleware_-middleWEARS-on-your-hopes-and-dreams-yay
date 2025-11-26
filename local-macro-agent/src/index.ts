// ============================================================================
// SWTOR MACRO AGENT - Main Entry Point
// ============================================================================

import { GestureDetector } from './gestureDetector.js';
import { SequenceExecutor } from './sequenceExecutor.js';
import { InputListener, KeyEvent, MouseEvent } from './inputListener.js';
import { ProfileLoader, DEFAULT_GESTURE_SETTINGS } from './profileLoader.js';
import { MacroProfile, GestureEvent, MacroBinding } from './types.js';

class MacroAgent {
  private profile: MacroProfile | null = null;
  private gestureDetector: GestureDetector | null = null;
  private sequenceExecutor: SequenceExecutor;
  private inputListener: InputListener;
  private profileLoader: ProfileLoader;

  constructor() {
    this.profileLoader = new ProfileLoader('./profiles');

    // Create sequence executor with event logging
    this.sequenceExecutor = new SequenceExecutor((event) => {
      // Log execution events
      if (event.type === 'started') {
        console.log(`⚡ Started: ${event.bindingName}`);
      } else if (event.type === 'completed') {
        console.log(`✅ Completed: ${event.bindingName}`);
      } else if (event.type === 'error') {
        console.error(`❌ Error: ${event.bindingName} - ${event.error}`);
      }
    });

    // Create input listener
    this.inputListener = new InputListener((event) => {
      this.handleInputEvent(event);
    });
  }

  /**
   * Handle raw input events
   */
  private handleInputEvent(event: KeyEvent | MouseEvent): void {
    if (!this.gestureDetector) return;

    if ('key' in event) {
      // Keyboard event
      if (event.type === 'down') {
        this.gestureDetector.handleKeyDown(event.key);
      } else {
        this.gestureDetector.handleKeyUp(event.key);
      }
    } else {
      // Mouse event
      if (event.type === 'down') {
        this.gestureDetector.handleMouseDown(event.button);
      } else {
        this.gestureDetector.handleMouseUp(event.button);
      }
    }
  }

  /**
   * Handle detected gestures
   */
  private handleGesture(event: GestureEvent): void {
    if (!this.profile) return;

    console.log(`\n🎯 Gesture: ${event.inputKey} → ${event.gesture}`);

    // Find matching macro binding
    const binding = this.profile.macros.find(
      m => m.trigger.key === event.inputKey &&
           m.trigger.gesture === event.gesture &&
           m.enabled
    );

    if (binding) {
      console.log(`   Matched: "${binding.name}"`);
      this.sequenceExecutor.execute(binding);
    } else {
      console.log(`   No macro bound`);
    }
  }

  /**
   * Load a profile
   */
  loadProfile(filename: string): boolean {
    const profile = this.profileLoader.loadProfile(filename);
    
    if (!profile) {
      return false;
    }

    this.profile = profile;

    // Create gesture detector with profile settings
    this.gestureDetector = new GestureDetector(
      profile.gestureSettings || DEFAULT_GESTURE_SETTINGS,
      (event) => this.handleGesture(event)
    );

    return true;
  }

  /**
   * Start the macro agent
   */
  start(): void {
    console.log('\n╔════════════════════════════════════════════════════╗');
    console.log('║       SWTOR MACRO AGENT - Per-Key Gestures         ║');
    console.log('╚════════════════════════════════════════════════════╝\n');

    // List available profiles
    const profiles = this.profileLoader.listProfiles();
    
    if (profiles.length === 0) {
      console.log('⚠️  No profiles found in ./profiles/');
      console.log('   Creating example profile...\n');
      
      // Profile will be created from the example.json we already have
      if (!this.loadProfile('example.json')) {
        console.error('❌ Failed to load profile');
        return;
      }
    } else {
      console.log(`📂 Available profiles: ${profiles.join(', ')}`);
      
      // Load first profile
      if (!this.loadProfile(profiles[0])) {
        console.error('❌ Failed to load profile');
        return;
      }
    }

    // Show loaded macros
    if (this.profile) {
      console.log(`\n📋 Loaded macros:`);
      for (const macro of this.profile.macros) {
        if (macro.enabled) {
          console.log(`   • ${macro.trigger.key} (${macro.trigger.gesture}) → "${macro.name}"`);
        }
      }
    }

    // Show constraints reminder
    console.log('\n📏 Sequence Constraints:');
    console.log('   • Min delay: 25ms');
    console.log('   • Variance: ≥4ms (max - min)');
    console.log('   • Max unique keys: 4 per sequence');
    console.log('   • Max repeats: 6 per key');

    // Start listening
    console.log('\n─────────────────────────────────────────────────────');
    this.inputListener.start();
  }

  /**
   * Stop the macro agent
   */
  stop(): void {
    this.inputListener.stop();
    this.sequenceExecutor.cancelAll();
    console.log('🛑 Macro Agent stopped');
  }

  /**
   * Run a dry test of a specific binding
   */
  async testBinding(name: string): Promise<void> {
    if (!this.profile) {
      console.error('❌ No profile loaded');
      return;
    }

    const binding = this.profile.macros.find(m => m.name === name);
    if (!binding) {
      console.error(`❌ Binding "${name}" not found`);
      return;
    }

    await this.sequenceExecutor.dryRun(binding);
  }
}

// ============================================================================
// MAIN
// ============================================================================

const agent = new MacroAgent();

// Handle graceful shutdown
process.on('SIGINT', () => {
  agent.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  agent.stop();
  process.exit(0);
});

// Start the agent
agent.start();
