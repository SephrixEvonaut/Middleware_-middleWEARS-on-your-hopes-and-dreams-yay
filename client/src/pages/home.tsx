import { useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Save, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useModifierContext } from "@/contexts/ModifierContext";
import { DeviceConfigKeyboard } from "@/components/device-config-keyboard";
import { DeviceConfigAzeron } from "@/components/device-config-azeron";
import { DeviceConfigRazer } from "@/components/device-config-razer";
import { DeviceConfigSwiftpoint } from "@/components/device-config-swiftpoint";
import { DeviceConfigFSR } from "@/components/device-config-fsr";
import { GestureSettingsComponent } from "@/components/gesture-settings";
import { GestureSimulator } from "@/components/gesture-simulator";
import { ModifierToggle } from "@/components/modifier-toggle";
import { MappingDesigner } from "@/components/mapping-designer";
import { ProfileExport } from "@/components/profile-export";
import { ProfileImport } from "@/components/profile-import";
import { SequenceBuilder } from "@/components/sequence-builder";
import { AbilityRegistryComponent } from "@/components/ability-registry";
import type { Profile, MacroProfile } from "@shared/schema";

interface HomeProps {
  currentProfile: Profile;
  onProfileUpdate: (profile: Profile) => void;
  onToggleFavorite: () => void;
  onExport: () => void;
  onImport: () => void;
  exportDialogOpen: boolean;
  importDialogOpen: boolean;
  onCloseExport: () => void;
  onCloseImport: () => void;
  onImportProfile: (profile: Profile) => void;
}

