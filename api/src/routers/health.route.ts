import { Router } from "express";
// import { emailTest } from "../services/emails/emailManager.service.js";
import healthController from "../controllers/health.controller.js";

const router = Router();

// --------------------  Health -----------------------
router.get("/", healthController.checking);


export default router;
