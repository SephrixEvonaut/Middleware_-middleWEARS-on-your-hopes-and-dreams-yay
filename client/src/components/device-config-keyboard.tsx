import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, Keyboard } from "lucide-react";
import type { KeyboardConfig } from "@shared/schema";

interface DeviceConfigKeyboardProps {
  config: KeyboardConfig;
  onChange: (config: KeyboardConfig) => void;
}

export function DeviceConfigKeyboard({ config, onChange }: DeviceConfigKeyboardProps) {
  return (
    <Card className="border-card-border" data-testid="card-config-keyboard">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4" data-testid="header-keyboard">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-primary/10">
            <Keyboard className="w-5 h-5 text-primary" data-testid="icon-keyboard" />
          </div>
          <div>
            <CardTitle className="text-lg">Keyboard Configuration</CardTitle>
            <CardDescription className="text-sm">Standard keyboard with SharpKeys support</CardDescription>
          </div>
        </div>
        <Switch
          checked={config.enabled}
          onCheckedChange={(enabled) => onChange({ ...config, enabled })}
          data-testid="switch-keyboard-enabled"
        />
      </CardHeader>
      
      {config.enabled && (
        <CardContent className="space-y-6">
          <Alert className="border-muted-foreground/20">
            <Info className="w-4 h-4" />
            <AlertDescription className="text-sm">
              SharpKeys compatibility mode detects key remappings at the system level and adjusts gesture detection accordingly.
            </AlertDescription>
          </Alert>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="sharpkeys-compat" className="text-sm font-medium">
                SharpKeys Compatibility
              </Label>
              <p className="text-xs text-muted-foreground">
                Enable detection of system-level key remapping
              </p>
            </div>
            <Switch
              id="sharpkeys-compat"
              checked={config.sharpKeysCompat}
              onCheckedChange={(sharpKeysCompat) => onChange({ ...config, sharpKeysCompat })}
              data-testid="switch-sharpkeys-compat"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="detect-remapping" className="text-sm font-medium">
                Auto-detect Remapping
              </Label>
              <p className="text-xs text-muted-foreground">
                Automatically detect registry-level key changes
              </p>
            </div>
            <Switch
              id="detect-remapping"
              checked={config.detectRemapping}
              onCheckedChange={(detectRemapping) => onChange({ ...config, detectRemapping })}
              data-testid="switch-detect-remapping"
            />
          </div>
        </CardContent>
      )}
    </Card>
  );
}
