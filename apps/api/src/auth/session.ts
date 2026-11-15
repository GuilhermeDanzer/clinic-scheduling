import type { FastifyRequest } from "fastify";
import { db } from "../database/client";
import { DomainError } from "../errors";
import { hashToken } from "./password";
export const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
} as const;
export const sessionCookie = "clinic_session";
export const sessionDurationSeconds = 8 * 60 * 60;
export async function authenticate(request: FastifyRequest) {
  const token = request.cookies[sessionCookie];
  if (!token)
    throw new DomainError(401, "UNAUTHORIZED", "Entre para continuar.");
  const session = await db.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { select: userSelect } },
  });
  if (!session || session.expiresAt <= new Date())
    throw new DomainError(
      401,
      "UNAUTHORIZED",
      "Sua sessão expirou. Entre novamente.",
    );
  request.user = session.user;
}
export function requireUser(request: FastifyRequest) {
  if (!request.user)
    throw new DomainError(401, "UNAUTHORIZED", "Entre para continuar.");
  return request.user;
}
export function requireStaff(request: FastifyRequest) {
  const user = requireUser(request);
  if (user.role !== "CLINIC_STAFF")
    throw new DomainError(
      403,
      "FORBIDDEN",
      "Acesso exclusivo da equipe da clínica.",
    );
  return user;
}
