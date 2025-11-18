import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { ModifierState, ModifierMode, Profile } from "@shared/schema";

interface ModifierContextType {
  modifierState: ModifierState;
  setModifierState: (state: ModifierState | ((prev: ModifierState) => ModifierState)) => void;
  toggleModifier: (modifier: keyof ModifierState) => void;
  setMode: (mode: ModifierMode) => void;
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
  const defaults = currentProfile?.modifierDefaults || { ctrl: false, shift: false, alt: false };
  const hasChanges =
    currentProfile &&
    (modifierState.ctrl !== defaults.ctrl ||
      modifierState.shift !== defaults.shift ||
      modifierState.alt !== defaults.alt);

  // Initialize state from profile when profile changes or modifierDefaults update
  useEffect(() => {
    const defaults = currentProfile?.modifierDefaults || { ctrl: false, shift: false, alt: false };
    setModifierState(defaults);
  }, [
    currentProfile?.id,
    currentProfile?.modifierDefaults?.ctrl,
    currentProfile?.modifierDefaults?.shift,
    currentProfile?.modifierDefaults?.alt,
  ]); // Re-init when profile changes OR when modifierDefaults update

  const toggleModifier = (modifier: keyof ModifierState) => {
    setModifierState((prev) => ({
      ...prev,
      [modifier]: !prev[modifier],
    }));
  };

  const setMode = (mode: ModifierMode) => {
    const modeMap: Record<ModifierMode, ModifierState> = {
      normal: { ctrl: false, shift: false, alt: false },
      ctrl: { ctrl: true, shift: false, alt: false },
      shift: { ctrl: false, shift: true, alt: false },
      alt: { ctrl: false, shift: false, alt: true },
      ctrl_shift: { ctrl: true, shift: true, alt: false },
      ctrl_alt: { ctrl: true, shift: false, alt: true },
      shift_alt: { ctrl: false, shift: true, alt: true },
      ctrl_shift_alt: { ctrl: true, shift: true, alt: true },
    };
    setModifierState(modeMap[mode]);
  };

  const resetToDefaults = () => {
    const defaults = currentProfile?.modifierDefaults || { ctrl: false, shift: false, alt: false };
    setModifierState(defaults);
  };

  return (
    <ModifierContext.Provider
      value={{
        modifierState,
        setModifierState,
        toggleModifier,
        setMode,
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
