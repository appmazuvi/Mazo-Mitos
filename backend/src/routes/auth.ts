import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { signToken } from "../auth.js";

export const authRouter = Router();

const registerSchema = z.object({
  email: z.string().email(),
  username: z
    .string()
    .min(3)
    .max(20)
    .regex(/^[a-zA-Z0-9_]+$/, "Solo letras, números y guión bajo"),
  password: z.string().min(8),
  displayName: z.string().min(1).max(40).optional(),
});

authRouter.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const { email, username, password, displayName } = parsed.data;

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });
  if (existing) {
    return res.status(409).json({ error: "Email o nombre de usuario ya registrado" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, username, passwordHash, displayName: displayName ?? username },
  });

  const token = signToken({ userId: user.id, username: user.username });
  res.status(201).json({
    token,
    user: { id: user.id, username: user.username, displayName: user.displayName, avatarUrl: user.avatarUrl },
  });
});

const loginSchema = z.object({
  emailOrUsername: z.string().min(1),
  password: z.string().min(1),
});

authRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Datos inválidos" });
  }
  const { emailOrUsername, password } = parsed.data;

  const user = await prisma.user.findFirst({
    where: { OR: [{ email: emailOrUsername }, { username: emailOrUsername }] },
  });
  if (!user) {
    return res.status(401).json({ error: "Credenciales inválidas" });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "Credenciales inválidas" });
  }

  const token = signToken({ userId: user.id, username: user.username });
  res.json({
    token,
    user: { id: user.id, username: user.username, displayName: user.displayName, avatarUrl: user.avatarUrl },
  });
});
