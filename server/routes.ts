import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProfileSchema, profileSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all profiles
  app.get("/api/profiles", async (req, res) => {
    try {
      const profiles = await storage.getAllProfiles();
      res.json(profiles);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch profiles" });
    }
  });

  // Get single profile
  app.get("/api/profiles/:id", async (req, res) => {
    try {
      const profile = await storage.getProfile(req.params.id);
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }
      res.json(profile);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  // Create new profile
  app.post("/api/profiles", async (req, res) => {
    try {
      const validated = insertProfileSchema.parse(req.body);
      const profile = await storage.createProfile(validated);
      res.status(201).json(profile);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid profile data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create profile" });
    }
  });

  // Update existing profile
  app.patch("/api/profiles/:id", async (req, res) => {
    try {
      const validated = insertProfileSchema.partial().parse(req.body);
      const profile = await storage.updateProfile(req.params.id, validated);
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }
      res.json(profile);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid profile data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // Delete profile
  app.delete("/api/profiles/:id", async (req, res) => {
    try {
      const success = await storage.deleteProfile(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Profile not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete profile" });
    }
  });

  // Validate imported profile
  app.post("/api/profiles/validate", async (req, res) => {
    try {
      const validated = profileSchema.parse(req.body);
      res.json({ valid: true, profile: validated });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ valid: false, errors: error.errors });
      }
      res.status(500).json({ valid: false, error: "Validation failed" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
