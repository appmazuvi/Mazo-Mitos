import { Router } from "express";
import multer from "multer";
import path from "path";
import { randomUUID } from "crypto";
import { requireAuth, type AuthedRequest } from "../auth.js";

export const uploadsRouter = Router();

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (["image/png", "image/jpeg", "image/webp", "image/gif"].includes(file.mimetype)) cb(null, true);
    else cb(new Error("Formato de imagen no soportado"));
  },
});

uploadsRouter.post("/image", requireAuth, upload.single("image"), (req: AuthedRequest, res) => {
  if (!req.file) return res.status(400).json({ error: "No se recibió ninguna imagen" });
  const publicUrl = process.env.PUBLIC_URL ?? `${req.protocol}://${req.get("host")}`;
  res.status(201).json({ url: `${publicUrl}/uploads/${req.file.filename}` });
});
