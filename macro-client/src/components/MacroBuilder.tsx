import React, { useState } from "react";
import { MacroProfile, InputKey, GestureType, MacroBinding, MacroStep } from "../../../macro-shared/schema";
import { ABILITY_CATALOG, getAbilityById } from "../../../macro-shared/abilities";

interface MacroBuilderProps {
  inputKey: InputKey;
  profile: MacroProfile;
  onProfileUpdate: (profile: MacroProfile) => void;
}

const GESTURE_OPTIONS: { value: GestureType; label: string }[] = [
  { value: "single", label: "Single Press" },
  { value: "long", label: "Long Press (80-140ms)" },
  { value: "double", label: "Double Press" },
  { value: "double_long", label: "Double + 2nd Long" },
  { value: "triple", label: "Triple Press" },
  { value: "triple_long", label: "Triple + 3rd Long" },
  { value: "quadruple_long", label: "Quadruple + 4th Long" },
  { value: "super_long", label: "Super Long (300-2000ms)" },
  { value: "cancel", label: "Cancel Hold (>3000ms)" },
];

export function MacroBuilder({ inputKey, profile, onProfileUpdate }: MacroBuilderProps) {
  const [selectedGesture, setSelectedGesture] = useState<GestureType>("single");

  const currentBinding = profile.macroBindings.find(
    b => b.inputKey === inputKey && b.gestureType === selectedGesture
  );

  const handleAddAbility = (abilityId: string) => {
    const ability = getAbilityById(abilityId);
    if (!ability) return;

    const newStep: MacroStep = {
      id: `step-${Date.now()}`,
      order: currentBinding?.sequence.length || 0,
      ability: abilityId,
      pressCount: ability.defaultPressCount,
      pressInterval: ability.defaultPressInterval,
      waitAfter: 40,
      targetModifier: "none",
    };

    if (currentBinding) {
      // Add step to existing binding
      const updated = {
        ...currentBinding,
        sequence: [...currentBinding.sequence, newStep],
      };
      updateBinding(updated);
    } else {
      // Create new binding
      const newBinding: MacroBinding = {
        id: `binding-${Date.now()}`,
        inputKey,
        gestureType: selectedGesture,
        sequence: [newStep],
        enabled: true,
      };
      const updatedProfile = {
        ...profile,
        macroBindings: [...profile.macroBindings, newBinding],
      };
      saveProfile(updatedProfile);
    }
  };

  const updateBinding = (binding: MacroBinding) => {
    const updatedProfile = {
      ...profile,
      macroBindings: profile.macroBindings.map(b =>
        b.id === binding.id ? binding : b
      ),
    };
    saveProfile(updatedProfile);
  };

  const deleteBinding = () => {
    if (!currentBinding) return;
    const updatedProfile = {
      ...profile,
      macroBindings: profile.macroBindings.filter(b => b.id !== currentBinding.id),
    };
    saveProfile(updatedProfile);
  };

  const saveProfile = (updatedProfile: MacroProfile) => {
    fetch(`/api/macro-profiles/${profile.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedProfile),
    })
      .then(res => res.json())
      .then(saved => onProfileUpdate(saved))
      .catch(err => console.error("Failed to save profile:", err));
  };

  return (
    <div className="bg-card rounded-lg border p-6">
      <h2 className="text-2xl font-bold mb-4">
        Macro Builder: <span className="text-primary">{inputKey}</span>
      </h2>

      {/* Gesture Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Gesture Type</label>
        <select
          value={selectedGesture}
          onChange={e => setSelectedGesture(e.target.value as GestureType)}
          className="w-full bg-background border rounded-lg px-3 py-2"
        >
          {GESTURE_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Current Sequence */}
      {currentBinding ? (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Sequence ({currentBinding.sequence.length} steps)</h3>
            <button
              onClick={deleteBinding}
              className="text-xs text-red-500 hover:text-red-700"
            >
              Delete Binding
            </button>
          </div>
          <div className="space-y-2">
            {currentBinding.sequence.map((step, idx) => {
              const ability = getAbilityById(step.ability);
              return (
                <div key={step.id} className="bg-background rounded p-3 text-sm">
                  <div className="font-mono font-bold">{idx + 1}. {ability?.displayName || step.ability}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Press {step.pressCount}x @ {step.pressInterval}ms • Wait {step.waitAfter}ms
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="mb-4 p-4 bg-background rounded-lg text-center text-sm text-muted-foreground">
          No macro configured for this gesture
        </div>
      )}

      {/* Ability Catalog */}
      <div>
        <h3 className="font-semibold mb-2">Add Ability</h3>
        <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
          {ABILITY_CATALOG.map(ability => (
            <button
              key={ability.id}
              onClick={() => handleAddAbility(ability.id)}
              className="text-left p-2 rounded bg-background hover:bg-accent border text-sm"
            >
              <div className="font-semibold">{ability.displayName}</div>
              <div className="text-xs text-muted-foreground">{ability.category}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
