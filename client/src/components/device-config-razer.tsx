import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mouse, Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { RazerMMOConfig } from "@shared/schema";

interface DeviceConfigRazerProps {
  config: RazerMMOConfig;
  onChange: (config: RazerMMOConfig) => void;
}

export function DeviceConfigRazer({ config, onChange }: DeviceConfigRazerProps) {
  const addDPIStage = () => {
    onChange({ ...config, dpiStages: [...config.dpiStages, 1600] });
  };

  const removeDPIStage = (index: number) => {
    onChange({ ...config, dpiStages: config.dpiStages.filter((_, i) => i !== index) });
  };

  const updateDPIStage = (index: number, value: number) => {
    const newStages = [...config.dpiStages];
    newStages[index] = value;
    onChange({ ...config, dpiStages: newStages });
  };

  return (
    <Card className="border-card-border" data-testid="card-config-razer">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4" data-testid="header-razer">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-primary/10">
            <Mouse className="w-5 h-5 text-primary" data-testid="icon-razer" />
          </div>
          <div>
            <CardTitle className="text-lg">Razer MMO Mouse</CardTitle>
            <CardDescription className="text-sm">12 programmable side buttons</CardDescription>
          </div>
        </div>
        <Switch
          checked={config.enabled}
          onCheckedChange={(enabled) => onChange({ ...config, enabled })}
          data-testid="switch-razer-enabled"
        />
      </CardHeader>
      
      {config.enabled && (
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="side-buttons" className="text-sm font-medium">
              Side Buttons
            </Label>
            <Input
              id="side-buttons"
              type="number"
              min={1}
              max={20}
              value={config.sideButtons}
              onChange={(e) => onChange({ ...config, sideButtons: parseInt(e.target.value) || 12 })}
              data-testid="input-side-buttons"
              className="h-9 w-20 font-mono"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">DPI Stages</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={addDPIStage}
                data-testid="button-add-dpi"
                className="h-8"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {config.dpiStages.map((dpi, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={100}
                    max={30000}
                    step={100}
                    value={dpi}
                    onChange={(e) => updateDPIStage(index, parseInt(e.target.value) || 800)}
                    data-testid={`input-dpi-${index}`}
                    className="h-8 w-24 font-mono"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeDPIStage(index)}
                    data-testid={`button-remove-dpi-${index}`}
                    className="h-8 w-8"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="polling-rate" className="text-sm font-medium">
              Polling Rate (Hz)
            </Label>
            <div className="flex gap-2">
              {[125, 250, 500, 1000].map((rate) => (
                <Badge
                  key={rate}
                  variant={config.pollingRate === rate ? "default" : "outline"}
                  className="cursor-pointer hover-elevate active-elevate-2"
                  onClick={() => onChange({ ...config, pollingRate: rate })}
                  data-testid={`badge-polling-${rate}`}
                >
                  {rate}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
