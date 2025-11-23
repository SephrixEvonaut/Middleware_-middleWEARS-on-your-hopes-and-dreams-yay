import { MacroProfile, AbilityTemplate, InsertMacroProfile } from "../macro-shared/schema";
import { ABILITY_CATALOG } from "../macro-shared/abilities";

// ============================================================================
// IN-MEMORY STORAGE
// ============================================================================

export interface IMacroStorage {
  // Profiles
  getProfiles(): Promise<MacroProfile[]>;
  getProfileById(id: string): Promise<MacroProfile | null>;
  createProfile(data: InsertMacroProfile): Promise<MacroProfile>;
  updateProfile(id: string, data: Partial<MacroProfile>): Promise<MacroProfile>;
  deleteProfile(id: string): Promise<void>;
  
  // Abilities
  getAbilities(): Promise<AbilityTemplate[]>;
  getAbilityById(id: string): Promise<AbilityTemplate | null>;
}

class MemMacroStorage implements IMacroStorage {
  private profiles: Map<string, MacroProfile> = new Map();
  private abilities: AbilityTemplate[] = [...ABILITY_CATALOG];

  constructor() {
    // Seed with default profile
    const defaultProfile: MacroProfile = {
      id: "default",
      name: "Default Profile",
      description: "Starting macro profile",
      favorite: true,
      gestureSettings: {
        multiPressWindow: 350,
        debounceDelay: 10,
        longPressMin: 80,
        longPressMax: 140,
        superLongMin: 300,
        superLongMax: 2000,
        cancelThreshold: 3000,
      },
      macroBindings: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.profiles.set("default", defaultProfile);
  }

  async getProfiles(): Promise<MacroProfile[]> {
    return Array.from(this.profiles.values());
  }

  async getProfileById(id: string): Promise<MacroProfile | null> {
    return this.profiles.get(id) || null;
  }

  async createProfile(data: InsertMacroProfile): Promise<MacroProfile> {
    const id = `profile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    const profile: MacroProfile = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };
    
    this.profiles.set(id, profile);
    return profile;
  }

  async updateProfile(id: string, data: Partial<MacroProfile>): Promise<MacroProfile> {
    const existing = this.profiles.get(id);
    if (!existing) {
      throw new Error(`Profile ${id} not found`);
    }

    const updated: MacroProfile = {
      ...existing,
      ...data,
      id: existing.id, // Prevent ID change
      createdAt: existing.createdAt, // Preserve creation time
      updatedAt: new Date().toISOString(),
    };

    this.profiles.set(id, updated);
    return updated;
  }

  async deleteProfile(id: string): Promise<void> {
    this.profiles.delete(id);
  }

  async getAbilities(): Promise<AbilityTemplate[]> {
    return this.abilities;
  }

  async getAbilityById(id: string): Promise<AbilityTemplate | null> {
    return this.abilities.find(a => a.id === id) || null;
  }
}

export const macroStorage = new MemMacroStorage();
