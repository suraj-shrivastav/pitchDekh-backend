import express from "express";
const router = express.Router();

import { getEfficientMatches } from "../controller/match.controller.js";


router.post("/vcs", getEfficientMatches);

export default router;