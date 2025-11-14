import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link2, Plus, Trash2, Gamepad2, Keyboard, Mouse, Gauge } from "lucide-react";
import { useState } from "react";
import type { InputMapping, GestureType } from "@shared/schema";

interface MappingDesignerProps {
  mappings: InputMapping[];
  onChange: (mappings: InputMapping[]) => void;
}

const deviceIcons = {
  keyboard: Keyboard,
  azeron: Gamepad2,
  razer_mmo: Mouse,
  swiftpoint: Mouse,
  fsr_sensor: Gauge,
};

const gestureTypes: { value: GestureType; label: string }[] = [
  { value: "single_press", label: "Single Press" },
  { value: "double_press", label: "Double Press" },
  { value: "triple_press", label: "Triple Press" },
  { value: "quadruple_press", label: "Quadruple Press" },
  { value: "long_press", label: "Long Press" },
  { value: "cancel_and_hold", label: "Cancel & Hold" },
];

export function MappingDesigner({ mappings, onChange }: MappingDesignerProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newMapping, setNewMapping] = useState<Partial<InputMapping>>({
    deviceType: "keyboard",
    gestureType: "single_press",
    inputId: "",
    actionName: "",
    actionDescription: "",
    priority: 0,
  });

  const addMapping = () => {
    if (!newMapping.inputId || !newMapping.actionName) return;
    
    const mapping: InputMapping = {
      id: `${Date.now()}`,
      deviceType: newMapping.deviceType as any,
      gestureType: newMapping.gestureType as any,
      inputId: newMapping.inputId,
      actionName: newMapping.actionName,
      actionDescription: newMapping.actionDescription,
      priority: newMapping.priority || 0,
    };
    
    onChange([...mappings, mapping]);
    setDialogOpen(false);
    setNewMapping({
      deviceType: "keyboard",
      gestureType: "single_press",
      inputId: "",
      actionName: "",
      actionDescription: "",
      priority: 0,
    });
  };

  const removeMapping = (id: string) => {
    onChange(mappings.filter(m => m.id !== id));
  };

  return (
    <Card className="border-card-border" data-testid="card-mapping-designer">
      <CardHeader data-testid="header-mapping-designer">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-primary/10">
              <Link2 className="w-5 h-5 text-primary" data-testid="icon-mapping-designer" />
            </div>
            <div>
              <CardTitle className="text-lg">Input Mapping Designer</CardTitle>
              <CardDescription className="text-sm">
                Bind device inputs to game actions
              </CardDescription>
            </div>
          </div>
          <Button
            onClick={() => setDialogOpen(true)}
            data-testid="button-add-mapping"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Mapping
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {mappings.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center" data-testid="empty-state-mappings">
            <Link2 className="w-12 h-12 text-muted-foreground/40 mb-4" />
            <h3 className="text-sm font-medium text-foreground mb-2">
              No mappings configured
            </h3>
            <p className="text-xs text-muted-foreground mb-4 max-w-sm">
              Create input-to-action mappings to bind device gestures to game actions
            </p>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(true)}
              data-testid="button-add-first-mapping"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add First Mapping
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {mappings.map((mapping) => {
              const DeviceIcon = deviceIcons[mapping.deviceType];
              
              return (
                <div
                  key={mapping.id}
                  className="flex items-center justify-between p-4 bg-muted/20 rounded-lg border border-border hover-elevate"
                  data-testid={`mapping-${mapping.id}`}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center gap-2 min-w-[200px]">
                      <DeviceIcon className="w-4 h-4 text-muted-foreground" />
                      <div className="flex flex-col">
                        <span className="text-sm font-mono font-medium">
                          {mapping.inputId}
                        </span>
                        <Badge variant="outline" className="text-xs w-fit">
                          {mapping.gestureType.replace(/_/g, " ")}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="w-8 border-t border-dashed border-muted-foreground/30" />
                      <span className="text-muted-foreground">→</span>
                      <div className="w-8 border-t border-dashed border-muted-foreground/30" />
                    </div>
                    
                    <div className="flex-1">
                      <p className="text-sm font-medium">{mapping.actionName}</p>
                      {mapping.actionDescription && (
                        <p className="text-xs text-muted-foreground">
                          {mapping.actionDescription}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeMapping(mapping.id)}
                    data-testid={`button-remove-mapping-${mapping.id}`}
                    className="ml-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent data-testid="dialog-add-mapping">
          <DialogHeader>
            <DialogTitle>Add Input Mapping</DialogTitle>
            <DialogDescription>
              Create a new binding between a device input and game action
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="device-type">Device Type</Label>
              <Select
                value={newMapping.deviceType}
                onValueChange={(deviceType: any) => setNewMapping({ ...newMapping, deviceType })}
              >
                <SelectTrigger id="device-type" data-testid="select-device-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="keyboard">Keyboard</SelectItem>
                  <SelectItem value="azeron">Azeron Cyborg</SelectItem>
                  <SelectItem value="razer_mmo">Razer MMO Mouse</SelectItem>
                  <SelectItem value="swiftpoint">Swiftpoint Mouse</SelectItem>
                  <SelectItem value="fsr_sensor">FSR Sensor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="input-id">Input ID</Label>
              <Input
                id="input-id"
                placeholder="e.g., Space, Button1, Sensor3"
                value={newMapping.inputId}
                onChange={(e) => setNewMapping({ ...newMapping, inputId: e.target.value })}
                data-testid="input-input-id"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gesture-type">Gesture Type</Label>
              <Select
                value={newMapping.gestureType}
                onValueChange={(gestureType: any) => setNewMapping({ ...newMapping, gestureType })}
              >
                <SelectTrigger id="gesture-type" data-testid="select-gesture-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {gestureTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="action-name">Action Name</Label>
              <Input
                id="action-name"
                placeholder="e.g., Fire Primary Weapon"
                value={newMapping.actionName}
                onChange={(e) => setNewMapping({ ...newMapping, actionName: e.target.value })}
                data-testid="input-action-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="action-description">Description (Optional)</Label>
              <Input
                id="action-description"
                placeholder="Additional details about this action"
                value={newMapping.actionDescription}
                onChange={(e) => setNewMapping({ ...newMapping, actionDescription: e.target.value })}
                data-testid="input-action-description"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              data-testid="button-cancel-mapping"
            >
              Cancel
            </Button>
            <Button
              onClick={addMapping}
              disabled={!newMapping.inputId || !newMapping.actionName}
              data-testid="button-save-mapping"
            >
              Add Mapping
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
