import { randomBytes } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { loginSchema } from "@clinic/shared";
import type { AppConfig } from "../types/auth.types";
import { db } from "../database/client";
import { DomainError } from "../errors";
import { hashToken, verifyPassword } from "./password";
import {
  authenticate,
  requireUser,
  sessionCookie,
  sessionDurationSeconds,
  userSelect,
} from "./session";
export async function authRoutes(app: FastifyInstance, config: AppConfig) {
  const cookieOptions = {
    path: "/",
    httpOnly: true,
    secure: config.production,
    sameSite: "strict" as const,
  };
  app.post(
    "/auth/login",
    { config: { rateLimit: { max: 15, timeWindow: "1 minute" } } },
    async (request, reply) => {
      const input = loginSchema.parse(request.body);
      const user = await db.user.findUnique({
        where: { email: input.email.toLowerCase() },
      });
      if (!user || !(await verifyPassword(input.password, user.passwordHash)))
        throw new DomainError(
          401,
          "UNAUTHORIZED",
          "E-mail ou senha inválidos.",
        );
      const previousToken = request.cookies[sessionCookie];
      if (previousToken)
        await db.session.deleteMany({
          where: { tokenHash: hashToken(previousToken) },
        });
      const token = randomBytes(32).toString("hex");
      await db.session.create({
        data: {
          tokenHash: hashToken(token),
          userId: user.id,
          expiresAt: new Date(Date.now() + sessionDurationSeconds * 1000),
        },
      });
      reply.setCookie(sessionCookie, token, {
        ...cookieOptions,
        maxAge: sessionDurationSeconds,
      });
      return db.user.findUniqueOrThrow({
        where: { id: user.id },
        select: userSelect,
      });
    },
  );
  app.get("/auth/me", { preHandler: authenticate }, async (request) =>
    requireUser(request),
  );
  app.post(
    "/auth/logout",
    { preHandler: authenticate },
    async (request, reply) => {
      const token = request.cookies[sessionCookie];
      if (token)
        await db.session.deleteMany({ where: { tokenHash: hashToken(token) } });
      reply.clearCookie(sessionCookie, cookieOptions).code(204).send();
    },
  );
}
