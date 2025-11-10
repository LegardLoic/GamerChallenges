import { Role } from "@prisma/client";
import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { ForbiddenError, UnauthorizedError } from "../lib/errors.js";
import { config } from "../../server.config.js";

export function checkRoles(roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Extraire le JWT des cookies ou du headers Authorization
    const token = extractAccessToken(req);

    // Valider le JWT et le décoder (userId + role)
    const { userId, role } = verifyAndDecodeJWT(token);

    // Regarder le role de l'utilisateur est bien dans la liste des rôles autorisés pour cette route
    if (! roles.includes(role)) {
      // -> Si KO : 403 (Forbidden)
      throw new ForbiddenError(`Permission denied for role: ${role}`);
    }

    // Pour faciliter la vie des controleurs suivant, on rajoute l'ID de l'utilisateur authentifié dans req
    req.userId = userId;
    req.userRole = role;
    // Note : on pourrait également à ce stade aller chercher l'utilisateur en BDD pour l'accrocher à req
    // Mais ça reviendrait à faire de l'authentification stateful (car chaque appel à l'API necessite l'appel à la BDD pour obtenir les informations de l'utilisaetur)

    // -> Si OK : next()
    next();
  };
}

function extractAccessToken(req: Request): string {
  if (typeof req.cookies?.accessToken === "string") {
    return req.cookies.accessToken;
  }

  if (typeof req.headers?.authorization === "string") {
    return req.headers.authorization.split(" ")[1];
  }

  // S'il n'y a pas d'accessToken (ni dans les cookies, ni dans les headers)
  // Alors, on throw une erreur Unauthrorized qui remonte à notre global-error-handler
  // Qui s'occupe de renvoyer une 401
  throw new UnauthorizedError("Access Token not provided");
}

function verifyAndDecodeJWT(accessToken: string): JwtPayload {
  try {
    const payload = jwt.verify(accessToken, config.server.jwtSecret) as JwtPayload;
    return payload;
  } catch (error) {
    console.error(error);
    throw new UnauthorizedError("Invalid or expired access token");
  }
}
