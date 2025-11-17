import { useState } from "react";
import type { Profile } from "@shared/schema";
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

interface SWTORExportProps {
  profile: Profile;
}

export function SWTORExport({ profile }: SWTORExportProps) {
  const [characterName, setCharacterName] = useState("");
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

    const xml = exportSWTORKeybinds(profile, characterName.trim());
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

  const mappingCount = profile.inputMappings.length;
  const safeKeyMappings = translateMappingsToSafeKeys(profile);
  const collisionCount = mappingCount - safeKeyMappings.length;

  return (
    <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
      <div className="space-y-4 p-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="character-name" className="text-sm font-medium">
              Character Name
            </Label>
            <Badge variant="secondary" className="text-xs">
              {mappingCount} mappings
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

        {collisionCount > 0 && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-xs text-destructive font-medium">
              Warning: {collisionCount} mapping(s) exceeded safe key limit (68 keys)
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Only the first {safeKeyMappings.length} mappings will be exported.
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
              <p className="font-medium">{safeKeyMappings.length} keybinds generated</p>
              <p className="text-muted-foreground">Using {new Set(safeKeyMappings.map(m => m.outputKey)).size} unique safe keys</p>
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
