import { z } from "zod";
import { createApp } from "./app";
import { db } from "./database/client";
const env = z
  .object({
    APP_ORIGIN: z.string().url(),
    PORT: z.coerce.number().int().min(1).max(65535).default(3001),
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
    DATABASE_URL: z.string().url(),
  })
  .parse(process.env);
if (env.NODE_ENV === "production" && !env.APP_ORIGIN.startsWith("https://"))
  throw new Error("Production requires an HTTPS APP_ORIGIN");
const app = await createApp({
  origin: new URL(env.APP_ORIGIN).origin,
  production: env.NODE_ENV === "production",
});
await db.$connect();
await app.listen({ port: env.PORT, host: "127.0.0.1" });
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, async () => {
    await app.close();
    await db.$disconnect();
    process.exit(0);
  });
