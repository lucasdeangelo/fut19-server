import "dotenv/config";

export const config = {
  host: process.env.HOST || "0.0.0.0",
  port: Number(process.env.PORT || 3000),
  jwtSecret: process.env.JWT_SECRET || "development-secret",
  corsOrigin: process.env.CORS_ORIGIN || true,
  captureEnabled: process.env.CAPTURE_ENABLED === "true",
  captureDir: process.env.CAPTURE_DIR || "./captures"
};
