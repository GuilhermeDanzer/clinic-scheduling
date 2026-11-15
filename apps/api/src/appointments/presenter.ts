import type { AppointmentDto, UserDto } from "@clinic/shared";
import type { AppointmentRecord } from "../types/database.types";
export function presentAppointment(
  appointment: AppointmentRecord,
  user: UserDto,
): AppointmentDto {
  const report = appointment.report;
  const visibleReport =
    report && (user.role === "CLINIC_STAFF" || report.status === "PUBLISHED");
  return {
    id: appointment.id,
    patient: appointment.patient,
    examinationType: appointment.examinationType,
    scheduledAt: appointment.scheduledAt.toISOString(),
    status: appointment.status,
    report: visibleReport
      ? {
          id: report.id,
          title: report.title,
          text: report.text,
          professionalName: report.professionalName,
          status: report.status,
          publishedAt: report.publishedAt?.toISOString() ?? null,
        }
      : null,
  };
}
