import { Router } from "express";
import multer from "multer";
import path from "path";
import { randomUUID } from "crypto";
import { requireAuth, type AuthedRequest } from "../auth.js";

export const uploadsRouter = Router();

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

// La extensión se deriva del mimetype validado, nunca del nombre de archivo
// original: si tomáramos la extensión que manda el cliente, alguien podría
// subir un .svg o .html con el mimetype falseado a "image/png" y quedaría
// servido con esa extensión real desde nuestro propio dominio (XSS).
const MIME_EXT: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (_req, file, cb) => {
    cb(null, `${randomUUID()}${MIME_EXT[file.mimetype] ?? ".bin"}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype in MIME_EXT) cb(null, true);
    else cb(new Error("Formato de imagen no soportado"));
  },
});

uploadsRouter.post("/image", requireAuth, upload.single("image"), (req: AuthedRequest, res) => {
  if (!req.file) return res.status(400).json({ error: "No se recibió ninguna imagen" });
  const publicUrl = process.env.PUBLIC_URL ?? `${req.protocol}://${req.get("host")}`;
  res.status(201).json({ url: `${publicUrl}/uploads/${req.file.filename}` });
});
