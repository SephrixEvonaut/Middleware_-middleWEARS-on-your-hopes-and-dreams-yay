import React from "react";
import { MacroProfile, InputKey, GestureType } from "../../../macro-shared/schema";
import { GestureEvent } from "../lib/perKeyGestureManager";

interface KeyDashboardProps {
  profile: MacroProfile | null;
  onSelectKey: (key: InputKey) => void;
  selectedKey: InputKey | null;
  recentGestures: GestureEvent[];
}

const ALL_KEYS: InputKey[] = [
  "W", "A", "S", "D",
  "B", "I", "T", "C", "H", "Y", "U", "P",
  "1", "2", "3", "4", "5", "6",
  "LEFT_CLICK", "RIGHT_CLICK",
];

const GESTURE_LABELS: Record<GestureType, string> = {
  single: "Single",
  long: "Long",
  double: "Double",
  double_long: "Dbl+Long",
  triple: "Triple",
  triple_long: "Tri+Long",
  quadruple_long: "Quad+Long",
  super_long: "SuperLong",
  cancel: "Cancel",
};

export function KeyDashboard({ profile, onSelectKey, selectedKey, recentGestures }: KeyDashboardProps) {
  const getBindingCount = (key: InputKey): number => {
    if (!profile) return 0;
    return profile.macroBindings.filter(b => b.inputKey === key && b.enabled).length;
  };

  const getRecentGestureForKey = (key: InputKey): GestureEvent | null => {
    return recentGestures.find(g => g.inputKey === key) || null;
  };

  return (
    <div className="bg-card rounded-lg border p-6">
      <h2 className="text-2xl font-bold mb-4">Key Dashboard</h2>
      <p className="text-sm text-muted-foreground mb-4">
        22 independent keys • 9 gestures each • Click to configure
      </p>

      <div className="grid grid-cols-4 gap-2">
        {ALL_KEYS.map(key => {
          const bindingCount = getBindingCount(key);
          const recentGesture = getRecentGestureForKey(key);
          const isSelected = key === selectedKey;

          return (
            <button
              key={key}
              onClick={() => onSelectKey(key)}
              className={`
                relative p-3 rounded-lg border-2 transition-all
                ${isSelected 
                  ? "border-primary bg-primary/10" 
                  : "border-border hover:border-primary/50 hover:bg-accent"
                }
                ${recentGesture ? "ring-2 ring-green-500 animate-pulse" : ""}
              `}
            >
              <div className="font-mono font-bold text-lg">{key}</div>
              {bindingCount > 0 && (
                <div className="absolute top-1 right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {bindingCount}
                </div>
              )}
              {recentGesture && (
                <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                  {GESTURE_LABELS[recentGesture.gesture]}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Recent Gestures */}
      <div className="mt-6">
        <h3 className="text-sm font-semibold mb-2">Recent Gestures</h3>
        <div className="max-h-32 overflow-y-auto space-y-1 text-sm font-mono">
          {recentGestures.slice(0, 10).map((g, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="font-bold">{g.inputKey}</span>
              <span className="text-muted-foreground">→</span>
              <span className="text-primary">{GESTURE_LABELS[g.gesture]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
