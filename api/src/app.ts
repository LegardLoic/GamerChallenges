import cors from "cors";
import express from "express"; // Pour installer les types d'Express : npm i --save-dev @types/express -w api 
import { router } from "./routers/index.router.js";
import { config } from "../server.config.js";
import { globalErrorHandler } from "./middlewares/global-error-handler.js";
// import { notFoundMiddleware } from "./middlewares/not-found.middleware.js";
// import { infoMiddleware } from "./middlewares/info.middleware.js";
 import cookieParser from "cookie-parser";
// import { xssSanitizer } from "./middlewares/xss-sanitizer.middleware.js";
// import { helmetMiddlewre } from "./middlewares/helmet.middleware.js";
// import { loggerMiddleware } from "./middlewares/logger.middleware.js";

// Créer une app Express
export const app = express();

// Autoriser les requêtes cross-origin
app.use(cors({ origin: config.server.allowedOrigins }));

// Cookie parser
 app.use(cookieParser());

// Body parser pour récupérer les body "application/json" dans req.body
app.use(express.json());

// XSS protection
// app.use(xssSanitizer);

// Helmet protection
// app.use(helmetMiddlewre);

// Logger HTTP requests
// app.use(loggerMiddleware);

// Brancher le routeur de l'API
app.use("/api", router);

// Info route
// app.get("/info", infoMiddleware);

// Not found middleware
// app.use(notFoundMiddleware);

// Global error middleware
app.use(globalErrorHandler);
