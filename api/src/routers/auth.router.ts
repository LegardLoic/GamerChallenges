import express from 'express';
import authController from '../controllers/auth.controller.js';
import { checkRoles } from "../middlewares/access-control.middleware.js";

const authRouter = express.Router();
authRouter.post("/register", authController.registerUser);
authRouter.post('/login', authController.loginUser);
authRouter.post("/logout", authController.logoutUser);
authRouter.post("/refresh", authController.refreshAccessToken);
authRouter.get("/me", checkRoles(["member", "author", "admin"]), authController.getAuthenticatedUser);
authRouter.patch("/me", checkRoles(["member", "author", "admin"]), authController.updateProfil);
authRouter.delete("/me", checkRoles(["member", "author", "admin"]), authController.deleteProfil);

export default authRouter;