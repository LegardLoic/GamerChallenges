import { Router } from "express";
import health from "./health.router.js";
import authRouter from "./auth.router.js";

export const router = Router();

// --------------------  Health ------------------------
router.use("/health", health);

// --------------------  Auth ------------------------
router.use("/auth", authRouter);