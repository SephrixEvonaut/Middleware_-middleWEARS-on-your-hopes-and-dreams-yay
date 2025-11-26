import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Plus,
  Trash2,
  Copy,
  Download,
  Play,
  Pause,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  Clock,
  Keyboard,
  Zap,
  Settings,
  GripVertical,
  Wand2,
  BarChart3,
  ListOrdered,
} from "lucide-react";
import {
  type MacroBinding,
  type SequenceStep,
  type MacroGestureType,
  type MacroTriggerKey,
  type MacroGestureSettings,
  type MacroProfile,
  SEQUENCE_CONSTRAINTS,
  MACRO_TRIGGER_KEYS,
  validateSequence,
} from "@shared/schema";

// Gesture type labels
const GESTURE_LABELS: Record<MacroGestureType, string> = {
  single: "Single Press",
  long: "Long Press (80-140ms)",
  double: "Double Tap",
  double_long: "Double + Hold",
  triple: "Triple Tap",
  triple_long: "Triple + Hold",
  quadruple_long: "Quad + Hold",
  super_long: "Super Long (300ms+)",
  cancel: "Cancel (3s hold)",
};

// Available output keys
const OUTPUT_KEYS = [
  // Letters
  "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m",
  "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z",
  // Function keys
  "f1", "f2", "f3", "f4", "f5", "f6", "f7", "f8", "f9", "f10", "f11", "f12",
  // Special
  "space", "enter", "tab", "escape", "backspace",
  // Numpad
  "num0", "num1", "num2", "num3", "num4", "num5", "num6", "num7", "num8", "num9",
];

interface SequenceBuilderProps {
  macroProfile: MacroProfile;
  onUpdate: (profile: MacroProfile) => void;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

// Color palette for different keys in the graph
const KEY_COLORS = [
  { bg: "rgba(59, 130, 246, 0.3)", border: "rgb(59, 130, 246)", text: "#3b82f6" },   // blue
  { bg: "rgba(16, 185, 129, 0.3)", border: "rgb(16, 185, 129)", text: "#10b981" },   // green
  { bg: "rgba(245, 158, 11, 0.3)", border: "rgb(245, 158, 11)", text: "#f59e0b" },   // amber
  { bg: "rgba(239, 68, 68, 0.3)", border: "rgb(239, 68, 68)", text: "#ef4444" },     // red
  { bg: "rgba(168, 85, 247, 0.3)", border: "rgb(168, 85, 247)", text: "#a855f7" },   // purple
  { bg: "rgba(236, 72, 153, 0.3)", border: "rgb(236, 72, 153)", text: "#ec4899" },   // pink
];

interface TimingGraphProps {
  sequence: SequenceStep[];
  macroName: string;
}

// Timing visualization graph showing input trajectories and pop-off times
function TimingGraph({ sequence, macroName }: TimingGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  
  // Calculate expanded steps with timing
  const graphData = useMemo(() => {
    const expanded: Array<{
      key: string;
      name: string;
      stepIndex: number;
      echoIndex: number;
      minStart: number;
      maxStart: number;
      minEnd: number;
      maxEnd: number;
      color: typeof KEY_COLORS[0];
    }> = [];
    
    let currentMinTime = 0;
    let currentMaxTime = 0;
    
    // Assign colors to unique keys
    const keyColorMap = new Map<string, typeof KEY_COLORS[0]>();
    let colorIndex = 0;
    
    for (let stepIdx = 0; stepIdx < sequence.length; stepIdx++) {
      const step = sequence[stepIdx];
      const echoHits = step.echoHits || 1;
      
      if (!keyColorMap.has(step.key)) {
        keyColorMap.set(step.key, KEY_COLORS[colorIndex % KEY_COLORS.length]);
        colorIndex++;
      }
      
      const color = keyColorMap.get(step.key)!;
      
      for (let echoIdx = 0; echoIdx < echoHits; echoIdx++) {
        const isLastStep = stepIdx === sequence.length - 1 && echoIdx === echoHits - 1;
        
        expanded.push({
          key: step.key,
          name: step.name || `Step ${stepIdx + 1}`,
          stepIndex: stepIdx,
          echoIndex: echoIdx,
          minStart: currentMinTime,
          maxStart: currentMaxTime,
          minEnd: isLastStep ? currentMinTime : currentMinTime + step.minDelay,
          maxEnd: isLastStep ? currentMaxTime : currentMaxTime + step.maxDelay,
          color,
        });
        
        if (!isLastStep) {
          currentMinTime += step.minDelay;
          currentMaxTime += step.maxDelay;
        }
      }
    }
    
    return {
      steps: expanded,
      totalMinTime: currentMinTime,
      totalMaxTime: currentMaxTime,
      keyColorMap,
    };
  }, [sequence]);
  
  // Draw the graph
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || dimensions.width === 0) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Set canvas size
    const dpr = window.devicePixelRatio || 1;
    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;
    canvas.style.width = `${dimensions.width}px`;
    canvas.style.height = `${dimensions.height}px`;
    
