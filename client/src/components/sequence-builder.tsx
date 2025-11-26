import { useState, useCallback, useMemo } from "react";
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

function createDefaultStep(settings?: { defaultMinDelay?: number; defaultMaxDelay?: number; defaultEchoHits?: number }): SequenceStep {
  return {
    id: generateId(),
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
      updateMacro(macroId, {
        sequence: [...macro.sequence, createDefaultStep(macroProfile.gestureSettings)],
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

              {/* Timeline Visualization */}
              <div className="bg-muted/50 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-1 overflow-x-auto pb-2">
                  {selectedMacro.sequence.map((step, idx) => (
                    <div key={step.id} className="flex items-center">
                      {Array.from({ length: step.echoHits || 1 }).map((_, hitIdx) => (
                        <div key={hitIdx} className="flex items-center">
                          <div
                            className="px-3 py-2 bg-primary/10 border border-primary/20 rounded-md text-sm font-mono whitespace-nowrap"
                            data-testid={`timeline-step-${step.id}-${hitIdx}`}
                          >
                            {step.key}
                          </div>
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
                      <div className="flex-1 grid grid-cols-4 gap-4">
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
                  <div>Max repeats/key: {SEQUENCE_CONSTRAINTS.MAX_REPEATS_PER_KEY}</div>
                </div>
              </Card>
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
