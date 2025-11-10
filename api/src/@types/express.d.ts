// Ficher de définition

import { Role } from "@prisma/client";
import { Request } from "express";

// Approche n°1 : on surchage au global ce qu'il se trouve dans Express.Request
// Avantage : on continue à `import { Request } from "express"` dans les controlleurs comme d'hab
// Inconvénient : charge mentale pour le développeur => on peut accéder à `req.userId` même sur les controlleurs qui n'auraient pas le checkRoles (ex : routes publiques)
declare global {
  namespace Express {
    interface Request {
      userId: number;
      userRole: Role;
    }
  }
}

// Approche n°2 : créer une interface qui étend Express.Request
// Avantage : plus explicite (moins de charge mental)
// Inconvénient (mineur) : on doit importer `AuthenticatedRequest` dans les controlleurs plutot que Request
export interface AuthenticatedRequest extends Request {
  userId: number;
  userRole: Role;
}
