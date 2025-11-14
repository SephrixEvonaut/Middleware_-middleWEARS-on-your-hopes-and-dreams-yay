import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Upload } from "lucide-react";
import { useState } from "react";
import { profileSchema } from "@shared/schema";
import type { Profile } from "@shared/schema";

interface ProfileImportProps {
  open: boolean;
  onClose: () => void;
  onImport: (profile: Profile) => void;
}

export function ProfileImport({ open, onClose, onImport }: ProfileImportProps) {
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setContent(text);
      setError(null);
    };
    reader.readAsText(file);
  };

  const validateAndImport = () => {
    try {
      setError(null);
      const parsed = JSON.parse(content);
      const validated = profileSchema.parse(parsed);
      onImport(validated);
      setContent("");
      onClose();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Invalid profile format");
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent data-testid="dialog-import">
        <DialogHeader>
          <DialogTitle>Import Profile</DialogTitle>
          <DialogDescription>
            Import a profile from JSON file or paste JSON content
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file-upload" data-testid="label-file-upload">Upload File</Label>
            <div className="flex items-center gap-2">
              <input
                id="file-upload"
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
                data-testid="input-file-upload"
              />
              <Button
                variant="outline"
                onClick={() => document.getElementById("file-upload")?.click()}
                data-testid="button-choose-file"
                className="w-full"
              >
                <Upload className="w-4 h-4 mr-2" />
                Choose File
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 border-t border-border" />
            <span className="text-xs text-muted-foreground">OR</span>
            <div className="flex-1 border-t border-border" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="json-content">Paste JSON Content</Label>
            <Textarea
              id="json-content"
              placeholder='{"id": "...", "name": "My Profile", ...}'
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                setError(null);
              }}
              data-testid="textarea-json-content"
              className="font-mono text-xs min-h-[200px]"
            />
          </div>

          {error && (
            <Alert variant="destructive" data-testid="alert-import-error">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription className="text-xs">{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            data-testid="button-cancel-import"
          >
            Cancel
          </Button>
          <Button
            onClick={validateAndImport}
            disabled={!content.trim()}
            data-testid="button-import-profile"
          >
            Import Profile
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
