import { z } from "zod";
export const roleSchema = z.enum(["CLINIC_STAFF", "PATIENT"]);
export const appointmentStatusSchema = z.enum(["SCHEDULED", "CANCELLED"]);
export const reportStatusSchema = z.enum(["DRAFT", "PUBLISHED"]);
export const loginSchema = z.object({
  email: z.string().trim().email("Informe um e-mail válido."),
  password: z
    .string()
    .min(1, "Informe sua senha.")
    .max(200, "Use no máximo 200 caracteres."),
});
export const appointmentInputSchema = z.object({
  patientId: z.string().min(1),
  examinationTypeId: z.string().min(1),
  scheduledAt: z.string().datetime({ offset: true }),
});
export const reportInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Informe o título.")
    .max(200, "Use no máximo 200 caracteres."),
  text: z
    .string()
    .trim()
    .min(1, "Informe o texto do laudo.")
    .max(20000, "Use no máximo 20.000 caracteres."),
  professionalName: z
    .string()
    .trim()
    .min(1, "Informe o profissional.")
    .max(200, "Use no máximo 200 caracteres."),
});
export const filtersSchema = z.object({
  date: z.string().date().optional(),
  patientId: z.string().min(1).optional(),
});
export const idSchema = z.object({ id: z.string().min(1).max(100) });
