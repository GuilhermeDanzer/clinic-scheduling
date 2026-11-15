import type { z } from "zod";
import type {
  appointmentInputSchema,
  appointmentStatusSchema,
  filtersSchema,
  loginSchema,
  reportInputSchema,
  reportStatusSchema,
  roleSchema,
} from "./schemas";
export type Role = z.infer<typeof roleSchema>;
export type AppointmentStatus = z.infer<typeof appointmentStatusSchema>;
export type ReportStatus = z.infer<typeof reportStatusSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type AppointmentInput = z.infer<typeof appointmentInputSchema>;
export type ReportInput = z.infer<typeof reportInputSchema>;
export type AppointmentFilters = z.infer<typeof filtersSchema>;
export interface UserDto {
  id: string;
  name: string;
  email: string;
  role: Role;
}
export interface ExaminationTypeDto {
  id: string;
  name: string;
}
export interface ReportDto extends ReportInput {
  id: string;
  status: ReportStatus;
  publishedAt: string | null;
}
export interface AppointmentDto {
  id: string;
  patient: UserDto;
  examinationType: ExaminationTypeDto;
  scheduledAt: string;
  status: AppointmentStatus;
  report: ReportDto | null;
}
export interface ApiErrorDto {
  error: { code: string; message: string };
}
