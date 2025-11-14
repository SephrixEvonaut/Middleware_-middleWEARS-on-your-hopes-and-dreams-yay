import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  Gamepad2,
  Keyboard,
  Mouse,
  Gauge,
  Settings,
  FileDown,
  FileUp,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Profile } from "@shared/schema";

interface AppSidebarProps {
  currentProfile?: Profile;
  profiles: Profile[];
  selectedDevice: string;
  onDeviceSelect: (device: string) => void;
  onProfileSelect: (profileId: string) => void;
  onExport: () => void;
  onImport: () => void;
}

const devices = [
  { id: "keyboard", name: "Keyboard", icon: Keyboard, description: "Standard + SharpKeys" },
  { id: "azeron", name: "Azeron Cyborg", icon: Gamepad2, description: "29-button gaming keypad" },
  { id: "razer_mmo", name: "Razer MMO Mouse", icon: Mouse, description: "12 side buttons" },
  { id: "swiftpoint", name: "Swiftpoint Mouse", icon: Mouse, description: "Tilt sensors" },
  { id: "fsr_sensor", name: "FSR Sensors", icon: Gauge, description: "Analog pressure" },
  { id: "gesture", name: "Gesture Settings", icon: Settings, description: "Timing & detection" },
];

export function AppSidebar({
  currentProfile,
  profiles,
  selectedDevice,
  onDeviceSelect,
  onProfileSelect,
  onExport,
  onImport,
}: AppSidebarProps) {
  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b border-sidebar-border" data-testid="sidebar-header">
        <div className="flex items-center gap-2 mb-3">
          <Gamepad2 className="w-5 h-5 text-sidebar-primary" data-testid="icon-sidebar-logo" />
          <h1 className="text-lg font-semibold text-sidebar-foreground" data-testid="text-app-title">Gesture Mapper</h1>
        </div>
        <Select value={currentProfile?.id} onValueChange={onProfileSelect}>
          <SelectTrigger data-testid="select-profile" className="h-9">
            <SelectValue placeholder="Select profile" />
          </SelectTrigger>
          <SelectContent>
            {profiles.map((profile) => (
              <SelectItem key={profile.id} value={profile.id} data-testid={`select-item-profile-${profile.id}`}>
                <div className="flex items-center gap-2">
                  {profile.favorite && <Star className="w-3 h-3 fill-current" data-testid={`icon-favorite-${profile.id}`} />}
                  <span>{profile.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SidebarHeader>

      <SidebarContent className="p-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase text-muted-foreground font-medium">
            Devices
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {devices.map((device) => (
                <SidebarMenuItem key={device.id}>
                  <SidebarMenuButton
                    onClick={() => onDeviceSelect(device.id)}
                    isActive={selectedDevice === device.id}
                    data-testid={`nav-${device.id}`}
                    className="hover-elevate active-elevate-2"
                  >
                    <device.icon className="w-4 h-4" />
                    <div className="flex flex-col items-start gap-0">
                      <span className="text-sm font-medium">{device.name}</span>
                      <span className="text-xs text-muted-foreground">{device.description}</span>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <div className="flex flex-col gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            data-testid="button-export"
            className="w-full justify-start gap-2"
          >
            <FileDown className="w-4 h-4" />
            Export Profile
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onImport}
            data-testid="button-import"
            className="w-full justify-start gap-2"
          >
            <FileUp className="w-4 h-4" />
            Import Profile
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
