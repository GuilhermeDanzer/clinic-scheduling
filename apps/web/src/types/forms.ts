import { z } from "zod";
export const newAppointmentSchema = z.object({
  patientId: z.string().min(1, "Selecione o paciente."),
  examinationTypeId: z.string().min(1, "Selecione o exame."),
  localTime: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Informe a data e o horário."),
});

export type NewAppointmentInput = z.infer<typeof newAppointmentSchema>;
