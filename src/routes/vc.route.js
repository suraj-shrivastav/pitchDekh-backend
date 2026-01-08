import express from "express";
import { extractVCData, getVCById, getVCs } from "../controller/vc.controller.js";
import { authAdminMiddleware, authMiddleware } from "../middleware/supabaseAuth.middleware.js";

const router = express.Router();

router.post("/extract", authMiddleware, authAdminMiddleware, extractVCData);
router.get("/", authMiddleware, getVCs);
router.get("/:id", authMiddleware, getVCById);


export default router;
