import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Gamepad2 } from "lucide-react";
import type { AzeronConfig } from "@shared/schema";

interface DeviceConfigAzeronProps {
  config: AzeronConfig;
  onChange: (config: AzeronConfig) => void;
}

export function DeviceConfigAzeron({ config, onChange }: DeviceConfigAzeronProps) {
  return (
    <Card className="border-card-border" data-testid="card-config-azeron">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4" data-testid="header-azeron">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-primary/10">
            <Gamepad2 className="w-5 h-5 text-primary" data-testid="icon-azeron" />
          </div>
          <div>
            <CardTitle className="text-lg">Azeron Cyborg</CardTitle>
            <CardDescription className="text-sm">29-button gaming keypad configuration</CardDescription>
          </div>
        </div>
        <Switch
          checked={config.enabled}
          onCheckedChange={(enabled) => onChange({ ...config, enabled })}
          data-testid="switch-azeron-enabled"
        />
      </CardHeader>
      
      {config.enabled && (
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="button-count" className="text-sm font-medium">
              Button Count
            </Label>
            <div className="flex items-center gap-3">
              <Input
                id="button-count"
                type="number"
                min={1}
                max={50}
                value={config.buttonCount}
                onChange={(e) => onChange({ ...config, buttonCount: parseInt(e.target.value) || 29 })}
                data-testid="input-button-count"
                className="h-9 w-20 font-mono"
              />
              <span className="text-sm text-muted-foreground">buttons</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="thumbpad" className="text-sm font-medium">
                Thumbpad Module
              </Label>
              <p className="text-xs text-muted-foreground">
                Enable analog thumbpad for directional input
              </p>
            </div>
            <Switch
              id="thumbpad"
              checked={config.thumbPad}
              onCheckedChange={(thumbPad) => onChange({ ...config, thumbPad })}
              data-testid="switch-thumbpad"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="sensitivity" className="text-sm font-medium">
                Input Sensitivity
              </Label>
              <span className="text-xs font-mono text-muted-foreground">{config.sensitivity}%</span>
            </div>
            <div data-testid="slider-wrapper-sensitivity">
              <Slider
                id="sensitivity"
                min={0}
                max={100}
                step={5}
                value={[config.sensitivity]}
                onValueChange={([sensitivity]) => onChange({ ...config, sensitivity })}
                data-testid="slider-sensitivity"
                className="w-full"
              />
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
