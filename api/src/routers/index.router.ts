import { Router } from "express";
import health from "./health.route.js";

export const router = Router();

// --------------------  Health ------------------------
router.use("/health", health);