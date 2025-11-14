import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Settings } from "lucide-react";
import type { GestureSettings } from "@shared/schema";

interface GestureSettingsProps {
  settings: GestureSettings;
  onChange: (settings: GestureSettings) => void;
}

export function GestureSettingsComponent({ settings, onChange }: GestureSettingsProps) {
  return (
    <Card className="border-card-border" data-testid="card-gesture-settings">
      <CardHeader data-testid="header-gesture-settings">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-primary/10">
            <Settings className="w-5 h-5 text-primary" data-testid="icon-gesture-settings" />
          </div>
          <div>
            <CardTitle className="text-lg">Gesture Detection Settings</CardTitle>
            <CardDescription className="text-sm">Fine-tune timing windows and detection thresholds</CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="multi-press-window" className="text-sm font-medium">
              Multi-Press Window
            </Label>
            <span className="text-xs font-mono text-muted-foreground">{settings.multiPressWindow}ms</span>
          </div>
          <div data-testid="slider-wrapper-multi-press-window">
            <Slider
              id="multi-press-window"
              min={100}
              max={1000}
              step={50}
              value={[settings.multiPressWindow]}
              onValueChange={([multiPressWindow]) => onChange({ ...settings, multiPressWindow })}
              data-testid="slider-multi-press-window"
              className="w-full"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Time window for detecting double/triple/quadruple presses
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="long-press-min" className="text-sm font-medium">
              Long Press Minimum
            </Label>
            <span className="text-xs font-mono text-muted-foreground">{settings.longPressMin}ms</span>
          </div>
          <div data-testid="slider-wrapper-long-press-min">
            <Slider
              id="long-press-min"
              min={50}
              max={200}
              step={10}
              value={[settings.longPressMin]}
              onValueChange={([longPressMin]) => onChange({ ...settings, longPressMin })}
              data-testid="slider-long-press-min"
              className="w-full"
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="long-press-max" className="text-sm font-medium">
              Long Press Maximum
            </Label>
            <span className="text-xs font-mono text-muted-foreground">{settings.longPressMax}ms</span>
          </div>
          <div data-testid="slider-wrapper-long-press-max">
            <Slider
              id="long-press-max"
              min={100}
              max={300}
              step={10}
              value={[settings.longPressMax]}
              onValueChange={([longPressMax]) => onChange({ ...settings, longPressMax })}
              data-testid="slider-long-press-max"
              className="w-full"
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="cancel-threshold" className="text-sm font-medium">
              Cancel Threshold
            </Label>
            <span className="text-xs font-mono text-muted-foreground">{settings.cancelThreshold}ms</span>
          </div>
          <div data-testid="slider-wrapper-cancel-threshold">
            <Slider
              id="cancel-threshold"
              min={100}
              max={500}
              step={25}
              value={[settings.cancelThreshold]}
              onValueChange={([cancelThreshold]) => onChange({ ...settings, cancelThreshold })}
              data-testid="slider-cancel-threshold"
              className="w-full"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Hesitation time before fallback on cancel-and-hold
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="debounce-delay" className="text-sm font-medium">
              Debounce Delay
            </Label>
            <span className="text-xs font-mono text-muted-foreground">{settings.debounceDelay}ms</span>
          </div>
          <div data-testid="slider-wrapper-debounce-delay">
            <Slider
              id="debounce-delay"
              min={0}
              max={50}
              step={5}
              value={[settings.debounceDelay]}
              onValueChange={([debounceDelay]) => onChange({ ...settings, debounceDelay })}
              data-testid="slider-debounce-delay"
              className="w-full"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Hardware signal stabilization delay
          </p>
        </div>

        <div className="pt-4 border-t border-border">
          <h3 className="text-sm font-medium mb-4 text-violet-500">Charge-Release Settings</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="charge-min-hold" className="text-sm font-medium">
                Charge Minimum Hold
              </Label>
              <span className="text-xs font-mono text-muted-foreground">{settings.chargeMinHold}ms</span>
            </div>
            <div data-testid="slider-wrapper-charge-min-hold">
              <Slider
                id="charge-min-hold"
                min={100}
                max={1000}
                step={50}
                value={[settings.chargeMinHold]}
                onValueChange={([chargeMinHold]) => onChange({ ...settings, chargeMinHold })}
                data-testid="slider-charge-min-hold"
                className="w-full"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Minimum hold time to start charging (0% charge)
            </p>
          </div>

          <div className="space-y-3 mt-6">
            <div className="flex items-center justify-between">
              <Label htmlFor="charge-max-hold" className="text-sm font-medium">
                Charge Maximum Hold
              </Label>
              <span className="text-xs font-mono text-muted-foreground">{settings.chargeMaxHold}ms</span>
            </div>
            <div data-testid="slider-wrapper-charge-max-hold">
              <Slider
                id="charge-max-hold"
                min={500}
                max={5000}
                step={100}
                value={[settings.chargeMaxHold]}
                onValueChange={([chargeMaxHold]) => onChange({ ...settings, chargeMaxHold })}
                data-testid="slider-charge-max-hold"
                className="w-full"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Maximum hold time for full charge (100% charge)
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
