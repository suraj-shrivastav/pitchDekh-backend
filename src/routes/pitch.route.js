import express from "express";
import upload from "../middleware/upload.middleware.js";
import { authMiddleware } from "../middleware/supabaseAuth.middleware.js";
import { analyzePitch, deepResearch, getUserPitches, getPitch } from "../controller/pitch.controller.js";

const router = express.Router();

router.post("/", authMiddleware, analyzePitch);
router.get("/all", authMiddleware, getUserPitches);
router.get("/:id", authMiddleware, getPitch);
router.post("/research", authMiddleware, deepResearch);

export default router;