    // Reset transform before scaling to prevent cumulative scaling
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    
    const width = dimensions.width;
    const height = dimensions.height;
    const padding = { top: 40, right: 20, bottom: 50, left: 80 };
    const graphWidth = width - padding.left - padding.right;
    const graphHeight = height - padding.top - padding.bottom;
    
    // Clear canvas
    ctx.fillStyle = "transparent";
    ctx.fillRect(0, 0, width, height);
    
    const { steps, totalMaxTime, keyColorMap } = graphData;
    if (steps.length === 0) return;
    
    // Draw title
    ctx.fillStyle = "hsl(var(--foreground))";
    ctx.font = "bold 14px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`Timing Preview: ${macroName}`, width / 2, 20);
    
    // Time scale
    const maxTime = Math.max(totalMaxTime + 20, 100);
    const timeScale = graphWidth / maxTime;
    
    // Draw grid lines
    ctx.strokeStyle = "hsl(var(--border))";
    ctx.lineWidth = 1;
    
    // Vertical grid lines (time markers)
    const timeStep = maxTime > 500 ? 100 : maxTime > 200 ? 50 : 25;
    for (let t = 0; t <= maxTime; t += timeStep) {
      const x = padding.left + t * timeScale;
      ctx.beginPath();
      ctx.moveTo(x, padding.top);
      ctx.lineTo(x, height - padding.bottom);
      ctx.stroke();
      
      // Time label
      ctx.fillStyle = "hsl(var(--muted-foreground))";
      ctx.font = "11px JetBrains Mono, monospace";
      ctx.textAlign = "center";
      ctx.fillText(`${t}ms`, x, height - padding.bottom + 20);
    }
    
