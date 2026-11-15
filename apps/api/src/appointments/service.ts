import type { AppointmentInput } from "@clinic/shared";
import { isAlignedSlot } from "@clinic/shared";
import { db } from "../database/client";
import { lockAppointment } from "../database/appointments";
import { DomainError } from "../errors";
export async function scheduleAppointment(input: AppointmentInput) {
  const scheduledAt = new Date(input.scheduledAt);
  if (scheduledAt <= new Date())
    throw new DomainError(
      422,
      "INVALID_APPOINTMENT_DATE",
      "Escolha um horário futuro.",
    );
  if (!isAlignedSlot(scheduledAt))
    throw new DomainError(
      422,
      "INVALID_APPOINTMENT_DATE",
      "Os horários devem começar aos 00 ou 30 minutos.",
    );
  const patient = await db.user.findFirst({
    where: { id: input.patientId, role: "PATIENT" },
  });
  const examination = await db.examinationType.findUnique({
    where: { id: input.examinationTypeId },
  });
  if (!patient || !examination)
    throw new DomainError(
      422,
      "VALIDATION_ERROR",
      "Paciente ou tipo de exame inválido.",
    );
  return db.appointment.create({ data: { ...input, scheduledAt } });
}
export async function cancelAppointment(id: string) {
  return db.$transaction(async (transaction) => {
    const appointment = await lockAppointment(transaction, id);
    if (appointment.status === "CANCELLED")
      throw new DomainError(
        409,
        "APPOINTMENT_CONFLICT",
        "Este agendamento já foi cancelado.",
      );
    if (appointment.report?.status === "PUBLISHED")
      throw new DomainError(
        409,
        "REPORT_ALREADY_PUBLISHED",
        "Agendamentos com laudo publicado não podem ser cancelados.",
      );
    return transaction.appointment.update({
      where: { id },
      data: { status: "CANCELLED" },
    });
  });
}
