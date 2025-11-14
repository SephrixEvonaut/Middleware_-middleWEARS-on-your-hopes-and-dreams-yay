import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Command, Keyboard } from "lucide-react";
import type { ModifierState, ModifierMode } from "@shared/schema";

interface ModifierToggleProps {
  modifierState: ModifierState;
  onToggleModifier: (modifier: keyof ModifierState) => void;
  onSetMode: (mode: ModifierMode) => void;
  onReset?: () => void;
  onSave?: () => void;
  hasChanges?: boolean;
}

export function ModifierToggle({
  modifierState,
  onToggleModifier,
  onSetMode,
  onReset,
  onSave,
  hasChanges = false,
}: ModifierToggleProps) {

  const getCurrentMode = (): ModifierMode => {
    const { ctrl, shift, alt } = modifierState;
    
    if (ctrl && shift) return "ctrl_shift";
    if (ctrl && alt) return "ctrl_alt";
    if (shift && alt) return "shift_alt";
    if (ctrl) return "ctrl";
    if (shift) return "shift";
    if (alt) return "alt";
    return "normal";
  };

  const modeName: Record<ModifierMode, string> = {
    normal: "Normal",
    ctrl: "Ctrl",
    shift: "Shift",
    alt: "Alt",
    ctrl_shift: "Ctrl+Shift",
    ctrl_alt: "Ctrl+Alt",
    shift_alt: "Shift+Alt",
  };

  return (
    <Card className="border-card-border" data-testid="card-modifier-toggle">
      <CardHeader data-testid="header-modifier-toggle">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-primary/10">
              <Command className="w-5 h-5 text-primary" data-testid="icon-modifier" />
            </div>
            <div>
              <CardTitle className="text-lg">Modifier Toggle (Sticky Keys)</CardTitle>
              <CardDescription className="text-sm">
                Toggle modifier states without holding keys
              </CardDescription>
            </div>
          </div>
          <Badge 
            variant="outline" 
            className="text-xs font-mono" 
            data-testid="badge-legal-compliance"
          >
            ✅ Legal - 1:1 Ratio
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Current Mode Display */}
        <div className="flex flex-col items-center justify-center p-6 bg-muted/30 rounded-lg border border-border" data-testid="display-current-mode">
          <div className="text-xs text-muted-foreground mb-2">Current Mode</div>
          <Badge 
            variant="default" 
            className="text-lg px-4 py-2 font-mono"
            data-testid="badge-current-mode"
          >
            {modeName[getCurrentMode()]}
          </Badge>
          
          {getCurrentMode() !== "normal" && (
            <p className="text-xs text-muted-foreground mt-3 text-center">
              Next key press will include active modifiers
            </p>
          )}
        </div>

        {/* Individual Modifier Toggles */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Individual Modifiers</h4>
          <div className="grid grid-cols-3 gap-3">
            <Button
              variant={modifierState.ctrl ? "default" : "outline"}
              size="lg"
              onClick={() => onToggleModifier("ctrl")}
              className="font-mono toggle-elevate"
              data-testid="button-toggle-ctrl"
            >
              <Keyboard className="w-4 h-4 mr-2" />
              Ctrl
            </Button>
            
            <Button
              variant={modifierState.shift ? "default" : "outline"}
              size="lg"
              onClick={() => onToggleModifier("shift")}
              className="font-mono toggle-elevate"
              data-testid="button-toggle-shift"
            >
              <Keyboard className="w-4 h-4 mr-2" />
              Shift
            </Button>
            
            <Button
              variant={modifierState.alt ? "default" : "outline"}
              size="lg"
              onClick={() => onToggleModifier("alt")}
              className="font-mono toggle-elevate"
              data-testid="button-toggle-alt"
            >
              <Keyboard className="w-4 h-4 mr-2" />
              Alt
            </Button>
          </div>
        </div>

        {/* Quick Mode Selection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Quick Mode Selection</h4>
            {hasChanges && (
              <div className="flex gap-2">
                {onReset && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onReset}
                    data-testid="button-reset-modifiers"
                  >
                    Reset
                  </Button>
                )}
                {onSave && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={onSave}
                    data-testid="button-save-modifiers"
                  >
                    Save as Default
                  </Button>
                )}
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={getCurrentMode() === "normal" ? "default" : "outline"}
              size="sm"
              onClick={() => onSetMode("normal")}
              className="font-mono"
              data-testid="button-mode-normal"
            >
              Normal
            </Button>
            
            <Button
              variant={getCurrentMode() === "ctrl" ? "default" : "outline"}
              size="sm"
              onClick={() => onSetMode("ctrl")}
              className="font-mono"
              data-testid="button-mode-ctrl"
            >
              Ctrl
            </Button>
            
            <Button
              variant={getCurrentMode() === "shift" ? "default" : "outline"}
              size="sm"
              onClick={() => onSetMode("shift")}
              className="font-mono"
              data-testid="button-mode-shift"
            >
              Shift
            </Button>
            
            <Button
              variant={getCurrentMode() === "alt" ? "default" : "outline"}
              size="sm"
              onClick={() => onSetMode("alt")}
              className="font-mono"
              data-testid="button-mode-alt"
            >
              Alt
            </Button>
            
            <Button
              variant={getCurrentMode() === "ctrl_shift" ? "default" : "outline"}
              size="sm"
              onClick={() => onSetMode("ctrl_shift")}
              className="font-mono"
              data-testid="button-mode-ctrl-shift"
            >
              Ctrl+Shift
            </Button>
            
            <Button
              variant={getCurrentMode() === "ctrl_alt" ? "default" : "outline"}
              size="sm"
              onClick={() => onSetMode("ctrl_alt")}
              className="font-mono"
              data-testid="button-mode-ctrl-alt"
            >
              Ctrl+Alt
            </Button>
            
            <Button
              variant={getCurrentMode() === "shift_alt" ? "default" : "outline"}
              size="sm"
              onClick={() => onSetMode("shift_alt")}
              className="font-mono"
              data-testid="button-mode-shift-alt"
            >
              Shift+Alt
            </Button>
          </div>
        </div>

        {/* Legal Notice */}
        <div className="p-3 bg-muted/20 rounded-md border border-border">
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">Legal Compliance:</strong> This feature maintains 1:1 input/output ratio.
            Each key press produces exactly one output (with modifier applied).
            Equivalent to Windows Sticky Keys accessibility feature.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
