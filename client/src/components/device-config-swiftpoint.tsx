import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Mouse } from "lucide-react";
import type { SwiftpointConfig } from "@shared/schema";

interface DeviceConfigSwiftpointProps {
  config: SwiftpointConfig;
  onChange: (config: SwiftpointConfig) => void;
}

export function DeviceConfigSwiftpoint({ config, onChange }: DeviceConfigSwiftpointProps) {
  return (
    <Card className="border-card-border" data-testid="card-config-swiftpoint">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4" data-testid="header-swiftpoint">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-primary/10">
            <Mouse className="w-5 h-5 text-primary" data-testid="icon-swiftpoint" />
          </div>
          <div>
            <CardTitle className="text-lg">Swiftpoint Mouse</CardTitle>
            <CardDescription className="text-sm">Advanced tilt sensor configuration</CardDescription>
          </div>
        </div>
        <Switch
          checked={config.enabled}
          onCheckedChange={(enabled) => onChange({ ...config, enabled })}
          data-testid="switch-swiftpoint-enabled"
        />
      </CardHeader>
      
      {config.enabled && (
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="tilt-sensors" className="text-sm font-medium">
                Tilt Sensors
              </Label>
              <p className="text-xs text-muted-foreground">
                Enable multi-axis tilt detection
              </p>
            </div>
            <Switch
              id="tilt-sensors"
              checked={config.tiltSensors}
              onCheckedChange={(tiltSensors) => onChange({ ...config, tiltSensors })}
              data-testid="switch-tilt-sensors"
            />
          </div>

          {config.tiltSensors && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="tilt-sensitivity" className="text-sm font-medium">
                  Tilt Sensitivity
                </Label>
                <span className="text-xs font-mono text-muted-foreground">{config.tiltSensitivity}%</span>
              </div>
              <div data-testid="slider-wrapper-tilt-sensitivity">
                <Slider
                  id="tilt-sensitivity"
                  min={0}
                  max={100}
                  step={5}
                  value={[config.tiltSensitivity]}
                  onValueChange={([tiltSensitivity]) => onChange({ ...config, tiltSensitivity })}
                  data-testid="slider-tilt-sensitivity"
                  className="w-full"
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="haptic-feedback" className="text-sm font-medium">
                Haptic Feedback
              </Label>
              <p className="text-xs text-muted-foreground">
                Enable tactile response on gestures
              </p>
            </div>
            <Switch
              id="haptic-feedback"
              checked={config.hapticFeedback}
              onCheckedChange={(hapticFeedback) => onChange({ ...config, hapticFeedback })}
              data-testid="switch-haptic-feedback"
            />
          </div>
        </CardContent>
      )}
    </Card>
  );
}
