import type { FastifyInstance } from "fastify";
import { authenticate, requireStaff, userSelect } from "../auth/session";
import { db } from "../database/client";
import * as controller from "./controller";
export async function appointmentRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authenticate);
  app.get("/patients", async (request) => {
    requireStaff(request);
    return db.user.findMany({
      where: { role: "PATIENT" },
      select: userSelect,
      orderBy: { name: "asc" },
    });
  });
  app.get("/examination-types", async () =>
    db.examinationType.findMany({ orderBy: { name: "asc" } }),
  );
  app.get("/appointments", controller.list);
  app.post("/appointments", controller.create);
  app.get("/appointments/:id", controller.detail);
  app.patch("/appointments/:id/cancel", controller.cancel);
  app.get("/appointments/:id/report", controller.readReport);
  app.put("/appointments/:id/report", controller.draft);
  app.post("/appointments/:id/report/publish", controller.publish);
}
