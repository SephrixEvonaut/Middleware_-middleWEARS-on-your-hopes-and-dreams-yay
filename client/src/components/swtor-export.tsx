import { useState } from "react";
import type { Profile, ModifierMode } from "@shared/schema";
import { exportSWTORKeybinds, translateMappingsToSafeKeys } from "@shared/swtorExport";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Download, Copy, FileCode } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SWTORExportProps {
  profile: Profile;
}

const MODIFIER_MODE_LABELS: Record<ModifierMode, string> = {
  normal: "Normal",
  ctrl: "Ctrl",
  shift: "Shift",
  alt: "Alt",
  ctrl_shift: "Ctrl+Shift",
  ctrl_alt: "Ctrl+Alt",
  shift_alt: "Shift+Alt",
};

export function SWTORExport({ profile }: SWTORExportProps) {
  const [characterName, setCharacterName] = useState("");
  const [selectedMode, setSelectedMode] = useState<ModifierMode>("normal");
  const [xmlPreview, setXmlPreview] = useState("");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const { toast } = useToast();

  const handleGenerate = () => {
    if (!characterName.trim()) {
      toast({
        title: "Character Name Required",
        description: "Please enter your SWTOR character name before exporting.",
        variant: "destructive",
      });
      return;
    }

    const xml = exportSWTORKeybinds(profile, characterName.trim(), selectedMode);
    setXmlPreview(xml);
    setIsPreviewOpen(true);
  };

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(xmlPreview);
      toast({
        title: "Copied to Clipboard",
        description: "SWTOR keybind XML copied successfully.",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy to clipboard. Please try the download option.",
        variant: "destructive",
      });
    }
  };

  const handleDownload = () => {
    const blob = new Blob([xmlPreview], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${characterName.trim().replace(/\s+/g, "_")}_Keybinds.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Downloaded",
      description: `Keybind file saved as ${a.download}`,
    });
  };

  // Calculate stats per modifier mode
  const modifierModes: ModifierMode[] = ["normal", "ctrl", "shift", "alt", "ctrl_shift", "ctrl_alt", "shift_alt"];
  const mappingsByMode = modifierModes.map((mode) => {
    const count = profile.inputMappings.filter((m) => m.modifierHash === mode).length;
    const safeMappings = translateMappingsToSafeKeys(profile, mode);
    return {
      mode,
      count,
      safeCount: safeMappings.length,
      label: MODIFIER_MODE_LABELS[mode],
    };
  }).filter((stat) => stat.count > 0); // Only show modes with mappings

  const totalMappings = profile.inputMappings.length;
  const selectedModeMappings = translateMappingsToSafeKeys(profile, selectedMode);
  const selectedModeCount = profile.inputMappings.filter((m) => m.modifierHash === selectedMode).length;
  const collisionCount = selectedModeCount - selectedModeMappings.length;

  return (
    <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
      <div className="space-y-4 p-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="character-name" className="text-sm font-medium">
              Character Name
            </Label>
            <Badge variant="secondary" className="text-xs">
              {totalMappings} total mappings
            </Badge>
          </div>
          <Input
            id="character-name"
            placeholder="Enter SWTOR character name..."
            value={characterName}
            onChange={(e) => setCharacterName(e.target.value)}
            data-testid="input-character-name"
          />
          <p className="text-xs text-muted-foreground">
            This will be used in the XML comment for identification
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="modifier-mode" className="text-sm font-medium">
            Modifier Mode to Export
          </Label>
          <Select value={selectedMode} onValueChange={(value) => setSelectedMode(value as ModifierMode)}>
            <SelectTrigger id="modifier-mode" data-testid="select-modifier-mode">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {modifierModes.map((mode) => (
                <SelectItem key={mode} value={mode}>
                  {MODIFIER_MODE_LABELS[mode]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Select which modifier mode's mappings to export
          </p>
        </div>

        {mappingsByMode.length > 0 && (
          <div className="p-3 bg-muted/50 border rounded-md">
            <p className="text-xs font-medium mb-2">Mappings by Modifier Mode:</p>
            <div className="grid grid-cols-2 gap-2">
              {mappingsByMode.map((stat) => (
                <div key={stat.mode} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{stat.label}:</span>
                  <Badge variant="outline" className="text-xs">
                    {stat.safeCount}/{stat.count}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {totalMappings === 0 && (
          <div className="p-3 bg-muted/50 border rounded-md">
            <p className="text-xs text-muted-foreground font-medium">
              No input mappings configured
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Go to "Input Mappings" tab to create gesture-to-action bindings first.
            </p>
          </div>
        )}

        {collisionCount > 0 && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-xs text-destructive font-medium">
              Warning: {collisionCount} mapping(s) exceeded safe key limit (68 keys)
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Only the first {selectedModeMappings.length} mappings will be exported for {MODIFIER_MODE_LABELS[selectedMode]} mode.
            </p>
          </div>
        )}

        <DialogTrigger asChild>
          <Button
            onClick={handleGenerate}
            className="w-full gap-2"
            variant="default"
            data-testid="button-generate-swtor-xml"
          >
            <FileCode className="h-4 w-4" />
            Generate SWTOR Keybinds
          </Button>
        </DialogTrigger>
      </div>

      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>SWTOR Keybind Export</DialogTitle>
          <DialogDescription>
            Generated keybind file for <span className="font-mono font-semibold">{characterName}</span>.
            Save this XML to your SWTOR keybindings folder.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-3 bg-muted/50 rounded-md border">
            <p className="text-xs font-medium mb-1">File Location:</p>
            <code className="text-xs font-mono">
              C:\Users\YOUR_USERNAME\AppData\Local\SWTOR\swtor\settings\Keybindings\
            </code>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">XML Preview</Label>
            <ScrollArea className="h-64 w-full rounded-md border bg-muted/20 p-4">
              <pre className="text-xs font-mono whitespace-pre-wrap" data-testid="xml-preview">
                {xmlPreview}
              </pre>
            </ScrollArea>
          </div>

          <div className="flex items-center justify-between p-3 bg-primary/5 rounded-md border border-primary/20">
            <div className="text-xs">
              <p className="font-medium">{selectedModeMappings.length} keybinds generated for {MODIFIER_MODE_LABELS[selectedMode]} mode</p>
              <p className="text-muted-foreground">Using {new Set(selectedModeMappings.map(m => m.outputKey)).size} unique safe keys (no modifiers)</p>
            </div>
            <Badge variant="default">{profile.name}</Badge>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleCopyToClipboard}
            className="gap-2"
            data-testid="button-copy-xml"
          >
            <Copy className="h-4 w-4" />
            Copy to Clipboard
          </Button>
          <Button
            onClick={handleDownload}
            className="gap-2"
            data-testid="button-download-xml"
          >
            <Download className="h-4 w-4" />
            Download XML
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
