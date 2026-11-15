import type { Prisma } from "@prisma/client";
import type { appointmentInclude } from "../database/appointments";
export type AppointmentRecord = Prisma.AppointmentGetPayload<{
  include: typeof appointmentInclude;
}>;
