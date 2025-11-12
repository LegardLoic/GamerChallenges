import type { NextFunction, Request, Response } from "express";
import z from "zod";
import { HttpClientError } from "../lib/errors.js";


// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function globalErrorHandler(error: Error, req: Request, res: Response, next: NextFunction) { // 4 arguments, c'est spécifique à Express et c'est obligatoire
  // Plusieurs façon d'appeler ce middleware :
  // - dans un controlleur en amont, `next(error)`
  // - depuis Express 5, il suffit de throw une erreur dans un controlleur async pour que l'erreur soit transmise ici

  // On définie un objet de base pour la réponse d'erreur
  // On ne renvoie pas la stack trace en production pour des raisons de sécurité
  const isProduction = process.env.NODE_ENV === 'production';
  const baseError = {
    error: 'An error occurred',
    stack: isProduction ? undefined : error.stack, // En production, on ne renvoie pas la stack trace pour des raisons de sécurité
  };
  

  // 2) Gérer les erreurs de validation Zod - 400 (note : techniquement il faudrait 422, mais l'erreur est trop courante)
  // Vérifier si l'erreur reçue est une erreur zod ? 
  if (error instanceof z.ZodError) {
    res
      .status(400)
      .json({
        ...baseError,
        status: 400,
        error: z.prettifyError(error)
      });
    return;
  }

  // 3) Gérer les erreurs client controllées
  // Toutes les HttpClientError
  // - ex : throw new NotFoundError()
  // - ex : throw new ConflictError()
  if (error instanceof HttpClientError) {
    res
      .status(error.status)
      .json({
        ...baseError,
        status: error.status,
        error: error.message
      });
    return;
  }


  // 4) Gérer les erreurs serveurs - 500
  // Toutes les erreurs non controllées
  // - ex : la BDD plante
  // - ex : on a fait une erreur de syntaxe
  res
    .status(500)
    .json({
      ...baseError,
      status: 500
    });
  return;
}
