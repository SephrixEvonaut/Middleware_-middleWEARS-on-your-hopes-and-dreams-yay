import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Activity, RotateCcw, Bug, AlertTriangle } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import type { GestureSettings } from "@shared/schema";
import { GestureManager, type KeyTimelineState } from "@/lib/gestureManager";
import { useModifierContext } from "@/contexts/ModifierContext";

interface GestureSimulatorProps {
  settings: GestureSettings;
  onSettingsChange?: (settings: GestureSettings) => void;
}

export function GestureSimulator({ settings }: GestureSimulatorProps) {
  const [debugMode, setDebugMode] = useState(false);
  const [activeKeys, setActiveKeys] = useState<Map<string, KeyTimelineState>>(new Map());
  const [lastGesture, setLastGesture] = useState<{ key: string; gesture: string; modifiers: string } | null>(null);
  const [rightClickHoldStart, setRightClickHoldStart] = useState<number | null>(null);
  
  // Practice statistics - per gesture type (aggregate across all keys)
  const [gestureStats, setGestureStats] = useState<Record<string, { attempts: number; successes: number }>>({});
  
  const gestureManagerRef = useRef<GestureManager | null>(null);
  const { modifierState } = useModifierContext();
  
  // Get modifier hash for GestureManager keys
  const getModifierHash = (): string => {
    const { ctrl, shift, alt } = modifierState;
    if (!ctrl && !shift && !alt) return "normal";
    const parts = [];
    if (ctrl) parts.push("ctrl");
    if (shift) parts.push("shift");
    if (alt) parts.push("alt");
    return parts.join("+");
  };
  
  // Initialize GestureManager
  useEffect(() => {
    const manager = new GestureManager(
      // onGestureDetected callback
      (key: string, gesture: string, modifiers: string) => {
        console.log(`✅ Gesture detected: ${key} → ${gesture} (${modifiers})`);
        setLastGesture({ key, gesture, modifiers });
        
        // Update success statistics
        setGestureStats(prev => {
          const current = prev[gesture] || { attempts: 0, successes: 0 };
          return {
            ...prev,
            [gesture]: {
              ...current,
              successes: current.successes + 1,
            },
          };
        });
        
        // Clear last gesture after 2 seconds
        setTimeout(() => {
          setLastGesture(null);
        }, 2000);
      },
      // onStateUpdate callback
      () => {
        // Refresh active keys display
        if (gestureManagerRef.current) {
          setActiveKeys(new Map(gestureManagerRef.current.getAllStates()));
        }
      },
      // onGestureAttempt callback
      (key: string, gesture: string, modifiers: string) => {
        // Track attempt (every press counts as an attempt)
        setGestureStats(prev => {
          const current = prev[gesture] || { attempts: 0, successes: 0 };
          return {
            ...prev,
            [gesture]: {
              ...current,
              attempts: current.attempts + 1,
            },
          };
        });
      }
    );
    
    gestureManagerRef.current = manager;
    
    return () => {
      manager.dispose();
    };
  }, []);
  
  // Keyboard event handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return; // Ignore key repeat
      
      const manager = gestureManagerRef.current;
      if (!manager) return;
      
      const modHash = getModifierHash();
      manager.startPress(e.code, modHash);
      
      if (debugMode) {
        console.log(`[KeyDown] ${e.code} (${modHash})`);
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      const manager = gestureManagerRef.current;
      if (!manager) return;
      
      const modHash = getModifierHash();
      manager.endPress(e.code, modHash);
      
      if (debugMode) {
        console.log(`[KeyUp] ${e.code} (${modHash})`);
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [debugMode, modifierState]);
  
  // Right-click emergency cancel
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 2) { // Right button
        setRightClickHoldStart(Date.now());
      }
    };
    
    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 2 && rightClickHoldStart !== null) {
        const holdDuration = Date.now() - rightClickHoldStart;
        setRightClickHoldStart(null);
        
        const manager = gestureManagerRef.current;
        if (manager && manager.checkEmergencyCancel(holdDuration)) {
          console.log(`🚨 EMERGENCY CANCEL - Right click held ${holdDuration}ms`);
          manager.handleEmergencyCancel();
          setActiveKeys(new Map());
          setLastGesture(null);
        }
      }
    };
    
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault(); // Prevent context menu
    };
    
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("contextmenu", handleContextMenu);
    
    return () => {
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [rightClickHoldStart]);
  
  const reset = () => {
    const manager = gestureManagerRef.current;
    if (manager) {
      manager.handleEmergencyCancel();
    }
    setActiveKeys(new Map());
    setLastGesture(null);
    setGestureStats({});
  };
  
  const getGestureColor = (gesture: string) => {
    const colorMap: Record<string, string> = {
      single_press: "bg-chart-1",
      double_press: "bg-chart-2",
      triple_press: "bg-chart-3",
      quadruple_press: "bg-chart-4",
      long_press: "bg-chart-5",
      super_long_press: "bg-violet-500",
    };
    return colorMap[gesture] || "bg-muted";
  };
  
  const formatDuration = (ms: number) => {
    return `${ms.toFixed(0)}ms`;
  };
  
  return (
    <Card data-testid="card-gesture-simulator">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle data-testid="text-gesture-simulator-title" className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Multi-Key Gesture Testing
            </CardTitle>
            <CardDescription data-testid="text-gesture-simulator-description">
              Press any keyboard keys to detect simultaneous gesture sequences
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Bug className="w-4 h-4 text-muted-foreground" />
              <Switch
                checked={debugMode}
                onCheckedChange={setDebugMode}
                data-testid="switch-debug-mode"
              />
            </div>
            <Button
              onClick={reset}
              variant="outline"
              size="sm"
              data-testid="button-reset"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Emergency Cancel Instructions */}
        <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
          <AlertTriangle className="w-4 h-4 text-destructive mt-0.5" />
          <div className="text-sm">
            <strong className="text-destructive">Emergency Cancel:</strong> Right-click and release in under 28ms to reset all active sequences
          </div>
        </div>
        
        {/* Timing Info */}
        <div className="p-3 bg-muted/50 rounded-md text-sm space-y-1">
          <div className="font-semibold">Dynamic Timing Windows</div>
          <ul className="text-xs text-muted-foreground space-y-0.5 pl-4">
            <li>• First tap: 80ms wait window</li>
            <li>• Each additional tap: +50ms to wait window</li>
            <li>• Long press: 90-180ms hold</li>
            <li>• Super long press: 180-250ms hold</li>
            <li>• &gt;250ms: Sequence canceled</li>
          </ul>
        </div>
        
        {/* Last Detected Gesture */}
        {lastGesture && (
          <div className="p-4 bg-primary/10 border border-primary/20 rounded-md">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Last Detected Gesture</div>
                <div className="text-lg font-semibold">
                  {lastGesture.key} → {lastGesture.gesture.replace(/_/g, " ").toUpperCase()}
                </div>
              </div>
              <Badge variant="outline" data-testid="badge-modifier-mode">
                {lastGesture.modifiers}
              </Badge>
            </div>
          </div>
        )}
        
        {/* Active Key Timelines */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Active Sequences ({activeKeys.size})</h3>
            {activeKeys.size === 0 && (
              <span className="text-xs text-muted-foreground">Press any key to start...</span>
            )}
          </div>
          
          {activeKeys.size > 0 && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {Array.from(activeKeys.values()).map((state) => (
                <div
                  key={`${state.modifierHash}|${state.keyCode}`}
                  className="p-3 bg-card border rounded-md"
                  data-testid={`active-key-${state.keyCode}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                        {state.keyCode}
                      </code>
                      <Badge variant="secondary" className="text-xs">
                        {state.modifierHash}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {state.phase}
                      </Badge>
                      {state.pressCount > 0 && (
                        <Badge className={getGestureColor(state.detectedGesture || "")} data-testid={`badge-press-count-${state.keyCode}`}>
                          {state.pressCount}x tap{state.pressCount > 1 ? "s" : ""}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {/* Wait Window Progress */}
                  {state.phase === "executing" && (
                    <div className="mt-2">
                      <div className="text-xs text-muted-foreground mb-1">
                        Wait window: {state.waitWindowMs}ms
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5">
                        <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: "100%" }} />
                      </div>
                    </div>
                  )}
                  
                  {/* Long Press Tier */}
                  {state.longPressTier !== "none" && (
                    <div className="mt-2">
                      <Badge variant="destructive" className="text-xs">
                        {state.longPressTier.replace(/_/g, " ").toUpperCase()}
                      </Badge>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Gesture Statistics */}
        {Object.keys(gestureStats).length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Session Statistics</h3>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(gestureStats).map(([gesture, stats]) => {
                const accuracy = stats.attempts > 0 
                  ? Math.round((stats.successes / stats.attempts) * 100) 
                  : 0;
                
                return (
                  <div
                    key={gesture}
                    className="p-2 bg-card border rounded-md"
                    data-testid={`stats-${gesture}`}
                  >
                    <div className="text-xs text-muted-foreground mb-1">
                      {gesture.replace(/_/g, " ")}
                    </div>
                    <div className="flex items-baseline gap-2">
                      <div className="text-lg font-semibold">
                        {stats.successes}/{stats.attempts}
                      </div>
                      <Badge 
                        variant={accuracy >= 80 ? "default" : accuracy >= 50 ? "secondary" : "destructive"}
                        className="text-xs"
                      >
                        {accuracy}%
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
