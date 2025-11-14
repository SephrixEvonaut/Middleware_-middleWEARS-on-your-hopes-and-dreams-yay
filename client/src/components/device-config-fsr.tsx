import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Gauge } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { FSRSensorConfig } from "@shared/schema";

interface DeviceConfigFSRProps {
  config: FSRSensorConfig;
  onChange: (config: FSRSensorConfig) => void;
}

export function DeviceConfigFSR({ config, onChange }: DeviceConfigFSRProps) {
  return (
    <Card className="border-card-border" data-testid="card-config-fsr">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4" data-testid="header-fsr">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-primary/10">
            <Gauge className="w-5 h-5 text-primary" data-testid="icon-fsr" />
          </div>
          <div>
            <CardTitle className="text-lg">FSR Pressure Sensors</CardTitle>
            <CardDescription className="text-sm">Analog force-sensitive resistor configuration</CardDescription>
          </div>
        </div>
        <Switch
          checked={config.enabled}
          onCheckedChange={(enabled) => onChange({ ...config, enabled })}
          data-testid="switch-fsr-enabled"
        />
      </CardHeader>
      
      {config.enabled && (
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label className="text-sm font-medium">Analog Thresholds (%)</Label>
            <div className="flex flex-wrap gap-2">
              {config.analogThresholds.map((threshold, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="font-mono"
                  data-testid={`badge-threshold-${index}`}
                >
                  {threshold}%
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="calibration-curve" className="text-sm font-medium">
              Calibration Curve
            </Label>
            <div className="flex gap-2">
              {(["linear", "exponential", "logarithmic"] as const).map((curve) => (
                <Badge
                  key={curve}
                  variant={config.calibrationCurve === curve ? "default" : "outline"}
                  className="cursor-pointer capitalize hover-elevate active-elevate-2"
                  onClick={() => onChange({ ...config, calibrationCurve: curve })}
                  data-testid={`badge-curve-${curve}`}
                >
                  {curve}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="deadzone" className="text-sm font-medium">
                Deadzone
              </Label>
              <span className="text-xs font-mono text-muted-foreground">{config.deadzone}%</span>
            </div>
            <div data-testid="slider-wrapper-deadzone">
              <Slider
                id="deadzone"
                min={0}
                max={20}
                step={1}
                value={[config.deadzone]}
                onValueChange={([deadzone]) => onChange({ ...config, deadzone })}
                data-testid="slider-deadzone"
                className="w-full"
              />
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
