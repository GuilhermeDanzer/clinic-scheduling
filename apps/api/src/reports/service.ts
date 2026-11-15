import type { ReportInput } from "@clinic/shared";
import { db } from "../database/client";
import { lockAppointment } from "../database/appointments";
import { DomainError, notFound } from "../errors";
export async function saveDraft(id: string, input: ReportInput) {
  return db.$transaction(async (transaction) => {
    const appointment = await lockAppointment(transaction, id);
    if (appointment.status === "CANCELLED")
      throw new DomainError(
        409,
        "APPOINTMENT_CONFLICT",
        "Não é possível cadastrar laudo para um agendamento cancelado.",
      );
    if (appointment.report?.status === "PUBLISHED")
      throw new DomainError(
        409,
        "REPORT_ALREADY_PUBLISHED",
        "Laudos publicados não podem ser editados.",
      );
    return transaction.medicalReport.upsert({
      where: { appointmentId: id },
      create: { ...input, appointmentId: id },
      update: input,
    });
  });
}
export async function publishReport(id: string) {
  return db.$transaction(async (transaction) => {
    const appointment = await lockAppointment(transaction, id);
    if (appointment.status === "CANCELLED")
      throw new DomainError(
        409,
        "APPOINTMENT_CONFLICT",
        "Não é possível publicar laudo de um agendamento cancelado.",
      );
    if (!appointment.report) notFound();
    if (appointment.report.status === "PUBLISHED")
      throw new DomainError(
        409,
        "REPORT_ALREADY_PUBLISHED",
        "O laudo já foi publicado.",
      );
    return transaction.medicalReport.update({
      where: { appointmentId: id },
      data: { status: "PUBLISHED", publishedAt: new Date() },
    });
  });
}
