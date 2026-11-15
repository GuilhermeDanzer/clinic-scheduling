import type { UserDto } from "@clinic/shared";
declare module "fastify" {
  interface FastifyRequest {
    user: UserDto | null;
  }
}
export interface AppConfig {
  origin: string;
  production: boolean;
}