export default function Home({
  currentProfile,
  onProfileUpdate,
  onToggleFavorite,
  onExport,
  onImport,
  exportDialogOpen,
  importDialogOpen,
  onCloseExport,
  onCloseImport,
  onImportProfile,
}: HomeProps) {
  const [selectedDevice, setSelectedDevice] = useState<string>("keyboard");
  const { toast } = useToast();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const { modifierState, toggleModifier, setMode, resetToDefaults, hasChanges: hasModifierChanges } = useModifierContext();

  // Macro profile state for Sequence Builder
  const [macroProfile, setMacroProfile] = useState<MacroProfile>({
    name: currentProfile.name + " Macros",
    description: "Macro sequences for local agent",
    gestureSettings: {
      multiPressWindow: 350,
      debounceDelay: 10,
      longPressMin: 80,
      longPressMax: 140,
      superLongMin: 300,
      superLongMax: 2000,
      cancelThreshold: 3000,
      defaultMinDelay: 30,
      defaultMaxDelay: 40,
      defaultEchoHits: 1,
    },
    macros: [],
  });

  const handleProfileChange = (updates: Partial<Profile>) => {
    const updatedProfile = { ...currentProfile, ...updates };
    onProfileUpdate(updatedProfile);
    setHasUnsavedChanges(true);
  };

  const handleSave = () => {
    // Profile is already being updated in real-time via onProfileUpdate
    // This just acknowledges the save to the user
    setHasUnsavedChanges(false);
    toast({
      title: "Profile saved",
      description: `"${currentProfile.name}" has been updated successfully.`,
    });
  };

  const handleSaveModifierDefaults = () => {
    handleProfileChange({ modifierDefaults: modifierState });
    toast({
      title: "Modifier defaults saved",
      description: "Modifier toggle state has been saved as profile default.",
    });
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-border bg-card" data-testid="header-profile">
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold" data-testid="text-profile-name">{currentProfile.name}</h1>
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleFavorite}
                data-testid="button-toggle-favorite"
                className="h-8 w-8"
              >
                <Star
                  className={`w-4 h-4 ${
                    currentProfile.favorite ? "fill-current text-yellow-500" : ""
                  }`}
                />
              </Button>
            </div>
            {currentProfile.description && (
              <p className="text-sm text-muted-foreground">{currentProfile.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasUnsavedChanges && (
            <span className="text-xs text-muted-foreground mr-2" data-testid="text-unsaved-changes">Unsaved changes</span>
          )}
          <Button
            variant="default"
            onClick={handleSave}
            data-testid="button-save"
            disabled={!hasUnsavedChanges}
          >
            <Save className="w-4 h-4 mr-2" />
            Save Profile
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-6">
        <Tabs defaultValue="configure" className="w-full" data-testid="tabs-main">
          <TabsList className="mb-6" data-testid="tabs-list-main">
            <TabsTrigger value="configure" data-testid="tab-configure">
              Configure Devices
            </TabsTrigger>
            <TabsTrigger value="test" data-testid="tab-test">
              Test Gestures
            </TabsTrigger>
            <TabsTrigger value="map" data-testid="tab-map">
              Input Mappings
            </TabsTrigger>
            <TabsTrigger value="sequences" data-testid="tab-sequences">
              Sequence Builder
            </TabsTrigger>
            <TabsTrigger value="abilities" data-testid="tab-abilities">
              Ability Registry
            </TabsTrigger>
          </TabsList>

          <TabsContent value="configure" className="space-y-6" data-testid="tab-content-configure">
            {selectedDevice === "keyboard" && (
              <DeviceConfigKeyboard
                config={currentProfile.devices.keyboard}
                onChange={(keyboard) =>
                  handleProfileChange({
                    devices: { ...currentProfile.devices, keyboard },
                  })
                }
              />
            )}

            {selectedDevice === "azeron" && (
              <DeviceConfigAzeron
                config={currentProfile.devices.azeron}
                onChange={(azeron) =>
                  handleProfileChange({
                    devices: { ...currentProfile.devices, azeron },
                  })
                }
              />
            )}

            {selectedDevice === "razer_mmo" && (
              <DeviceConfigRazer
                config={currentProfile.devices.razerMMO}
                onChange={(razerMMO) =>
                  handleProfileChange({
                    devices: { ...currentProfile.devices, razerMMO },
                  })
                }
              />
            )}

            {selectedDevice === "swiftpoint" && (
              <DeviceConfigSwiftpoint
                config={currentProfile.devices.swiftpoint}
                onChange={(swiftpoint) =>
                  handleProfileChange({
                    devices: { ...currentProfile.devices, swiftpoint },
                  })
                }
              />
            )}

            {selectedDevice === "fsr_sensor" && (
              <DeviceConfigFSR
                config={currentProfile.devices.fsrSensor}
                onChange={(fsrSensor) =>
                  handleProfileChange({
                    devices: { ...currentProfile.devices, fsrSensor },
                  })
                }
              />
            )}

            {selectedDevice === "gesture" && (
              <GestureSettingsComponent
                settings={currentProfile.gestureSettings}
                onChange={(gestureSettings) =>
                  handleProfileChange({ gestureSettings })
                }
              />
            )}

            {/* Always show all device configs */}
            <div className="grid gap-6 lg:grid-cols-2">
              <DeviceConfigKeyboard
                config={currentProfile.devices.keyboard}
                onChange={(keyboard) =>
                  handleProfileChange({
                    devices: { ...currentProfile.devices, keyboard },
                  })
                }
              />
              <DeviceConfigAzeron
                config={currentProfile.devices.azeron}
                onChange={(azeron) =>
                  handleProfileChange({
                    devices: { ...currentProfile.devices, azeron },
                  })
                }
              />
              <DeviceConfigRazer
                config={currentProfile.devices.razerMMO}
                onChange={(razerMMO) =>
                  handleProfileChange({
                    devices: { ...currentProfile.devices, razerMMO },
                  })
                }
              />
              <DeviceConfigSwiftpoint
                config={currentProfile.devices.swiftpoint}
                onChange={(swiftpoint) =>
                  handleProfileChange({
                    devices: { ...currentProfile.devices, swiftpoint },
                  })
                }
              />
              <DeviceConfigFSR
                config={currentProfile.devices.fsrSensor}
                onChange={(fsrSensor) =>
                  handleProfileChange({
                    devices: { ...currentProfile.devices, fsrSensor },
                  })
                }
              />
              <GestureSettingsComponent
                settings={currentProfile.gestureSettings}
                onChange={(gestureSettings) =>
                  handleProfileChange({ gestureSettings })
                }
              />
            </div>
          </TabsContent>

          <TabsContent value="test" data-testid="tab-content-test">
            <div className="space-y-6">
              <GestureSimulator 
                settings={currentProfile.gestureSettings}
                onSettingsChange={(gestureSettings) => handleProfileChange({ gestureSettings })}
              />
              <ModifierToggle
                modifierState={modifierState}
                onToggleModifier={toggleModifier}
                onSetMode={setMode}
                onReset={resetToDefaults}
                onSave={handleSaveModifierDefaults}
                hasChanges={hasModifierChanges}
              />
            </div>
          </TabsContent>

          <TabsContent value="map" data-testid="tab-content-map">
            <MappingDesigner
              profile={currentProfile}
              onUpdate={(updatedProfile) =>
                onProfileUpdate(updatedProfile)
              }
            />
          </TabsContent>

          <TabsContent value="sequences" className="h-[calc(100vh-280px)]" data-testid="tab-content-sequences">
            <SequenceBuilder
              macroProfile={macroProfile}
              onUpdate={setMacroProfile}
            />
          </TabsContent>

          <TabsContent value="abilities" data-testid="tab-content-abilities">
            <AbilityRegistryComponent
              currentProfile={currentProfile}
              onProfileUpdate={onProfileUpdate}
            />
          </TabsContent>
        </Tabs>
      </main>

      {/* Export/Import Dialogs */}
      <ProfileExport
        open={exportDialogOpen}
        onClose={onCloseExport}
        profile={currentProfile}
      />
      <ProfileImport
        open={importDialogOpen}
        onClose={onCloseImport}
        onImport={onImportProfile}
      />
    </div>
  );
}
