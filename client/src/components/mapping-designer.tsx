import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Profile, InputMapping, GestureType } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, GripVertical } from "lucide-react";

interface MappingDesignerProps {
  profile: Profile;
  onUpdate: (profile: Profile) => void;
}

interface DraggableInputItem {
  id: string;
  deviceType: string;
  inputId: string;
  label: string;
}

interface ActionSlot {
  id: number;
  name: string;
  description: string;
}

const gestureLabels: Record<GestureType, string> = {
  single_press: "Single",
  double_press: "Double",
  triple_press: "Triple",
  quadruple_press: "Quad",
  long_press: "Long",
  cancel_and_hold: "Cancel & Hold",
};

export function MappingDesigner({ profile, onUpdate }: MappingDesignerProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedGesture, setSelectedGesture] = useState<GestureType>("single_press");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Generate available inputs from enabled devices
  const availableInputs: DraggableInputItem[] = [];
  
  if (profile.devices.keyboard.enabled) {
    ["q", "w", "e", "r", "t", "a", "s", "d", "f", "g"].forEach((key) => {
      availableInputs.push({
        id: `keyboard-${key}`,
        deviceType: "keyboard",
        inputId: key.toUpperCase(),
        label: `Key ${key.toUpperCase()}`,
      });
    });
  }

  if (profile.devices.azeron.enabled) {
    for (let i = 1; i <= Math.min(profile.devices.azeron.buttonCount, 10); i++) {
      availableInputs.push({
        id: `azeron-btn${i}`,
        deviceType: "azeron",
        inputId: `btn${i}`,
        label: `Azeron ${i}`,
      });
    }
  }

  if (profile.devices.razerMMO.enabled) {
    for (let i = 1; i <= Math.min(profile.devices.razerMMO.sideButtons, 12); i++) {
      availableInputs.push({
        id: `razer_mmo-side${i}`,
        deviceType: "razer_mmo",
        inputId: `side${i}`,
        label: `MMO ${i}`,
      });
    }
  }

  if (profile.devices.swiftpoint.enabled) {
    ["tilt_left", "tilt_right", "tilt_up", "tilt_down"].forEach((tilt) => {
      availableInputs.push({
        id: `swiftpoint-${tilt}`,
        deviceType: "swiftpoint",
        inputId: tilt,
        label: `Tilt ${tilt.split("_")[1]}`,
      });
    });
  }

  if (profile.devices.fsrSensor.enabled) {
    ["fsr1", "fsr2", "fsr3", "fsr4"].forEach((sensor) => {
      availableInputs.push({
        id: `fsr_sensor-${sensor}`,
        deviceType: "fsr_sensor",
        inputId: sensor,
        label: `FSR ${sensor.toUpperCase()}`,
      });
    });
  }

  // Define action slots
  const actionSlots: ActionSlot[] = [
    { id: 0, name: "Movement", description: "WASD / Navigation" },
    { id: 1, name: "Combat", description: "Primary attacks" },
    { id: 2, name: "Abilities", description: "Special skills" },
    { id: 3, name: "Items", description: "Inventory actions" },
    { id: 4, name: "Communication", description: "Voice/Chat" },
    { id: 5, name: "Custom", description: "Macros & Commands" },
  ];

  // Organize mappings by slot
  const getMappingsForSlot = (slotId: number): InputMapping[] => {
    return profile.inputMappings.filter((m) => (m.actionSlot ?? 5) === slotId);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const overId = over.id as string;
    const activeId = active.id as string;

    // Case 1: Dragging from available inputs to action slot
    const activeInput = availableInputs.find((input) => input.id === activeId);
    const actionSlotMatch = overId.match(/^action-slot-(\d+)$/);
    
    if (activeInput && actionSlotMatch) {
      const slotId = parseInt(actionSlotMatch[1]);
      
      const newMapping: InputMapping = {
        id: `mapping-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        deviceType: activeInput.deviceType as InputMapping["deviceType"],
        inputId: activeInput.inputId,
        gestureType: selectedGesture,
        actionName: actionSlots[slotId].name,
        actionDescription: actionSlots[slotId].description,
        priority: 0,
        actionSlot: slotId,
      };

      onUpdate({ ...profile, inputMappings: [...profile.inputMappings, newMapping] });
      return;
    }

    // Case 2: Dragging mapping to trash
    if (overId === "trash-zone" && activeId.startsWith("mapping-")) {
      const updatedMappings = profile.inputMappings.filter((m) => m.id !== activeId);
      onUpdate({ ...profile, inputMappings: updatedMappings });
      return;
    }

    // Case 3: Reordering within same slot
    if (activeId.startsWith("mapping-") && overId.startsWith("mapping-")) {
      const activeMapping = profile.inputMappings.find((m) => m.id === activeId);
      const overMapping = profile.inputMappings.find((m) => m.id === overId);

      if (activeMapping && overMapping) {
        const activeSlot = activeMapping.actionSlot ?? 5;
        const overSlot = overMapping.actionSlot ?? 5;

        // Only allow reordering within the same slot
        if (activeSlot === overSlot) {
          const slotMappings = getMappingsForSlot(activeSlot);
          const activeIndex = slotMappings.findIndex((m) => m.id === activeId);
          const overIndex = slotMappings.findIndex((m) => m.id === overId);

          if (activeIndex !== -1 && overIndex !== -1) {
            const reorderedSlotMappings = arrayMove(slotMappings, activeIndex, overIndex);
            
            // Rebuild full mappings array with reordered slot
            const otherMappings = profile.inputMappings.filter((m) => (m.actionSlot ?? 5) !== activeSlot);
            const updatedMappings = [...otherMappings, ...reorderedSlotMappings];
            
            onUpdate({ ...profile, inputMappings: updatedMappings });
          }
        }
      }
    }
  };

  const activeInput = activeId ? availableInputs.find((i) => i.id === activeId) : null;
  const activeMapping = activeId ? profile.inputMappings.find((m) => m.id === activeId) : null;

  return (
    <Card data-testid="card-mapping-designer">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle data-testid="text-mapping-designer-title">Visual Mapping Designer</CardTitle>
            <CardDescription data-testid="text-mapping-designer-description">
              Drag inputs from the left panel onto action categories to create gesture mappings
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Gesture:</span>
            <select
              value={selectedGesture}
              onChange={(e) => setSelectedGesture(e.target.value as GestureType)}
              className="px-3 min-h-8 rounded-md border border-input bg-background text-sm"
              data-testid="select-gesture-type"
            >
              {Object.entries(gestureLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-12 gap-4">
            {/* Left Column - Available Inputs */}
            <div className="col-span-3">
              <Card data-testid="card-available-inputs">
                <CardHeader className="gap-1 space-y-0 pb-2">
                  <CardTitle className="text-base" data-testid="text-available-inputs-title">Available Inputs</CardTitle>
                  <CardDescription className="text-xs" data-testid="text-available-inputs-description">Drag to actions</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <div className="flex flex-col gap-2">
                      {availableInputs.map((input) => (
                        <DraggableInput key={input.id} input={input} />
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Action Slots */}
            <div className="col-span-9">
              <div className="grid grid-cols-2 gap-4">
                {actionSlots.map((slot) => (
                  <DroppableActionSlot
                    key={slot.id}
                    slot={slot}
                    mappings={getMappingsForSlot(slot.id)}
                    onUpdate={onUpdate}
                    profile={profile}
                  />
                ))}
              </div>
              
              {/* Trash Zone */}
              <DroppableTrash />
            </div>
          </div>

          <DragOverlay>
            {activeInput && (
              <Badge variant="secondary" className="cursor-grabbing">
                {activeInput.label}
              </Badge>
            )}
            {activeMapping && (
              <Badge variant="secondary" className="cursor-grabbing">
                {activeMapping.inputId} • {gestureLabels[activeMapping.gestureType]}
              </Badge>
            )}
          </DragOverlay>
        </DndContext>
      </CardContent>
    </Card>
  );
}

function DraggableInput({ input }: { input: DraggableInputItem }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: input.id,
  });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-grab active:cursor-grabbing"
      data-testid={`draggable-input-${input.id}`}
    >
      <Badge variant="outline" className="w-full justify-start gap-2">
        <GripVertical className="h-3 w-3" />
        {input.label}
      </Badge>
    </div>
  );
}

function DroppableActionSlot({
  slot,
  mappings,
  onUpdate,
  profile,
}: {
  slot: ActionSlot;
  mappings: InputMapping[];
  onUpdate: (profile: Profile) => void;
  profile: Profile;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `action-slot-${slot.id}`,
  });

  const handleGestureChange = (mappingId: string, newGesture: GestureType) => {
    const updatedMappings = profile.inputMappings.map((m) =>
      m.id === mappingId ? { ...m, gestureType: newGesture } : m
    );
    onUpdate({ ...profile, inputMappings: updatedMappings });
  };

  return (
    <Card
      ref={setNodeRef}
      className={`transition-colors ${isOver ? "border-primary bg-primary/5" : ""}`}
      data-testid={`droppable-action-slot-${slot.id}`}
    >
      <CardHeader className="gap-1 space-y-0 pb-2">
        <CardTitle className="text-sm" data-testid={`text-action-slot-name-${slot.id}`}>{slot.name}</CardTitle>
        <CardDescription className="text-xs" data-testid={`text-action-slot-description-${slot.id}`}>{slot.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-32">
          <SortableContext
            items={mappings.map((m) => m.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="flex flex-col gap-2">
              {mappings.length === 0 ? (
                <div className="text-xs text-muted-foreground text-center py-4" data-testid={`text-empty-slot-${slot.id}`}>
                  Drop inputs here
                </div>
              ) : (
                mappings.map((mapping) => (
                  <MappingChip
                    key={mapping.id}
                    mapping={mapping}
                    onGestureChange={handleGestureChange}
                  />
                ))
              )}
            </div>
          </SortableContext>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function MappingChip({
  mapping,
  onGestureChange,
}: {
  mapping: InputMapping;
  onGestureChange: (mappingId: string, gesture: GestureType) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: mapping.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="cursor-grab active:cursor-grabbing"
      data-testid={`mapping-chip-${mapping.id}`}
    >
      <div className="flex items-center gap-2 p-2 bg-muted/20 rounded-md border border-border">
        <div {...attributes} {...listeners} className="cursor-grab">
          <GripVertical className="h-3 w-3 text-muted-foreground" data-testid={`grip-${mapping.id}`} />
        </div>
        <span className="text-xs font-mono flex-1" data-testid={`text-input-${mapping.id}`}>{mapping.inputId}</span>
        <select
          value={mapping.gestureType}
          onChange={(e) => onGestureChange(mapping.id, e.target.value as GestureType)}
          className="text-xs px-2 py-1 rounded border border-input bg-background"
          onClick={(e) => e.stopPropagation()}
          data-testid={`select-gesture-${mapping.id}`}
        >
          {Object.entries(gestureLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function DroppableTrash() {
  const { setNodeRef, isOver } = useDroppable({
    id: "trash-zone",
  });

  return (
    <Card
      ref={setNodeRef}
      className={`mt-4 transition-colors ${isOver ? "border-destructive bg-destructive/5" : ""}`}
      data-testid="droppable-trash-zone"
    >
      <CardContent className="py-4">
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Trash2 className="h-4 w-4" />
          <span data-testid="text-trash-zone-label">Drag mappings here to remove</span>
        </div>
      </CardContent>
    </Card>
  );
}
