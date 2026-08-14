import path from "path";
import express from "express";
import cors from "cors";
import apiRoutes from "./routes";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

const corsOrigin = process.env.CORS_ORIGIN?.split(",").map((o) => o.trim());

app.use(
  cors({
    origin: corsOrigin?.length ? corsOrigin : true,
    credentials: true,
    allowedHeaders: ["Content-Type", "X-Visitor-Id", "X-Admin-Token", "Authorization"],
  })
);
app.use(express.json({ limit: "2mb" }));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api", apiRoutes);

app.use(errorHandler);

export default app;
