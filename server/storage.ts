import { type Profile, type InsertProfile } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Profile operations
  getAllProfiles(): Promise<Profile[]>;
  getProfile(id: string): Promise<Profile | undefined>;
  createProfile(profile: InsertProfile): Promise<Profile>;
  updateProfile(id: string, profile: Partial<InsertProfile>): Promise<Profile | undefined>;
  deleteProfile(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private profiles: Map<string, Profile>;

  constructor() {
    this.profiles = new Map();
    this.seedDefaultProfile();
  }

  private seedDefaultProfile() {
    const defaultProfile: Profile = {
      id: "default-profile",
      name: "Default Profile",
      description: "Standard gaming configuration" as string | null,
      favorite: false,
      devices: {
        keyboard: {
          enabled: true,
          sharpKeysCompat: true,
          customKeyMap: {},
          detectRemapping: true,
        },
        azeron: {
          enabled: true,
          buttonCount: 29,
          thumbPad: true,
          sensitivity: 50,
        },
        razerMMO: {
          enabled: true,
          sideButtons: 12,
          dpiStages: [800, 1600, 3200],
          pollingRate: 1000,
        },
        swiftpoint: {
          enabled: true,
          tiltSensors: true,
          tiltSensitivity: 50,
          hapticFeedback: true,
        },
        fsrSensor: {
          enabled: true,
          analogThresholds: [0, 25, 50, 75, 100],
          calibrationCurve: "linear",
          deadzone: 5,
        },
      },
      gestureSettings: {
        multiPressWindow: 350,
        longPressMin: 80,
        longPressMax: 140,
        cancelThreshold: 200,
        debounceDelay: 10,
        chargeMinHold: 300,
        chargeMaxHold: 2000,
      },
      inputMappings: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.profiles.set(defaultProfile.id, defaultProfile);
  }

  async getAllProfiles(): Promise<Profile[]> {
    return Array.from(this.profiles.values());
  }

  async getProfile(id: string): Promise<Profile | undefined> {
    return this.profiles.get(id);
  }

  async createProfile(insertProfile: InsertProfile): Promise<Profile> {
    const id = randomUUID();
    const now = new Date();
    const profile: Profile = {
      ...insertProfile,
      description: insertProfile.description ?? null,
      favorite: insertProfile.favorite ?? false,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.profiles.set(id, profile);
    return profile;
  }

  async updateProfile(
    id: string,
    updates: Partial<InsertProfile>
  ): Promise<Profile | undefined> {
    const existing = this.profiles.get(id);
    if (!existing) {
      return undefined;
    }

    const updated: Profile = {
      ...existing,
      ...updates,
      id,
      updatedAt: new Date(),
    };
    this.profiles.set(id, updated);
    return updated;
  }

  async deleteProfile(id: string): Promise<boolean> {
    return this.profiles.delete(id);
  }
}

export const storage = new MemStorage();
