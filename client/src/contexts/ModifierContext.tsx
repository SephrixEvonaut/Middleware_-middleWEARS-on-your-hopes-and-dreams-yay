import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { ModifierState, Profile } from "@shared/schema";

interface ModifierContextType {
  modifierState: ModifierState;
  setModifierState: (state: ModifierState | ((prev: ModifierState) => ModifierState)) => void;
  toggleModifier: (modifier: keyof ModifierState) => void;
  resetToDefaults: () => void;
  hasChanges: boolean;
}

const ModifierContext = createContext<ModifierContextType | undefined>(undefined);

interface ModifierProviderProps {
  children: ReactNode;
  currentProfile: Profile | null;
}

export function ModifierProvider({ children, currentProfile }: ModifierProviderProps) {
  const [modifierState, setModifierState] = useState<ModifierState>({
    ctrl: false,
    shift: false,
    alt: false,
  });

  // Track if current state differs from profile defaults
  const hasChanges =
    currentProfile &&
    (modifierState.ctrl !== currentProfile.modifierDefaults.ctrl ||
      modifierState.shift !== currentProfile.modifierDefaults.shift ||
      modifierState.alt !== currentProfile.modifierDefaults.alt);

  // Initialize state from profile when profile changes or modifierDefaults update
  useEffect(() => {
    if (currentProfile?.modifierDefaults) {
      setModifierState(currentProfile.modifierDefaults);
    } else {
      // Fallback if no profile loaded
      setModifierState({ ctrl: false, shift: false, alt: false });
    }
  }, [
    currentProfile?.id,
    currentProfile?.modifierDefaults.ctrl,
    currentProfile?.modifierDefaults.shift,
    currentProfile?.modifierDefaults.alt,
  ]); // Re-init when profile changes OR when modifierDefaults update

  const toggleModifier = (modifier: keyof ModifierState) => {
    setModifierState((prev) => ({
      ...prev,
      [modifier]: !prev[modifier],
    }));
  };

  const resetToDefaults = () => {
    if (currentProfile?.modifierDefaults) {
      setModifierState(currentProfile.modifierDefaults);
    } else {
      setModifierState({ ctrl: false, shift: false, alt: false });
    }
  };

  return (
    <ModifierContext.Provider
      value={{
        modifierState,
        setModifierState,
        toggleModifier,
        resetToDefaults,
        hasChanges: !!hasChanges,
      }}
    >
      {children}
    </ModifierContext.Provider>
  );
}

export function useModifierContext() {
  const context = useContext(ModifierContext);
  if (!context) {
    throw new Error("useModifierContext must be used within ModifierProvider");
  }
  return context;
}
