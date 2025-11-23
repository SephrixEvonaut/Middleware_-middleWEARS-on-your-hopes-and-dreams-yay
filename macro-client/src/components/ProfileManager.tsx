import React, { useState, useEffect } from "react";
import { MacroProfile } from "../../../macro-shared/schema";

interface ProfileManagerProps {
  currentProfile: MacroProfile | null;
  onProfileChange: (profile: MacroProfile) => void;
}

export function ProfileManager({ currentProfile, onProfileChange }: ProfileManagerProps) {
  const [profiles, setProfiles] = useState<MacroProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = () => {
    setLoading(true);
    fetch("/api/macro-profiles")
      .then(res => res.json())
      .then(data => {
        setProfiles(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load profiles:", err);
        setLoading(false);
      });
  };

  const handleProfileSelect = (profile: MacroProfile) => {
    onProfileChange(profile);
  };

  const createNewProfile = () => {
    const newProfile = {
      name: `Profile ${profiles.length + 1}`,
      description: "New macro profile",
      favorite: false,
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
    };

    fetch("/api/macro-profiles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newProfile),
    })
      .then(res => res.json())
      .then(created => {
        setProfiles([...profiles, created]);
        onProfileChange(created);
      })
      .catch(err => console.error("Failed to create profile:", err));
  };

  if (loading) {
    return (
      <div className="bg-card rounded-lg border p-6">
        <p className="text-muted-foreground">Loading profiles...</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border p-6">
      <h2 className="text-2xl font-bold mb-4">Profiles</h2>

      <div className="space-y-2 mb-4">
        {profiles.map(profile => (
          <button
            key={profile.id}
            onClick={() => handleProfileSelect(profile)}
            className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
              currentProfile?.id === profile.id
                ? "border-primary bg-primary/10"
                : "border-border hover:border-primary/50 hover:bg-accent"
            }`}
          >
            <div className="font-semibold">{profile.name}</div>
            <div className="text-xs text-muted-foreground">
              {profile.macroBindings.length} bindings
            </div>
          </button>
        ))}
      </div>

      <button
        onClick={createNewProfile}
        className="w-full p-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
      >
        + New Profile
      </button>

      {/* Gesture Settings */}
      {currentProfile && (
        <div className="mt-6 pt-6 border-t">
          <h3 className="font-semibold mb-3">Gesture Settings</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Multi-press window:</span>
              <span className="font-mono">{currentProfile.gestureSettings.multiPressWindow}ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Long press:</span>
              <span className="font-mono">
                {currentProfile.gestureSettings.longPressMin}-{currentProfile.gestureSettings.longPressMax}ms
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Super long:</span>
              <span className="font-mono">
                {currentProfile.gestureSettings.superLongMin}-{currentProfile.gestureSettings.superLongMax}ms
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cancel threshold:</span>
              <span className="font-mono">{currentProfile.gestureSettings.cancelThreshold}ms</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
