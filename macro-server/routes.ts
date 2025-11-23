import { Router } from "express";
import { macroStorage } from "./storage";
import { insertMacroProfileSchema } from "../macro-shared/schema";

const router = Router();

// ============================================================================
// PROFILE ROUTES
// ============================================================================

// Get all profiles
router.get("/api/macro-profiles", async (req, res) => {
  try {
    const profiles = await macroStorage.getProfiles();
    res.json(profiles);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch profiles" });
  }
});

// Get profile by ID
router.get("/api/macro-profiles/:id", async (req, res) => {
  try {
    const profile = await macroStorage.getProfileById(req.params.id);
    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// Create profile
router.post("/api/macro-profiles", async (req, res) => {
  try {
    const validated = insertMacroProfileSchema.parse(req.body);
    const profile = await macroStorage.createProfile(validated);
    res.status(201).json(profile);
  } catch (error) {
    res.status(400).json({ error: "Invalid profile data" });
  }
});

// Update profile
router.patch("/api/macro-profiles/:id", async (req, res) => {
  try {
    const profile = await macroStorage.updateProfile(req.params.id, req.body);
    res.json(profile);
  } catch (error: any) {
    if (error.message.includes("not found")) {
      return res.status(404).json({ error: "Profile not found" });
    }
    res.status(400).json({ error: "Failed to update profile" });
  }
});

// Delete profile
router.delete("/api/macro-profiles/:id", async (req, res) => {
  try {
    await macroStorage.deleteProfile(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Failed to delete profile" });
  }
});

// ============================================================================
// ABILITY ROUTES
// ============================================================================

// Get all abilities
router.get("/api/abilities", async (req, res) => {
  try {
    const abilities = await macroStorage.getAbilities();
    res.json(abilities);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch abilities" });
  }
});

// Get ability by ID
router.get("/api/abilities/:id", async (req, res) => {
  try {
    const ability = await macroStorage.getAbilityById(req.params.id);
    if (!ability) {
      return res.status(404).json({ error: "Ability not found" });
    }
    res.json(ability);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch ability" });
  }
});

export default router;
