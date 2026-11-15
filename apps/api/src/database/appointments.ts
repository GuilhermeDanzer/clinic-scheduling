import type { Prisma } from "@prisma/client";
import type { AppointmentFilters, UserDto } from "@clinic/shared";
import { clinicDayRange } from "@clinic/shared";
import { db } from "./client";
import { userSelect } from "../auth/session";
import { notFound } from "../errors";
export const appointmentInclude = {
  patient: { select: userSelect },
  examinationType: true,
  report: true,
} as const;
export function visibleWhere(user: UserDto): Prisma.AppointmentWhereInput {
  return user.role === "PATIENT" ? { patientId: user.id } : {};
}
export function listAppointments(user: UserDto, filters: AppointmentFilters) {
  return db.appointment.findMany({
    where: {
      ...visibleWhere(user),
      ...(user.role === "CLINIC_STAFF" && filters.patientId
        ? { patientId: filters.patientId }
        : {}),
      ...(filters.date ? { scheduledAt: clinicDayRange(filters.date) } : {}),
    },
    include: appointmentInclude,
    orderBy: { scheduledAt: "asc" },
  });
}
export async function getAppointment(user: UserDto, id: string) {
  const appointment = await db.appointment.findFirst({
    where: { id, ...visibleWhere(user) },
    include: appointmentInclude,
  });
  if (!appointment) notFound();
  return appointment;
}
// Every report mutation and cancellation takes this same lock before reading state.
// At READ COMMITTED a waiting transaction observes the prior transaction's committed state.
export async function lockAppointment(
  transaction: Prisma.TransactionClient,
  id: string,
) {
  await transaction.$queryRaw`SELECT id FROM appointments WHERE id = ${id} FOR UPDATE`;
  const appointment = await transaction.appointment.findUnique({
    where: { id },
    include: { report: true },
  });
  if (!appointment) notFound();
  return appointment;
}
