import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Copy, Download, Check } from "lucide-react";
import { useState } from "react";
import type { Profile } from "@shared/schema";

interface ProfileExportProps {
  open: boolean;
  onClose: () => void;
  profile: Profile;
}

export function ProfileExport({ open, onClose, profile }: ProfileExportProps) {
  const [copied, setCopied] = useState(false);
  const [format, setFormat] = useState<"json" | "javascript">("json");

  const generateJSON = () => {
    return JSON.stringify(profile, null, 2);
  };

  const generateJavaScript = () => {
    return `// Gesture Mapper Profile: ${profile.name}
export const inputConfig = ${JSON.stringify({
  devices: profile.devices,
  gestureSettings: profile.gestureSettings,
  outputMapping: {
    inputMappings: profile.inputMappings,
  },
}, null, 2)};

export default inputConfig;
`;
  };

  const getExportContent = () => {
    return format === "json" ? generateJSON() : generateJavaScript();
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(getExportContent());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadFile = () => {
    const content = getExportContent();
    const extension = format === "json" ? "json" : "js";
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${profile.name.toLowerCase().replace(/\s+/g, "-")}-profile.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl" data-testid="dialog-export">
        <DialogHeader>
          <DialogTitle>Export Profile</DialogTitle>
          <DialogDescription>
            Export "{profile.name}" as JSON or JavaScript config file
          </DialogDescription>
        </DialogHeader>

        <Tabs value={format} onValueChange={(v) => setFormat(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="json" data-testid="tab-json">JSON</TabsTrigger>
            <TabsTrigger value="javascript" data-testid="tab-javascript">JavaScript</TabsTrigger>
          </TabsList>

          <TabsContent value="json" className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="font-mono" data-testid="badge-filename-json">profile.json</Badge>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyToClipboard}
                  data-testid="button-copy-json"
                >
                  {copied ? <Check className="w-3 h-3 mr-2" /> : <Copy className="w-3 h-3 mr-2" />}
                  {copied ? "Copied!" : "Copy"}
                </Button>
                <Button
                  size="sm"
                  onClick={downloadFile}
                  data-testid="button-download-json"
                >
                  <Download className="w-3 h-3 mr-2" />
                  Download
                </Button>
              </div>
            </div>
            <pre className="p-4 bg-muted/30 rounded-lg border border-border overflow-x-auto max-h-96 text-xs font-mono" data-testid="code-preview-json">
              {generateJSON()}
            </pre>
          </TabsContent>

          <TabsContent value="javascript" className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="font-mono" data-testid="badge-filename-js">config.js</Badge>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyToClipboard}
                  data-testid="button-copy-js"
                >
                  {copied ? <Check className="w-3 h-3 mr-2" /> : <Copy className="w-3 h-3 mr-2" />}
                  {copied ? "Copied!" : "Copy"}
                </Button>
                <Button
                  size="sm"
                  onClick={downloadFile}
                  data-testid="button-download-js"
                >
                  <Download className="w-3 h-3 mr-2" />
                  Download
                </Button>
              </div>
            </div>
            <pre className="p-4 bg-muted/30 rounded-lg border border-border overflow-x-auto max-h-96 text-xs font-mono" data-testid="code-preview-js">
              {generateJavaScript()}
            </pre>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
