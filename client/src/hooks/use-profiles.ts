import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Profile, InsertProfile } from "@shared/schema";

export function useProfiles() {
  return useQuery<Profile[]>({
    queryKey: ["/api/profiles"],
  });
}

export function useProfile(id: string) {
  return useQuery<Profile>({
    queryKey: ["/api/profiles", id],
    enabled: !!id,
  });
}

export function useCreateProfile() {
  return useMutation({
    mutationFn: async (profile: InsertProfile) => {
      const res = await apiRequest("POST", "/api/profiles", profile);
      return await res.json() as Profile;
    },
    onSuccess: (newProfile) => {
      // Immediately update the query cache with the new profile
      queryClient.setQueryData(["/api/profiles"], (old: Profile[] | undefined) => {
        return old ? [...old, newProfile] : [newProfile];
      });
      queryClient.setQueryData(["/api/profiles", newProfile.id], newProfile);
      // Still invalidate to ensure consistency
      queryClient.invalidateQueries({ queryKey: ["/api/profiles"] });
    },
  });
}

export function useUpdateProfile() {
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<InsertProfile> }) => {
      const res = await apiRequest("PATCH", `/api/profiles/${id}`, updates);
      return await res.json() as Profile;
    },
    onSuccess: (updatedProfile, variables) => {
      // Immediately update the query cache with the returned profile
      queryClient.setQueryData(["/api/profiles"], (old: Profile[] | undefined) => {
        if (!old) return old;
        return old.map(p => p.id === updatedProfile.id ? updatedProfile : p);
      });
      queryClient.setQueryData(["/api/profiles", variables.id], updatedProfile);
      // Still invalidate to ensure consistency
      queryClient.invalidateQueries({ queryKey: ["/api/profiles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/profiles", variables.id] });
    },
  });
}

export function useDeleteProfile() {
  return useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/profiles/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profiles"] });
    },
  });
}
