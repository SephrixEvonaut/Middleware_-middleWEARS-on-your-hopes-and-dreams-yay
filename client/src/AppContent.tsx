import { useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import Home from "@/pages/home";
import { useProfiles, useCreateProfile, useUpdateProfile } from "@/hooks/use-profiles";
import { Skeleton } from "@/components/ui/skeleton";
import type { Profile, InsertProfile } from "@shared/schema";

export default function AppContent() {
  const { data: profiles, isLoading } = useProfiles();
  const createProfile = useCreateProfile();
  const updateProfile = useUpdateProfile();

  const [currentProfileId, setCurrentProfileId] = useState<string>(() => {
    return localStorage.getItem("gesture-mapper-current-profile") || "";
  });

  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  const currentProfile = profiles?.find(p => p.id === currentProfileId) || profiles?.[0];

  const handleProfileSelect = (profileId: string) => {
    setCurrentProfileId(profileId);
    localStorage.setItem("gesture-mapper-current-profile", profileId);
  };

  const handleProfileUpdate = (updatedProfile: Profile) => {
    if (!currentProfile) return;
    updateProfile.mutate({
      id: currentProfile.id,
      updates: {
        name: updatedProfile.name,
        description: updatedProfile.description,
        favorite: updatedProfile.favorite,
        devices: updatedProfile.devices,
        gestureSettings: updatedProfile.gestureSettings,
        inputMappings: updatedProfile.inputMappings,
      },
    });
  };

  const handleToggleFavorite = () => {
    if (!currentProfile) return;
    updateProfile.mutate({
      id: currentProfile.id,
      updates: {
        favorite: !currentProfile.favorite,
      },
    });
  };

  const handleImportProfile = (importedProfile: Profile) => {
    const insertData: InsertProfile = {
      name: importedProfile.name,
      description: importedProfile.description,
      favorite: importedProfile.favorite || false,
      devices: importedProfile.devices,
      gestureSettings: importedProfile.gestureSettings,
      inputMappings: importedProfile.inputMappings,
    };
    
    createProfile.mutate(insertData, {
      onSuccess: (newProfile) => {
        setCurrentProfileId(newProfile.id);
        localStorage.setItem("gesture-mapper-current-profile", newProfile.id);
      },
    });
  };

  const style = {
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "4rem",
  };

  if (isLoading || !profiles || !currentProfile) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="space-y-4 w-full max-w-md">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar
          currentProfile={currentProfile}
          profiles={profiles}
          selectedDevice="all"
          onDeviceSelect={() => {}}
          onProfileSelect={handleProfileSelect}
          onExport={() => setExportDialogOpen(true)}
          onImport={() => setImportDialogOpen(true)}
        />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between p-2 border-b border-border bg-sidebar" data-testid="header-main">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          <Home
            currentProfile={currentProfile}
            onProfileUpdate={handleProfileUpdate}
            onToggleFavorite={handleToggleFavorite}
            onExport={() => setExportDialogOpen(true)}
            onImport={() => setImportDialogOpen(true)}
            exportDialogOpen={exportDialogOpen}
            importDialogOpen={importDialogOpen}
            onCloseExport={() => setExportDialogOpen(false)}
            onCloseImport={() => setImportDialogOpen(false)}
            onImportProfile={handleImportProfile}
          />
        </div>
      </div>
    </SidebarProvider>
  );
}
