import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { User } from "@prisma/client";
import { config } from "../../server.config.js";
import { prisma } from "../models/index.js";
import type { Response } from "express";

export function generateAuthenticationTokens(user: User) {
  // Ce qu'on ajoute dans le payload, pas d'information personnelle (RGPD)
  const payload = {
    userId: user.id,
    role: user.role
  };
  
  // Génération d'un l'accès token
  const accessToken = jwt.sign(payload, config.server.jwtSecret, { expiresIn: "1h" }); // un JWT signé contenant des informations utiles (userId notamment)

  // Génération d'un refresh token
  const refreshToken = crypto.randomBytes(128).toString("base64"); // une simple chaine de caractère de 128 caractères fera tout à fait l'affaire. 

  return {
    accessToken: {
      token: accessToken,
      type: "Bearer",
      expiresInMS: 1 * 60 * 60 * 1000 // 1h
    },
    refreshToken: {
      token: refreshToken,
      type: "Bearer",
      expiresInMS: 7 * 24 * 60 * 60 * 1000 // 7j
    }
  };
}

interface Token {
  token: string;
  type: string;
  expiresInMS: number;
}

export async function replaceRefreshTokenInDatabase(refreshToken: Token, user: User) {
  await prisma.refreshToken.deleteMany({ where: { user_id: user.id }});
  await prisma.refreshToken.create({ data: {
    token: refreshToken.token,
    user_id: user.id,
    issued_at: new Date(),
    expired_at: new Date(new Date().valueOf() + refreshToken.expiresInMS)
  }});
}

export function setAccessTokenCookie(res: Response, accessToken: Token) {
  res.cookie("accessToken", accessToken.token, {
    httpOnly: true,
    maxAge: accessToken.expiresInMS, // 1h
    secure: config.server.secure // HTTP ou HTTPS
  });
}

export function setRefreshTokenCookie(res: Response, refreshToken: Token) {
  res.cookie("refreshToken", refreshToken.token, {
    httpOnly: true,
    maxAge: refreshToken.expiresInMS, // 7j
    secure: config.server.secure, // HTTP ou HTTPS
    path: "/api/auth/refresh" // Sécurité : le cookie s'enverra (front -> back) uniquement via cette route, pas les autres routes (limite les transferts de ce cookie)
  });
}
