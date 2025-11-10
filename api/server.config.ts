import "dotenv/config";
export const config = {
  server: {
    port: parseInt(process.env.PORT || "3000"),
    allowedOrigins: process.env.ALLOWED_ORIGINS || "*",
    jwtSecret: process.env.JWT_SECRET || "jwt-secret",
    secure: process.env.NODE_ENV === "production" || false,
  },
};
