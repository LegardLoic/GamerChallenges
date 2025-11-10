import argon2 from "argon2";
import type { Request, Response } from "express";
import z from "zod";
import { BadRequestError, ConflictError, UnauthorizedError } from "../lib/errors.js";
import { prisma } from "../models/index.js";
import { generateAuthenticationTokens, setAccessTokenCookie, setRefreshTokenCookie, replaceRefreshTokenInDatabase} from "../lib/tokens.js";
import { Prisma } from '@prisma/client';

const authController = {
    async registerUser(req: Request, res: Response) {
        // Récupérer le body et le valider avec zod
        const registerUserBodySchema = z.object({
            firstname: z.string().min(1),
            lastname: z.string().min(1),
            email: z.email(),
            password: z.string()
              .min(12, "Password should have minimum length of 12")
              .max(100, "Password is too long" )
              .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/, "Password must include at least 1 special character, 1 uppercase letter, 1 lowercase letter, and 1 number"),
            confirm: z.string(),
          });
        const { firstname, lastname, email, password, confirm } = await registerUserBodySchema.parseAsync(req.body);
      
        // Vérifier que le mot de passe et sa confirmation correspondent
        if (password !== confirm) {
          throw new BadRequestError("Password and confirmation do not match");
        }
      
        // Vérifier que l'email n'est pas déjà pris
        const alreadyExistingUser = await prisma.user.findFirst({ where: { email }});
        if (alreadyExistingUser) {
          throw new ConflictError("Email already taken");
        }
      
        // Hasher le mot de passe (argon2id (NPM) > scrypt (Node.js) > bcrypt (NPM)) (recommandations : OWASP)
        const hashedPassword = await argon2.hash(password);
      
        // On stock l'utilisateur en BDD
        const user = await prisma.user.create({ data: {
          firstname,
          lastname,
          email,
          password: hashedPassword
        }});
      
        // Note : parfois à ce stade, on connecte l'utilisateur dès l'inscription. Mais ici, dans une approche RESTful, on ne le fera pas.
      
        res.status(201).json({
          id: user.id,
          firstname: user.firstname,
          lastname: user.lastname,
          email: user.email,
          created_at: user.created_at,
          updated_at: user.updated_at
        });
      },
      
      async loginUser(req: Request, res: Response) {
        // Récupérer et parser le body si possible avec Zod (pour s'assurer des types que l'on manipule)
        const loginUserBodySchema = z.object({
            email: z.email(),
            password: z
              .string({error: (iss) => iss.input === undefined ? "Password is required." : "Invalid Password.",})
              .min(12, "Password should have minimum length of 12")
              .max(100, "Password is too long" )
              .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/, "Password must include at least 1 special character, 1 uppercase letter, 1 lowercase letter, and 1 number")
          });
        const { email, password } = await loginUserBodySchema.parseAsync(req.body);
      
        // Récupérer le user dans la BDD (si pas de user -> 401 Unauthorized)
        const user = await prisma.user.findFirst({ where: { email } });
        if (! user) {
          throw new UnauthorizedError("Email and password do not match");
        }
      
        // Comparer le mot de passe fourni avec le hash (si pas de match -> 401 Unauthorized)
        const isMatching = await argon2.verify(user.password, password);
        if (! isMatching) {
          throw new UnauthorizedError("Email and password do not match");
        }
      
        // Générer les tokens d'authentification
        const { accessToken, refreshToken } = generateAuthenticationTokens(user);
      
        // On retire le token existant de l'utilisateur avant d'en créer un nouveau
        await replaceRefreshTokenInDatabase(refreshToken, user);
        
        // Ajouter les tokens aux cookies (via headers)
        setAccessTokenCookie(res, accessToken);
        setRefreshTokenCookie(res, refreshToken);
      
        // Répondre au client, on place également le JWT dans la réponse
        res.json({ accessToken, refreshToken });
      },
      
      async logoutUser(_: Request, res: Response) {
        const randomStringToUnsetCookieValueOnClient = Math.random().toString();
        res.cookie("accessToken", randomStringToUnsetCookieValueOnClient);
        res.cookie("refreshToken", randomStringToUnsetCookieValueOnClient);
        res.status(204).json({ status: 204, message: "Successfully logged out"});
      },
      
      async refreshAccessToken(req: Request, res: Response) {
        // Récupérer le token dans les cookies ou dans le body
        const rawToken = req.cookies?.refreshToken || req.body?.refreshToken;
        if (! rawToken) {
          throw new UnauthorizedError("Refresh token not provided");
        }
      
        // Rechercher le refresh token en base de données, avec son utilisateur associé
        const existingRefreshToken = await prisma.refreshToken.findFirst({
          where: { token: rawToken },
          include: { user: true }
        });
        if (! existingRefreshToken) {
          throw new UnauthorizedError("Invalid refresh token");
        }
      
        // Vérifier la validité du token
        if (existingRefreshToken.expired_at < new Date()) {
          await prisma.refreshToken.delete({ where: { id: existingRefreshToken.id } }); // On le supprime au passage
          throw new UnauthorizedError("Expired refresh token");
        }
      
        // Générer les tokens d'authentification
        const { accessToken, refreshToken } = generateAuthenticationTokens(existingRefreshToken.user);
      
        // On retire le token existant de l'utilisateur avant d'en créer un nouveau
        await replaceRefreshTokenInDatabase(refreshToken, existingRefreshToken.user);
        
        // Ajouter les tokens aux cookies (via headers)
        setAccessTokenCookie(res, accessToken);
        setRefreshTokenCookie(res, refreshToken);
      
        // Répondre au client, on place également le JWT dans la réponse
        res.json({ accessToken, refreshToken });
      },
      
      async getAuthenticatedUser(req: Request, res: Response) {
        const userId = req.userId;
      
        // Récupérer l'utilisteur en BDD (sans son MDP)
        const user = await prisma.user.findUnique({
          where: { id: userId },
          omit: { password: true }
        });
        if (! user) { throw new UnauthorizedError("JWT payload does not match any user"); }
      
        // Renvoie des données controlées
        res.json(user);
      },
      async updateProfil(req: Request, res: Response) {
        const updateProfilBodySchema = z.object({
          firstname: z.string().min(1, "firstname cannot be empty").optional(),
          lastname: z.string().min(1, "lastname cannot be empty").optional(),
          avatarUrl: z.string().min(1).optional(),
          currentPassword: z.string().optional(),
          newPassword: z.string()
            .min(12, "Password should have minimum length of 12")
            .max(100, "Password is too long")
            .regex(
              /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/,
              "Password must include at least 1 special character, 1 uppercase letter, 1 lowercase letter, and 1 number"
            )
            .optional(),
        });
        
        const {
          firstname,
          lastname,
          currentPassword,
          newPassword,
          avatarUrl
        } = await updateProfilBodySchema.parseAsync(req.body);
        
        // Vérifier qu'on a un utilisateur authentifié (middleware checkRoles doit avoir mis req.userId)
        const userId = req.userId;
        if (!userId) {
          throw new UnauthorizedError("Missing authentication context");
        };
        
        // Récupérer l'utilisateur
        const user = await prisma.user.findUnique({
          where: { id: userId },
        });
        if (!user) {
          throw new UnauthorizedError("JWT payload does not match any user");
        };
        
    
        // Construire dynamiquement les champs à mettre à jour
        const updates: Prisma.UserUpdateInput = {};
      
        if (firstname !== undefined) {
          updates.firstname = firstname;
        };
        if (lastname !== undefined) {
          updates.lastname = lastname;
        };
        if (avatarUrl !== undefined) {
          updates.avatarUrl = avatarUrl;
        }
        
        // Gestion du changement de mot de passe
        if (newPassword !== undefined) {
          // Il veut changer le mot de passe.
          // → currentPassword devient obligatoire.
          if (!currentPassword) {
            throw new BadRequestError("currentPassword is required to set a new password");
          };
      
          // Vérifier l'ancien mot de passe
          const isMatching = await argon2.verify(user.password, currentPassword);
          if (!isMatching) {
            throw new UnauthorizedError("currentPassword does not match");
          };
      
          // Hasher le nouveau mot de passe
          const hashedNewPassword = await argon2.hash(newPassword);
          updates.password = hashedNewPassword;
        };
        
        // Si aucune donnée valide à mettre à jour => erreur claire
        if (Object.keys(updates).length === 0) {
          throw new BadRequestError("No valid field to update");
        };
        
        // Mise à jour en base
        const updatedUser = await prisma.user.update({
          where: { id: userId },
          data: updates,
        });
      
        // On ne renvoie pas le hash du mot de passe
        const { password, ...safeUser } = updatedUser;
      
        res.json(safeUser);
      },
      async deleteProfil(req : Request, res: Response) {
        const userId = req.userId;
        if (!userId) {
          throw new UnauthorizedError("Missing authentication context");
        }
      
        const user = await prisma.user.findUnique({
          where: { id: userId },
        });
      
        if (!user) {
          throw new UnauthorizedError("JWT payload does not match any user");
        }
      
        await prisma.refreshToken.deleteMany({
          where: { user_id: userId },
        });
        await prisma.user.deleteMany({ where: { id: userId } });
      
        return res.status(204).json();
    }

}
export default authController
