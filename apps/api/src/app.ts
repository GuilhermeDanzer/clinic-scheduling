import Fastify from "fastify";
import cookie from "@fastify/cookie";
import rateLimit from "@fastify/rate-limit";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import type { AppConfig } from "./types/auth.types";
import { DomainError } from "./errors";
import { authRoutes } from "./auth/routes";
import { appointmentRoutes } from "./appointments/routes";
export async function createApp(config: AppConfig) {
  const app = Fastify({ logger: config.production, bodyLimit: 100_000 });
  await app.register(cookie);
  await app.register(rateLimit, { global: false });
  app.decorateRequest("user", null);
  app.addHook("onRequest", async (request, reply) => {
    reply
      .header("X-Content-Type-Options", "nosniff")
      .header("Cache-Control", "no-store");
    if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) {
      // Reject absent/null/foreign origins too; direct API clients must send the configured origin.
      if (request.headers.origin !== config.origin)
        throw new DomainError(
          403,
          "FORBIDDEN",
          "Origem da requisição não permitida.",
        );
    }
  });
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ZodError)
      return reply.code(400).send({
        error: {
          code: "VALIDATION_ERROR",
          message: "Dados inválidos. Verifique os campos informados.",
        },
      });
    if (error instanceof DomainError)
      return reply
        .code(error.statusCode)
        .send({ error: { code: error.code, message: error.message } });
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    )
      return reply.code(409).send({
        error: {
          code: "APPOINTMENT_CONFLICT",
          message: "Este horário já está ocupado ou o laudo já existe.",
        },
      });
    const candidate =
      error instanceof Error && "statusCode" in error
        ? error.statusCode
        : undefined;
    const statusCode =
      typeof candidate === "number" && candidate >= 400 && candidate < 500
        ? candidate
        : 500;
    if (statusCode === 500) request.log.error(error);
    return reply.code(statusCode).send({
      error: {
        code: statusCode === 500 ? "INTERNAL_ERROR" : "INVALID_REQUEST",
        message:
          statusCode === 500
            ? "Não foi possível concluir a operação."
            : "Requisição inválida.",
      },
    });
  });
  app.setNotFoundHandler((_request, reply) =>
    reply.code(404).send({
      error: { code: "NOT_FOUND", message: "Recurso não encontrado." },
    }),
  );
  await app.register(authRoutes, config);
  await app.register(appointmentRoutes);
  return app;
}
