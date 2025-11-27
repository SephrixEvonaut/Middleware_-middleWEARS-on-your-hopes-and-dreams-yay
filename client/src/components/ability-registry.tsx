import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, Trash2, Edit2, Search, X, Keyboard, Tag, AlertTriangle, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Ability, AbilityRegistry, Profile, ProfileAbilityBinding } from "@shared/schema";
import { normalizeAbilityName, getAbilitiesForKey } from "@shared/schema";

interface AbilityRegistryProps {
  currentProfile: Profile;
  onProfileUpdate: (profile: Profile) => void;
}

const AVAILABLE_CATEGORIES = [
  "DPS",
  "Healing",
  "Tank",
  "Utility",
  "Movement",
  "Crowd Control",
  "Defensive",
  "Offensive Cooldown",
  "Buff",
  "Debuff",
  "Other",
];

const AVAILABLE_KEYS = [
  "1", "2", "3", "4", "5", "6", "7", "8", "9", "0",
  "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12",
  "Q", "E", "R", "T", "F", "G", "Z", "X", "C", "V", "B",
  "Tab", "Caps", "Grave",
];

export function AbilityRegistryComponent({ currentProfile, onProfileUpdate }: AbilityRegistryProps) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterKey, setFilterKey] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingAbility, setEditingAbility] = useState<Ability | null>(null);
  const [newAbility, setNewAbility] = useState({
    canonicalName: "",
    aliases: "",
    category: "",
    description: "",
    assignedKey: "",
  });

  // Fetch ability registry
  const { data: registry, isLoading } = useQuery<AbilityRegistry>({
    queryKey: ["/api/abilities"],
  });

  // Mutations
  const addAbilityMutation = useMutation({
    mutationFn: async (ability: Omit<Ability, "id">) => {
      const response = await apiRequest("POST", "/api/abilities", ability);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/abilities"] });
      setIsAddDialogOpen(false);
      resetForm();
      toast({
        title: "Ability Added",
        description: "The ability has been added to the registry.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add ability.",
        variant: "destructive",
      });
    },
  });

  const updateAbilityMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Ability> }) => {
      const response = await apiRequest("PATCH", `/api/abilities/${id}`, updates);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/abilities"] });
      setEditingAbility(null);
      resetForm();
      toast({
        title: "Ability Updated",
        description: "The ability has been updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update ability.",
        variant: "destructive",
      });
    },
  });

  const deleteAbilityMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/abilities/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/abilities"] });
      toast({
        title: "Ability Deleted",
        description: "The ability has been removed from the registry.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete ability.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setNewAbility({
      canonicalName: "",
      aliases: "",
      category: "",
      description: "",
      assignedKey: "",
    });
  };

  // Filter abilities
  const filteredAbilities = useMemo(() => {
    if (!registry?.abilities) return [];
    
    return registry.abilities.filter((ability) => {
      const matchesSearch =
        searchTerm === "" ||
        ability.canonicalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ability.aliases.some((alias) =>
          alias.toLowerCase().includes(searchTerm.toLowerCase())
        );
      
      const matchesCategory =
        filterCategory === "all" || ability.category === filterCategory;
      
      const matchesKey =
        filterKey === "all" || ability.assignedKey === filterKey;
      
      return matchesSearch && matchesCategory && matchesKey;
    });
  }, [registry?.abilities, searchTerm, filterCategory, filterKey]);

  // Group abilities by key for conflict detection
  const abilitiesByKey = useMemo(() => {
    if (!registry?.abilities) return new Map<string, Ability[]>();
    
    const byKey = new Map<string, Ability[]>();
    for (const ability of registry.abilities) {
      if (ability.assignedKey) {
        const key = ability.assignedKey.toLowerCase();
        if (!byKey.has(key)) {
          byKey.set(key, []);
        }
        byKey.get(key)!.push(ability);
      }
    }
    return byKey;
  }, [registry?.abilities]);

  // Get current profile's active ability for a key
  const getActiveAbilityForKey = (key: string): string | undefined => {
    const binding = currentProfile.abilityBindings?.find(
      (b) => b.keybind.toLowerCase() === key.toLowerCase()
    );
    return binding?.abilityId;
  };

  // Set active ability for a key in current profile
  const setActiveAbilityForKey = (key: string, abilityId: string) => {
    const newBindings = [...(currentProfile.abilityBindings || [])];
    const existingIndex = newBindings.findIndex(
      (b) => b.keybind.toLowerCase() === key.toLowerCase()
    );
    
    if (existingIndex >= 0) {
      newBindings[existingIndex] = { ...newBindings[existingIndex], abilityId };
    } else {
      newBindings.push({ keybind: key, abilityId });
    }
    
    onProfileUpdate({
      ...currentProfile,
      abilityBindings: newBindings,
    });
    
    toast({
      title: "Ability Binding Updated",
      description: `Set active ability for key "${key}" in this profile.`,
    });
  };

  const handleSubmit = () => {
    const aliases = newAbility.aliases
      .split(",")
      .map((a) => a.trim())
      .filter((a) => a.length > 0);

    if (editingAbility) {
      updateAbilityMutation.mutate({
        id: editingAbility.id,
        updates: {
          canonicalName: newAbility.canonicalName,
          aliases,
          category: newAbility.category || undefined,
          description: newAbility.description || undefined,
          assignedKey: newAbility.assignedKey || undefined,
        },
      });
    } else {
      addAbilityMutation.mutate({
        canonicalName: newAbility.canonicalName,
        aliases,
        category: newAbility.category || undefined,
        description: newAbility.description || undefined,
        assignedKey: newAbility.assignedKey || undefined,
      });
    }
  };

  const openEditDialog = (ability: Ability) => {
    setEditingAbility(ability);
    setNewAbility({
      canonicalName: ability.canonicalName,
      aliases: ability.aliases.join(", "),
      category: ability.category || "",
      description: ability.description || "",
      assignedKey: ability.assignedKey || "",
    });
    setIsAddDialogOpen(true);
  };

  const closeDialog = () => {
    setIsAddDialogOpen(false);
    setEditingAbility(null);
    resetForm();
  };

  // Keys with conflicts (multiple abilities assigned)
  const keysWithConflicts = useMemo(() => {
    const conflicts: string[] = [];
    abilitiesByKey.forEach((abilities, key) => {
      if (abilities.length > 1) {
        conflicts.push(key);
      }
    });
    return conflicts;
  }, [abilitiesByKey]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8" data-testid="loading-abilities">
        <div className="text-muted-foreground">Loading abilities...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="ability-registry-container">
      {/* Header with search and filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search abilities or aliases..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
            data-testid="input-search-abilities"
          />
        </div>
        
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[150px]" data-testid="select-filter-category">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {AVAILABLE_CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={filterKey} onValueChange={setFilterKey}>
          <SelectTrigger className="w-[120px]" data-testid="select-filter-key">
            <SelectValue placeholder="Key" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Keys</SelectItem>
            {AVAILABLE_KEYS.map((key) => (
              <SelectItem key={key} value={key}>{key}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
          if (!open) closeDialog();
          else setIsAddDialogOpen(true);
        }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-ability">
              <Plus className="w-4 h-4 mr-2" />
              Add Ability
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle data-testid="dialog-title">
                {editingAbility ? "Edit Ability" : "Add New Ability"}
              </DialogTitle>
              <DialogDescription>
                {editingAbility
                  ? "Update the ability details."
                  : "Add a new ability to the registry. Include aliases for alternative names or common typos."}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="canonicalName">Canonical Name</Label>
                <Input
                  id="canonicalName"
                  placeholder="e.g., Force Lightning"
                  value={newAbility.canonicalName}
                  onChange={(e) => setNewAbility({ ...newAbility, canonicalName: e.target.value })}
                  data-testid="input-canonical-name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="aliases">Aliases (comma-separated)</Label>
                <Textarea
                  id="aliases"
                  placeholder="e.g., FL, Force Lite, Lightning, Forcelighting"
                  value={newAbility.aliases}
                  onChange={(e) => setNewAbility({ ...newAbility, aliases: e.target.value })}
                  className="resize-none h-20"
                  data-testid="input-aliases"
                />
                <p className="text-xs text-muted-foreground">
                  Add typos, nicknames, and abbreviations that should map to this ability.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={newAbility.category}
                  onValueChange={(value) => setNewAbility({ ...newAbility, category: value })}
                >
                  <SelectTrigger data-testid="select-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="assignedKey">Assigned Key</Label>
                <Select
                  value={newAbility.assignedKey || "none"}
                  onValueChange={(value) => setNewAbility({ ...newAbility, assignedKey: value === "none" ? "" : value })}
                >
                  <SelectTrigger data-testid="select-assigned-key">
                    <SelectValue placeholder="Select keybind" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No key assigned</SelectItem>
                    {AVAILABLE_KEYS.map((key) => (
                      <SelectItem key={key} value={key}>{key}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of the ability..."
                  value={newAbility.description}
                  onChange={(e) => setNewAbility({ ...newAbility, description: e.target.value })}
                  className="resize-none h-16"
                  data-testid="input-description"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!newAbility.canonicalName.trim()}
                data-testid="button-submit-ability"
              >
                {editingAbility ? "Update" : "Add"} Ability
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Conflict Warning */}
      {keysWithConflicts.length > 0 && (
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2 text-amber-600">
              <AlertTriangle className="w-4 h-4" />
              Key Conflicts Detected
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground mb-2">
              The following keys have multiple abilities assigned. Select which ability should be active for this profile.
            </p>
            <div className="flex flex-wrap gap-2">
              {keysWithConflicts.map((key) => (
                <Badge
                  key={key}
                  variant="outline"
                  className="border-amber-500 text-amber-600"
                  data-testid={`badge-conflict-${key}`}
                >
                  {key} ({abilitiesByKey.get(key.toLowerCase())?.length || 0} abilities)
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold" data-testid="stat-total-abilities">
              {registry?.abilities?.length || 0}
            </div>
            <div className="text-xs text-muted-foreground">Total Abilities</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold" data-testid="stat-assigned-keys">
              {registry?.abilities?.filter((a) => a.assignedKey).length || 0}
            </div>
            <div className="text-xs text-muted-foreground">With Keybinds</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-amber-600" data-testid="stat-conflicts">
              {keysWithConflicts.length}
            </div>
            <div className="text-xs text-muted-foreground">Key Conflicts</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold" data-testid="stat-profile-bindings">
              {currentProfile.abilityBindings?.length || 0}
            </div>
            <div className="text-xs text-muted-foreground">Profile Bindings</div>
          </CardContent>
        </Card>
      </div>

      {/* Abilities List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ability Registry</CardTitle>
          <CardDescription>
            {filteredAbilities.length} abilities shown
            {searchTerm || filterCategory !== "all" || filterKey !== "all" ? " (filtered)" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            {filteredAbilities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Tag className="w-8 h-8 mb-2 opacity-50" />
                <p>No abilities found.</p>
                {(searchTerm || filterCategory !== "all" || filterKey !== "all") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-primary hover:text-primary"
                    onClick={() => {
                      setSearchTerm("");
                      setFilterCategory("all");
                      setFilterKey("all");
                    }}
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            ) : (
              <Accordion type="multiple" className="space-y-2">
                {filteredAbilities.map((ability) => {
                  const keyConflict = ability.assignedKey
                    ? (abilitiesByKey.get(ability.assignedKey.toLowerCase())?.length || 0) > 1
                    : false;
                  const isActiveForProfile = ability.assignedKey
                    ? getActiveAbilityForKey(ability.assignedKey) === ability.id
                    : false;

                  return (
                    <AccordionItem
                      key={ability.id}
                      value={ability.id}
                      className="border rounded-md px-3"
                      data-testid={`ability-item-${ability.id}`}
                    >
                      <AccordionTrigger className="hover:no-underline py-2">
                        <div className="flex items-center gap-3 flex-1 text-left">
                          <span className="font-medium">{ability.canonicalName}</span>
                          <div className="flex items-center gap-1.5">
                            {ability.category && (
                              <Badge variant="secondary" className="text-xs">
                                {ability.category}
                              </Badge>
                            )}
                            {ability.assignedKey && (
                              <Badge
                                variant={keyConflict ? "outline" : "default"}
                                className={keyConflict ? "border-amber-500 text-amber-600" : ""}
                              >
                                <Keyboard className="w-3 h-3 mr-1" />
                                {ability.assignedKey}
                                {keyConflict && <AlertTriangle className="w-3 h-3 ml-1" />}
                              </Badge>
                            )}
                            {isActiveForProfile && (
                              <Badge variant="default" className="bg-green-600">
                                <Check className="w-3 h-3 mr-1" />
                                Active
                              </Badge>
                            )}
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-3">
                        <div className="space-y-3">
                          {ability.description && (
                            <p className="text-sm text-muted-foreground">
                              {ability.description}
                            </p>
                          )}
                          
                          {ability.aliases.length > 0 && (
                            <div>
                              <span className="text-xs text-muted-foreground block mb-1">
                                Aliases:
                              </span>
                              <div className="flex flex-wrap gap-1">
                                {ability.aliases.map((alias, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {alias}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Profile Selection for Conflicting Keys */}
                          {keyConflict && ability.assignedKey && (
                            <div className="pt-2 border-t">
                              <span className="text-xs text-muted-foreground block mb-2">
                                Multiple abilities share key "{ability.assignedKey}". Select active for this profile:
                              </span>
                              <Button
                                size="sm"
                                variant={isActiveForProfile ? "default" : "outline"}
                                onClick={() => setActiveAbilityForKey(ability.assignedKey!, ability.id)}
                                className={isActiveForProfile ? "bg-green-600 hover:bg-green-700" : ""}
                                data-testid={`button-set-active-${ability.id}`}
                              >
                                {isActiveForProfile ? (
                                  <>
                                    <Check className="w-4 h-4 mr-1" />
                                    Active in Profile
                                  </>
                                ) : (
                                  "Set as Active for This Profile"
                                )}
                              </Button>
                            </div>
                          )}
                          
                          <div className="flex gap-2 pt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditDialog(ability)}
                              data-testid={`button-edit-${ability.id}`}
                            >
                              <Edit2 className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-destructive hover:text-destructive"
                                  data-testid={`button-delete-${ability.id}`}
                                >
                                  <Trash2 className="w-4 h-4 mr-1" />
                                  Delete
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Ability</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{ability.canonicalName}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteAbilityMutation.mutate(ability.id)}
                                    className="bg-destructive hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Key Conflict Resolution Section */}
      {keysWithConflicts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Resolve Key Conflicts for Profile: {currentProfile.name}
            </CardTitle>
            <CardDescription>
              Select which ability should be active for each conflicting key in this profile.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Key</TableHead>
                  <TableHead>Available Abilities</TableHead>
                  <TableHead className="w-[200px]">Active for Profile</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {keysWithConflicts.map((key) => {
                  const abilities = abilitiesByKey.get(key.toLowerCase()) || [];
                  const activeId = getActiveAbilityForKey(key);
                  
                  return (
                    <TableRow key={key} data-testid={`conflict-row-${key}`}>
                      <TableCell>
                        <Badge variant="outline">{key}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {abilities.map((a) => (
                            <Badge
                              key={a.id}
                              variant={activeId === a.id ? "default" : "secondary"}
                              className={activeId === a.id ? "bg-green-600" : ""}
                            >
                              {a.canonicalName}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={activeId || ""}
                          onValueChange={(value) => setActiveAbilityForKey(key, value)}
                        >
                          <SelectTrigger className="h-8" data-testid={`select-active-${key}`}>
                            <SelectValue placeholder="Select ability" />
                          </SelectTrigger>
                          <SelectContent>
                            {abilities.map((a) => (
                              <SelectItem key={a.id} value={a.id}>
                                {a.canonicalName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