    // X-axis label
    ctx.fillStyle = "hsl(var(--foreground))";
    ctx.font = "12px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Time (ms)", width / 2, height - 10);
    
    // Get unique keys for y-axis
    const uniqueKeys = Array.from(keyColorMap.keys());
    const keyHeight = graphHeight / Math.max(uniqueKeys.length, 1);
    
    // Draw horizontal grid lines and key labels
    uniqueKeys.forEach((key, idx) => {
      const y = padding.top + idx * keyHeight + keyHeight / 2;
      
      // Horizontal line
      ctx.strokeStyle = "hsl(var(--border))";
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Key label
      const color = keyColorMap.get(key)!;
      ctx.fillStyle = color.text;
      ctx.font = "bold 12px JetBrains Mono, monospace";
      ctx.textAlign = "right";
      ctx.fillText(key.toUpperCase(), padding.left - 10, y + 4);
    });
    
    // Draw each step as a bar with variance
    steps.forEach((step, idx) => {
      const keyIdx = uniqueKeys.indexOf(step.key);
      const y = padding.top + keyIdx * keyHeight + keyHeight / 2;
      const barHeight = Math.min(keyHeight * 0.6, 24);
      
      // Calculate x positions
      const xMinStart = padding.left + step.minStart * timeScale;
      const xMaxStart = padding.left + step.maxStart * timeScale;
      const xMinEnd = padding.left + step.minEnd * timeScale;
      const xMaxEnd = padding.left + step.maxEnd * timeScale;
      
      // Draw variance range (lighter background)
      ctx.fillStyle = step.color.bg;
      ctx.fillRect(xMinStart, y - barHeight / 2, xMaxEnd - xMinStart, barHeight);
      
      // Draw core timing bar (from minStart to minEnd)
      ctx.fillStyle = step.color.border;
      ctx.globalAlpha = 0.8;
      ctx.fillRect(xMinStart, y - barHeight / 2, Math.max(xMinEnd - xMinStart, 4), barHeight);
      ctx.globalAlpha = 1;
      
      // Draw keypress marker (pop-off point)
      ctx.beginPath();
      ctx.arc(xMinStart + 2, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = step.color.border;
      ctx.fill();
      ctx.strokeStyle = "white";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      
      // Draw step label above first echo of each step
      if (step.echoIndex === 0) {
        ctx.fillStyle = "hsl(var(--foreground))";
        ctx.font = "10px Inter, system-ui, sans-serif";
        ctx.textAlign = "left";
        const label = step.name + (step.echoIndex > 0 ? ` [${step.echoIndex + 1}]` : "");
        ctx.fillText(label, xMinStart, y - barHeight / 2 - 4);
      }
      
      // Draw echo hit number if > 1
      if ((sequence[step.stepIndex].echoHits || 1) > 1) {
        ctx.fillStyle = "hsl(var(--background))";
        ctx.font = "bold 9px JetBrains Mono, monospace";
        ctx.textAlign = "center";
        ctx.fillText(`${step.echoIndex + 1}`, xMinStart + 2, y + 3);
      }
    });
    
    // Draw legend
    const legendY = padding.top - 25;
    let legendX = padding.left;
    ctx.font = "11px Inter, system-ui, sans-serif";
    
    // Min timing
    ctx.fillStyle = "hsl(var(--foreground))";
    ctx.fillRect(legendX, legendY - 4, 12, 8);
    ctx.globalAlpha = 0.8;
    ctx.fillRect(legendX, legendY - 4, 12, 8);
    ctx.globalAlpha = 1;
    ctx.textAlign = "left";
    ctx.fillText("Min timing", legendX + 16, legendY + 3);
    
    // Max variance
    legendX += 100;
    ctx.fillStyle = "rgba(100, 100, 100, 0.3)";
    ctx.fillRect(legendX, legendY - 4, 12, 8);
    ctx.fillStyle = "hsl(var(--foreground))";
    ctx.fillText("Max variance", legendX + 16, legendY + 3);
    
    // Pop-off point
    legendX += 110;
    ctx.beginPath();
    ctx.arc(legendX + 4, legendY, 4, 0, Math.PI * 2);
    ctx.fillStyle = "hsl(var(--primary))";
    ctx.fill();
    ctx.fillStyle = "hsl(var(--foreground))";
    ctx.fillText("Keypress", legendX + 14, legendY + 3);
    
  }, [graphData, macroName, dimensions]);
  
  // Resize observer to trigger canvas redraw when container size changes
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        const { width, height } = entry.contentRect;
        setDimensions({ width, height });
      }
    });
    
    resizeObserver.observe(container);
    // Initial dimensions
    const rect = container.getBoundingClientRect();
    setDimensions({ width: rect.width, height: rect.height });
    
    return () => resizeObserver.disconnect();
  }, []);
  
  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span className="font-mono">
            {graphData.totalMinTime}-{graphData.totalMaxTime}ms total
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-muted-foreground" />
          <span>{graphData.steps.length} keypresses</span>
        </div>
        <div className="flex items-center gap-2">
          <Keyboard className="w-4 h-4 text-muted-foreground" />
          <span>{graphData.keyColorMap.size} unique keys</span>
        </div>
      </div>
      
      {/* Key legend */}
      <div className="flex flex-wrap gap-3">
        {Array.from(graphData.keyColorMap.entries()).map(([key, color]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div 
              className="w-3 h-3 rounded-sm border"
              style={{ backgroundColor: color.bg, borderColor: color.border }}
            />
            <span className="text-xs font-mono font-medium" style={{ color: color.text }}>
              {key.toUpperCase()}
            </span>
          </div>
        ))}
      </div>
      
      {/* Canvas graph */}
      <div 
        ref={containerRef} 
        className="relative bg-card rounded-lg border h-64"
        data-testid="timing-graph-container"
      >
        <canvas 
          ref={canvasRef}
          className="absolute inset-0"
          data-testid="timing-graph-canvas"
        />
        {sequence.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            Add steps to visualize timing
          </div>
        )}
      </div>
      
      {/* Timing breakdown table */}
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-3 py-2 text-left font-medium">#</th>
              <th className="px-3 py-2 text-left font-medium">Name</th>
              <th className="px-3 py-2 text-left font-medium">Key</th>
              <th className="px-3 py-2 text-left font-medium">Echoes</th>
              <th className="px-3 py-2 text-left font-medium">Pop-off Range</th>
              <th className="px-3 py-2 text-left font-medium">Delay</th>
            </tr>
          </thead>
          <tbody>
            {sequence.map((step, idx) => {
              // Calculate cumulative timing
              let minTime = 0;
              let maxTime = 0;
              for (let i = 0; i < idx; i++) {
                const s = sequence[i];
                const hits = s.echoHits || 1;
                minTime += s.minDelay * hits;
                maxTime += s.maxDelay * hits;
              }
              
              const color = graphData.keyColorMap.get(step.key);
              
              return (
                <tr key={step.id} className="border-t" data-testid={`timing-row-${step.id}`}>
                  <td className="px-3 py-2 font-mono text-muted-foreground">{idx + 1}</td>
                  <td className="px-3 py-2">
                    {step.name || <span className="text-muted-foreground italic">Unnamed</span>}
                  </td>
                  <td className="px-3 py-2">
                    <span 
                      className="font-mono font-medium px-1.5 py-0.5 rounded"
                      style={{ 
                        backgroundColor: color?.bg, 
                        color: color?.text,
                        border: `1px solid ${color?.border}`
                      }}
                    >
                      {step.key.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-mono">{step.echoHits || 1}x</td>
                  <td className="px-3 py-2 font-mono text-muted-foreground">
                    {minTime}-{maxTime}ms
                  </td>
                  <td className="px-3 py-2 font-mono">
                    {step.minDelay}-{step.maxDelay}ms
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function createDefaultStep(settings?: { defaultMinDelay?: number; defaultMaxDelay?: number; defaultEchoHits?: number }, stepNumber?: number): SequenceStep {
  return {
    id: generateId(),
    name: stepNumber ? `Step ${stepNumber}` : undefined,
    key: "a",
    minDelay: settings?.defaultMinDelay ?? 30,
    maxDelay: settings?.defaultMaxDelay ?? 40,
    echoHits: settings?.defaultEchoHits ?? 1,
  };
}

function createDefaultBinding(): MacroBinding {
  return {
    id: generateId(),
    name: "New Macro",
    description: "",
    trigger: {
      key: "1",
      gesture: "double",
    },
    sequence: [createDefaultStep()],
    enabled: true,
  };
}

export function SequenceBuilder({ macroProfile, onUpdate }: SequenceBuilderProps) {
  const { toast } = useToast();
  const [selectedMacroId, setSelectedMacroId] = useState<string | null>(
    macroProfile.macros[0]?.id ?? null
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Update global settings
  const updateSettings = useCallback(
    (updates: Partial<typeof macroProfile.gestureSettings>) => {
      onUpdate({
        ...macroProfile,
        gestureSettings: { ...macroProfile.gestureSettings, ...updates },
      });
    },
    [macroProfile, onUpdate]
  );

  const selectedMacro = useMemo(
    () => macroProfile.macros.find((m) => m.id === selectedMacroId) ?? null,
    [macroProfile.macros, selectedMacroId]
  );

  // Update a specific macro
  const updateMacro = useCallback(
    (macroId: string, updates: Partial<MacroBinding>) => {
      const newMacros = macroProfile.macros.map((m) =>
        m.id === macroId ? { ...m, ...updates } : m
      );
      onUpdate({ ...macroProfile, macros: newMacros });
    },
    [macroProfile, onUpdate]
  );

  // Add new macro
  const addMacro = useCallback(() => {
    const newMacro = createDefaultBinding();
    onUpdate({
      ...macroProfile,
      macros: [...macroProfile.macros, newMacro],
    });
    setSelectedMacroId(newMacro.id);
    toast({ title: "Macro created", description: "Configure your new macro sequence." });
  }, [macroProfile, onUpdate, toast]);

  // Delete macro
  const deleteMacro = useCallback(
    (macroId: string) => {
      const newMacros = macroProfile.macros.filter((m) => m.id !== macroId);
      onUpdate({ ...macroProfile, macros: newMacros });
      if (selectedMacroId === macroId) {
        setSelectedMacroId(newMacros[0]?.id ?? null);
      }
      toast({ title: "Macro deleted" });
    },
    [macroProfile, onUpdate, selectedMacroId, toast]
  );

  // Duplicate macro
  const duplicateMacro = useCallback(
    (macroId: string) => {
      const macro = macroProfile.macros.find((m) => m.id === macroId);
      if (!macro) return;
      const newMacro: MacroBinding = {
        ...macro,
        id: generateId(),
        name: `${macro.name} (Copy)`,
        sequence: macro.sequence.map((s) => ({ ...s, id: generateId() })),
      };
      onUpdate({
        ...macroProfile,
        macros: [...macroProfile.macros, newMacro],
      });
      setSelectedMacroId(newMacro.id);
      toast({ title: "Macro duplicated" });
    },
    [macroProfile, onUpdate, toast]
  );

  // Update sequence step
  const updateStep = useCallback(
    (macroId: string, stepId: string, updates: Partial<SequenceStep>) => {
      const macro = macroProfile.macros.find((m) => m.id === macroId);
      if (!macro) return;
      const newSequence = macro.sequence.map((s) =>
        s.id === stepId ? { ...s, ...updates } : s
      );
      updateMacro(macroId, { sequence: newSequence });
    },
    [macroProfile.macros, updateMacro]
  );

  // Add step to sequence (using global defaults)
  const addStep = useCallback(
    (macroId: string) => {
      const macro = macroProfile.macros.find((m) => m.id === macroId);
      if (!macro) return;
      const nextStepNumber = macro.sequence.length + 1;
      updateMacro(macroId, {
        sequence: [...macro.sequence, createDefaultStep(macroProfile.gestureSettings, nextStepNumber)],
      });
    },
    [macroProfile.macros, macroProfile.gestureSettings, updateMacro]
  );

  // Remove step from sequence
  const removeStep = useCallback(
    (macroId: string, stepId: string) => {
      const macro = macroProfile.macros.find((m) => m.id === macroId);
      if (!macro || macro.sequence.length <= 1) return;
      updateMacro(macroId, {
        sequence: macro.sequence.filter((s) => s.id !== stepId),
      });
    },
    [macroProfile.macros, updateMacro]
  );

  // Move step up/down
  const moveStep = useCallback(
    (macroId: string, stepId: string, direction: "up" | "down") => {
      const macro = macroProfile.macros.find((m) => m.id === macroId);
      if (!macro) return;
      const idx = macro.sequence.findIndex((s) => s.id === stepId);
      if (idx === -1) return;
      const newIdx = direction === "up" ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= macro.sequence.length) return;
      const newSequence = [...macro.sequence];
      [newSequence[idx], newSequence[newIdx]] = [newSequence[newIdx], newSequence[idx]];
      updateMacro(macroId, { sequence: newSequence });
    },
    [macroProfile.macros, updateMacro]
  );

  // Check if any macros have validation errors
  const hasAnyErrors = useMemo(() => {
    return macroProfile.macros.some((m) => !validateSequence(m.sequence).valid);
  }, [macroProfile.macros]);

  // Apply defaults to all steps in selected macro
  const applyDefaultsToAll = useCallback(() => {
    if (!selectedMacroId) return;
    const macro = macroProfile.macros.find((m) => m.id === selectedMacroId);
    if (!macro) return;
    
    const { defaultMinDelay, defaultMaxDelay, defaultEchoHits } = macroProfile.gestureSettings;
    const newSequence = macro.sequence.map((step) => ({
      ...step,
      minDelay: defaultMinDelay,
      maxDelay: defaultMaxDelay,
      echoHits: defaultEchoHits,
    }));
    
    updateMacro(selectedMacroId, { sequence: newSequence });
    toast({ title: "Defaults applied", description: "All steps updated with global timing settings." });
  }, [selectedMacroId, macroProfile, updateMacro, toast]);

  // Export to JSON (only if all macros are valid)
  const exportProfile = useCallback(() => {
    // Validate all macros before export
    const invalidMacros = macroProfile.macros.filter((m) => !validateSequence(m.sequence).valid);
    if (invalidMacros.length > 0) {
      toast({
        title: "Cannot export",
        description: `${invalidMacros.length} macro(s) have validation errors. Fix them first.`,
        variant: "destructive",
      });
      return;
    }

    const exportData = {
      name: macroProfile.name,
      description: macroProfile.description,
      gestureSettings: {
        multiPressWindow: macroProfile.gestureSettings.multiPressWindow,
        debounceDelay: macroProfile.gestureSettings.debounceDelay,
        longPressMin: macroProfile.gestureSettings.longPressMin,
        longPressMax: macroProfile.gestureSettings.longPressMax,
        superLongMin: macroProfile.gestureSettings.superLongMin,
        superLongMax: macroProfile.gestureSettings.superLongMax,
        cancelThreshold: macroProfile.gestureSettings.cancelThreshold,
      },
      macros: macroProfile.macros.map((m) => ({
        name: m.name,
        trigger: m.trigger,
        sequence: m.sequence.flatMap((step) => {
          // Expand echo hits into separate steps
          const steps = [];
          for (let i = 0; i < (step.echoHits || 1); i++) {
            steps.push({
              key: step.key,
              name: step.name,  // Include step name for debugging
              minDelay: step.minDelay,
              maxDelay: step.maxDelay,
            });
          }
          return steps;
        }),
        enabled: m.enabled,
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${macroProfile.name.replace(/\s+/g, "-").toLowerCase()}-macros.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Profile exported", description: "Copy to local-macro-agent/profiles/" });
  }, [macroProfile, toast]);

  // Validation for selected macro
  const validation = useMemo(() => {
    if (!selectedMacro) return { valid: true, errors: [] };
    return validateSequence(selectedMacro.sequence);
  }, [selectedMacro]);

  // Calculate timing stats
  const timingStats = useMemo(() => {
    if (!selectedMacro) return null;
    let minTotal = 0;
    let maxTotal = 0;
    let totalSteps = 0;

    for (const step of selectedMacro.sequence) {
      const hits = step.echoHits || 1;
      totalSteps += hits;
      for (let i = 0; i < hits; i++) {
        minTotal += step.minDelay;
        maxTotal += step.maxDelay;
      }
    }

    // Subtract last step delay (no delay after final keypress)
    if (selectedMacro.sequence.length > 0) {
      const lastStep = selectedMacro.sequence[selectedMacro.sequence.length - 1];
      minTotal -= lastStep.minDelay;
      maxTotal -= lastStep.maxDelay;
    }

    return { minTotal, maxTotal, totalSteps };
  }, [selectedMacro]);

  // Count unique keys
  const uniqueKeyCount = useMemo(() => {
    if (!selectedMacro) return 0;
    return new Set(selectedMacro.sequence.map((s) => s.key)).size;
  }, [selectedMacro]);

  return (
    <div className="flex gap-6 h-full" data-testid="sequence-builder">
      {/* Macro List */}
      <Card className="w-80 flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-lg">Macros</CardTitle>
            <Button size="sm" onClick={addMacro} data-testid="button-add-macro">
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>
          <CardDescription>
            {macroProfile.macros.length} macro{macroProfile.macros.length !== 1 ? "s" : ""} configured
          </CardDescription>
        </CardHeader>
        <Separator />
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-2">
            {macroProfile.macros.map((macro) => {
              const macroValidation = validateSequence(macro.sequence);
              return (
                <div
                  key={macro.id}
                  className={`p-3 rounded-lg cursor-pointer border transition-colors ${
                    selectedMacroId === macro.id
                      ? "border-primary bg-primary/5"
                      : "border-transparent hover-elevate"
                  }`}
                  onClick={() => setSelectedMacroId(macro.id)}
                  data-testid={`macro-item-${macro.id}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {!macro.enabled && (
                        <Badge variant="outline" className="text-xs shrink-0">OFF</Badge>
                      )}
                      <span className="font-medium truncate">{macro.name}</span>
                    </div>
                    {!macroValidation.valid && (
                      <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <Badge variant="secondary" className="text-xs">{macro.trigger.key}</Badge>
                    <span>{GESTURE_LABELS[macro.trigger.gesture]}</span>
                  </div>
                </div>
              );
            })}
            {macroProfile.macros.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Keyboard className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No macros yet</p>
                <p className="text-xs">Click "Add" to create one</p>
              </div>
            )}
          </div>
        </ScrollArea>
        <Separator />
        <div className="p-3">
          <Button
            variant="outline"
            className="w-full"
            onClick={exportProfile}
            disabled={hasAnyErrors || macroProfile.macros.length === 0}
            data-testid="button-export-macros"
          >
            <Download className="w-4 h-4 mr-2" />
            Export for Local Agent
          </Button>
          {hasAnyErrors && (
            <p className="text-xs text-destructive mt-2 text-center">
              Fix validation errors before exporting
            </p>
          )}
        </div>
      </Card>

      {/* Macro Editor */}
      {selectedMacro ? (
        <Card className="flex-1 flex flex-col overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <Input
                  value={selectedMacro.name}
                  onChange={(e) => updateMacro(selectedMacro.id, { name: e.target.value })}
                  className="text-lg font-semibold h-auto py-1 px-2 border-transparent hover:border-border focus:border-primary"
                  data-testid="input-macro-name"
                />
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Switch
                  checked={selectedMacro.enabled}
                  onCheckedChange={(enabled) => updateMacro(selectedMacro.id, { enabled })}
                  data-testid="switch-macro-enabled"
                />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => duplicateMacro(selectedMacro.id)}
                      data-testid="button-duplicate-macro"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Duplicate</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMacro(selectedMacro.id)}
                      data-testid="button-delete-macro"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Delete</TooltipContent>
                </Tooltip>
              </div>
            </div>

            {/* Trigger Configuration */}
            <div className="flex items-center gap-4 mt-4">
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground mb-1 block">Trigger Key</Label>
                <Select
                  value={selectedMacro.trigger.key}
                  onValueChange={(key) =>
                    updateMacro(selectedMacro.id, {
                      trigger: { ...selectedMacro.trigger, key: key as MacroTriggerKey },
                    })
                  }
                >
                  <SelectTrigger data-testid="select-trigger-key">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MACRO_TRIGGER_KEYS.map((key) => (
                      <SelectItem key={key} value={key}>
                        {key}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground mb-1 block">Gesture</Label>
                <Select
                  value={selectedMacro.trigger.gesture}
                  onValueChange={(gesture) =>
                    updateMacro(selectedMacro.id, {
                      trigger: { ...selectedMacro.trigger, gesture: gesture as MacroGestureType },
                    })
                  }
                >
                  <SelectTrigger data-testid="select-trigger-gesture">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(GESTURE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>

          <Separator />

          {/* Stats & Validation */}
          <div className="px-6 py-3 bg-muted/30 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">
                  {timingStats ? `${timingStats.minTotal}-${timingStats.maxTotal}ms` : "0ms"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">
                  {timingStats?.totalSteps || 0} step{(timingStats?.totalSteps || 0) !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Keyboard className="w-4 h-4 text-muted-foreground" />
                <span className={`text-sm ${uniqueKeyCount > SEQUENCE_CONSTRAINTS.MAX_UNIQUE_KEYS ? "text-destructive" : ""}`}>
                  {uniqueKeyCount}/{SEQUENCE_CONSTRAINTS.MAX_UNIQUE_KEYS} keys
                </span>
              </div>
            </div>
            {validation.valid ? (
              <Badge variant="outline" className="text-green-600 border-green-600">
                <CheckCircle className="w-3 h-3 mr-1" />
                Valid
              </Badge>
            ) : (
              <Tooltip>
                <TooltipTrigger>
                  <Badge variant="destructive">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    {validation.errors.length} error{validation.errors.length !== 1 ? "s" : ""}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-sm">
                  <ul className="text-xs space-y-1">
                    {validation.errors.map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                </TooltipContent>
              </Tooltip>
            )}
          </div>

          <Separator />

          {/* Sequence Steps */}
          <ScrollArea className="flex-1">
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Sequence Steps</h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addStep(selectedMacro.id)}
                  data-testid="button-add-step"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Step
                </Button>
              </div>

              {/* View Tabs: List vs Graph */}
              <Tabs defaultValue="list" className="w-full">
                <div className="flex items-center justify-between mb-4">
                  <TabsList>
                    <TabsTrigger value="list" data-testid="tab-list-view">
                      <ListOrdered className="w-4 h-4 mr-2" />
                      Step Editor
                    </TabsTrigger>
                    <TabsTrigger value="graph" data-testid="tab-graph-view">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Timing Graph
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="graph" className="mt-0">
                  <TimingGraph 
                    sequence={selectedMacro.sequence} 
                    macroName={selectedMacro.name}
                  />
                </TabsContent>

                <TabsContent value="list" className="mt-0 space-y-4">
                  {/* Inline Timeline Visualization */}
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="flex items-center gap-1 overflow-x-auto pb-2">
                      {selectedMacro.sequence.map((step, idx) => (
                        <div key={step.id} className="flex items-center">
                          {Array.from({ length: step.echoHits || 1 }).map((_, hitIdx) => (
                            <div key={hitIdx} className="flex items-center">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div
                                    className="px-3 py-2 bg-primary/10 border border-primary/20 rounded-md text-sm font-mono whitespace-nowrap cursor-default"
                                    data-testid={`timeline-step-${step.id}-${hitIdx}`}
                                  >
                                    <div className="text-center">{step.key}</div>
                                    {step.name && (
                                      <div className="text-[9px] text-muted-foreground truncate max-w-16">
                                        {step.name}
                                      </div>
                                    )}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <div className="text-xs">
                                    <div className="font-medium">{step.name || `Step ${idx + 1}`}</div>
                                    <div className="text-muted-foreground">
                                      {step.key} • Echo {hitIdx + 1}/{step.echoHits || 1}
                                    </div>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                              {(idx < selectedMacro.sequence.length - 1 || hitIdx < (step.echoHits || 1) - 1) && (
                                <div className="flex items-center px-1">
                                  <div className="w-6 h-0.5 bg-muted-foreground/30" />
                                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                    {step.minDelay}-{step.maxDelay}ms
                                  </span>
                                  <div className="w-6 h-0.5 bg-muted-foreground/30" />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Step Editors */}
                  <div className="space-y-3">
                    {selectedMacro.sequence.map((step, idx) => (
                      <Card key={step.id} className="p-4" data-testid={`step-editor-${step.id}`}>
                        <div className="flex items-start gap-4">
                          {/* Reorder Controls */}
                          <div className="flex flex-col gap-1 pt-6">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => moveStep(selectedMacro.id, step.id, "up")}
                              disabled={idx === 0}
                              data-testid={`button-move-up-${step.id}`}
                            >
                              <ChevronUp className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => moveStep(selectedMacro.id, step.id, "down")}
                              disabled={idx === selectedMacro.sequence.length - 1}
                              data-testid={`button-move-down-${step.id}`}
                            >
                              <ChevronDown className="w-4 h-4" />
                            </Button>
                          </div>

                          {/* Step Number */}
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium shrink-0 mt-6">
                            {idx + 1}
                          </div>

                          {/* Step Configuration */}
                          <div className="flex-1 space-y-3">
                            {/* Step Name */}
                            <div>
                              <Label className="text-xs text-muted-foreground">Step Name</Label>
                              <Input
                                value={step.name || ""}
                                onChange={(e) => updateStep(selectedMacro.id, step.id, { name: e.target.value })}
                                placeholder={`Step ${idx + 1}`}
                                className="mt-1"
                                data-testid={`input-step-name-${step.id}`}
                              />
                            </div>
                            
                            <div className="grid grid-cols-4 gap-4">
                              {/* Key Selection */}
                              <div>
                                <Label className="text-xs text-muted-foreground">Key</Label>
                                <Select
                                  value={step.key}
                                  onValueChange={(key) => updateStep(selectedMacro.id, step.id, { key })}
                                >
                                  <SelectTrigger className="mt-1" data-testid={`select-step-key-${step.id}`}>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {OUTPUT_KEYS.map((key) => (
                                      <SelectItem key={key} value={key}>
                                        {key}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              {/* Echo Hits (Repetitions) */}
                              <div>
                                <Label className="text-xs text-muted-foreground">
                                  Echo Hits
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <span className="ml-1 text-muted-foreground/60">(?)</span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      Repeat this key press multiple times
                                    </TooltipContent>
                                  </Tooltip>
                                </Label>
                                <div className="flex items-center gap-2 mt-1">
                                  <Slider
                                    value={[step.echoHits || 1]}
                                    onValueChange={([v]) => updateStep(selectedMacro.id, step.id, { echoHits: v })}
                                    min={1}
                                    max={SEQUENCE_CONSTRAINTS.MAX_REPEATS_PER_KEY}
                                    step={1}
                                    className="flex-1"
                                    data-testid={`slider-echo-hits-${step.id}`}
                                  />
                                  <span className="w-6 text-center text-sm font-mono">
                                    {step.echoHits || 1}x
                                  </span>
                                </div>
                              </div>

                              {/* Min Delay */}
                              <div>
                                <Label className="text-xs text-muted-foreground">
                                  Min Delay (ms)
                                </Label>
                                <div className="flex items-center gap-2 mt-1">
                                  <Input
                                    type="number"
                                    value={step.minDelay}
                                    onChange={(e) => {
                                      const val = parseInt(e.target.value) || SEQUENCE_CONSTRAINTS.MIN_DELAY;
                                      updateStep(selectedMacro.id, step.id, {
                                        minDelay: Math.max(SEQUENCE_CONSTRAINTS.MIN_DELAY, val),
                                        maxDelay: Math.max(val + SEQUENCE_CONSTRAINTS.MIN_VARIANCE, step.maxDelay),
                                      });
                                    }}
                                    min={SEQUENCE_CONSTRAINTS.MIN_DELAY}
                                    className="font-mono"
                                    data-testid={`input-min-delay-${step.id}`}
                                  />
                                </div>
                              </div>

                              {/* Max Delay */}
                              <div>
                                <Label className="text-xs text-muted-foreground">
                                  Max Delay (ms)
                                </Label>
                                <div className="flex items-center gap-2 mt-1">
                                  <Input
                                    type="number"
                                    value={step.maxDelay}
                                    onChange={(e) => {
                                      const val = parseInt(e.target.value) || step.minDelay + SEQUENCE_CONSTRAINTS.MIN_VARIANCE;
                                      updateStep(selectedMacro.id, step.id, {
                                        maxDelay: Math.max(step.minDelay + SEQUENCE_CONSTRAINTS.MIN_VARIANCE, val),
                                      });
                                    }}
                                    min={step.minDelay + SEQUENCE_CONSTRAINTS.MIN_VARIANCE}
                                    className="font-mono"
                                    data-testid={`input-max-delay-${step.id}`}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Delete Button */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="mt-6 text-muted-foreground hover:text-destructive"
                            onClick={() => removeStep(selectedMacro.id, step.id)}
                            disabled={selectedMacro.sequence.length <= 1}
                            data-testid={`button-delete-step-${step.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        {/* Timing Range Visualization */}
                        <div className="mt-3 ml-16">
                          <div className="h-2 bg-muted rounded-full overflow-hidden relative">
                            <div
                              className="absolute h-full bg-primary/30"
                              style={{
                                left: "0%",
                                width: `${(step.maxDelay / 200) * 100}%`,
                              }}
                            />
                            <div
                              className="absolute h-full bg-primary"
                              style={{
                                left: "0%",
                                width: `${(step.minDelay / 200) * 100}%`,
                              }}
                            />
                          </div>
                          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                            <span>{step.minDelay}ms</span>
                            <span className="text-muted-foreground/60">
                              variance: {step.maxDelay - step.minDelay}ms
                            </span>
                            <span>{step.maxDelay}ms</span>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>

                  {/* Global Timing Defaults */}
                  <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
                    <Card className="p-4">
                      <CollapsibleTrigger className="flex items-center justify-between w-full">
                        <h4 className="text-sm font-medium flex items-center gap-2">
                          <Settings className="w-4 h-4" />
                          Global Timing Defaults
                        </h4>
                        <ChevronRight className={`w-4 h-4 transition-transform ${settingsOpen ? "rotate-90" : ""}`} />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pt-4">
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <Label className="text-xs text-muted-foreground">Default Min Delay (ms)</Label>
                            <Input
                              type="number"
                              value={macroProfile.gestureSettings.defaultMinDelay}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || SEQUENCE_CONSTRAINTS.MIN_DELAY;
                                updateSettings({
                                  defaultMinDelay: Math.max(SEQUENCE_CONSTRAINTS.MIN_DELAY, val),
                                  defaultMaxDelay: Math.max(val + SEQUENCE_CONSTRAINTS.MIN_VARIANCE, macroProfile.gestureSettings.defaultMaxDelay),
                                });
                              }}
                              min={SEQUENCE_CONSTRAINTS.MIN_DELAY}
                              className="mt-1 font-mono"
                              data-testid="input-default-min-delay"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Default Max Delay (ms)</Label>
                            <Input
                              type="number"
                              value={macroProfile.gestureSettings.defaultMaxDelay}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || macroProfile.gestureSettings.defaultMinDelay + SEQUENCE_CONSTRAINTS.MIN_VARIANCE;
                                updateSettings({
                                  defaultMaxDelay: Math.max(macroProfile.gestureSettings.defaultMinDelay + SEQUENCE_CONSTRAINTS.MIN_VARIANCE, val),
                                });
                              }}
                              min={macroProfile.gestureSettings.defaultMinDelay + SEQUENCE_CONSTRAINTS.MIN_VARIANCE}
                              className="mt-1 font-mono"
                              data-testid="input-default-max-delay"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Default Echo Hits</Label>
                            <div className="flex items-center gap-2 mt-1">
                              <Slider
                                value={[macroProfile.gestureSettings.defaultEchoHits]}
                                onValueChange={([v]) => updateSettings({ defaultEchoHits: v })}
                                min={1}
                                max={SEQUENCE_CONSTRAINTS.MAX_REPEATS_PER_KEY}
                                step={1}
                                className="flex-1"
                                data-testid="slider-default-echo-hits"
                              />
                              <span className="w-6 text-center text-sm font-mono">
                                {macroProfile.gestureSettings.defaultEchoHits}x
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 pt-4 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={applyDefaultsToAll}
                            disabled={!selectedMacro || selectedMacro.sequence.length === 0}
                            data-testid="button-apply-defaults"
                          >
                            <Wand2 className="w-4 h-4 mr-2" />
                            Apply to All Steps
                          </Button>
                          <p className="text-xs text-muted-foreground mt-2">
                            Applies current defaults to all steps in the selected macro
                          </p>
                        </div>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>

                  {/* Constraints Info */}
                  <Card className="p-4 bg-muted/30">
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      Sequence Constraints
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                      <div>Min delay: {SEQUENCE_CONSTRAINTS.MIN_DELAY}ms</div>
                      <div>Min variance: {SEQUENCE_CONSTRAINTS.MIN_VARIANCE}ms</div>
                      <div>Max unique keys: {SEQUENCE_CONSTRAINTS.MAX_UNIQUE_KEYS}</div>
                      <div>Max steps/key: {SEQUENCE_CONSTRAINTS.MAX_STEPS_PER_KEY}</div>
                      <div>Max echo hits: {SEQUENCE_CONSTRAINTS.MAX_ECHO_HITS}/step</div>
                    </div>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </ScrollArea>
        </Card>
      ) : (
        <Card className="flex-1 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <Keyboard className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">Select or create a macro</p>
            <p className="text-sm">Configure gesture-triggered key sequences</p>
          </div>
        </Card>
      )}
    </div>
  );
}
