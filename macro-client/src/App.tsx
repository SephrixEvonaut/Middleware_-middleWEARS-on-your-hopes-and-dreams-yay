import React, { useState, useEffect } from "react";
import { PerKeyGestureManager, GestureEvent } from "./lib/perKeyGestureManager";
import { MacroExecutor, MacroExecutionEvent } from "./lib/macroExecutor";
import { MacroProfile, InputKey } from "../../macro-shared/schema";
import { KeyDashboard } from "./components/KeyDashboard";
import { MacroBuilder } from "./components/MacroBuilder";
import { ProfileManager } from "./components/ProfileManager";

export default function App() {
  const [currentProfile, setCurrentProfile] = useState<MacroProfile | null>(null);
  const [gestureManager, setGestureManager] = useState<PerKeyGestureManager | null>(null);
  const [macroExecutor, setMacroExecutor] = useState<MacroExecutor | null>(null);
  const [recentGestures, setRecentGestures] = useState<GestureEvent[]>([]);
  const [recentOutputs, setRecentOutputs] = useState<MacroExecutionEvent[]>([]);
  const [selectedKey, setSelectedKey] = useState<InputKey | null>(null);

  // Initialize managers when profile loads
  useEffect(() => {
    if (!currentProfile) return;

    // Gesture detection handler
    const handleGesture = (event: GestureEvent) => {
      console.log("Gesture detected:", event);
      setRecentGestures(prev => [event, ...prev].slice(0, 20));

      // Find matching binding
      const binding = currentProfile.macroBindings.find(
        b => b.inputKey === event.inputKey && 
             b.gestureType === event.gesture &&
             b.enabled
      );

      if (binding && executor) {
        executor.execute(binding);
      }
    };

    // Macro output handler
    const handleOutput = (event: MacroExecutionEvent) => {
      console.log("Macro output:", event);
      setRecentOutputs(prev => [event, ...prev].slice(0, 50));
    };

    const manager = new PerKeyGestureManager(
      currentProfile.gestureSettings,
      handleGesture
    );
    
    const executor = new MacroExecutor(handleOutput);

    setGestureManager(manager);
    setMacroExecutor(executor);

    // Keyboard event listeners
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase() as InputKey;
      manager.handleKeyDown(key);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase() as InputKey;
      manager.handleKeyUp(key);
    };

    // Mouse event listeners
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) manager.handleMouseDown("LEFT_CLICK");
      if (e.button === 2) manager.handleMouseDown("RIGHT_CLICK");
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) manager.handleMouseUp("LEFT_CLICK");
      if (e.button === 2) manager.handleMouseUp("RIGHT_CLICK");
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      executor.reset();
    };
  }, [currentProfile]);

  // Load default profile on mount
  useEffect(() => {
    fetch("/api/macro-profiles")
      .then(res => res.json())
      .then(profiles => {
        const defaultProfile = profiles.find((p: MacroProfile) => p.favorite) || profiles[0];
        setCurrentProfile(defaultProfile);
      })
      .catch(err => console.error("Failed to load profiles:", err));
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Macro Sequencer</h1>
        <p className="text-muted-foreground">
          Per-key gesture detection • SWTOR ability combos • 22 independent keys
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Profile & Settings */}
        <div className="lg:col-span-1">
          <ProfileManager
            currentProfile={currentProfile}
            onProfileChange={setCurrentProfile}
          />
        </div>

        {/* Center: Key Dashboard */}
        <div className="lg:col-span-1">
          <KeyDashboard
            profile={currentProfile}
            onSelectKey={setSelectedKey}
            selectedKey={selectedKey}
            recentGestures={recentGestures}
          />
        </div>

        {/* Right: Macro Builder */}
        <div className="lg:col-span-1">
          {selectedKey && currentProfile ? (
            <MacroBuilder
              inputKey={selectedKey}
              profile={currentProfile}
              onProfileUpdate={setCurrentProfile}
            />
          ) : (
            <div className="bg-card rounded-lg border p-6 text-center text-muted-foreground">
              <p>Select a key to configure macros</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom: Recent Outputs */}
      <div className="mt-6 bg-card rounded-lg border p-4">
        <h3 className="text-lg font-semibold mb-3">Recent Macro Outputs</h3>
        <div className="max-h-48 overflow-y-auto space-y-1 font-mono text-sm">
          {recentOutputs.length === 0 ? (
            <p className="text-muted-foreground">No macro outputs yet...</p>
          ) : (
            recentOutputs.map((output, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <span className="text-muted-foreground">{new Date(output.type === "started" ? Date.now() : Date.now()).toLocaleTimeString()}</span>
                <span className="font-semibold">{output.inputKey}</span>
                <span className="text-muted-foreground">→</span>
                <span>{output.output || output.type}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
