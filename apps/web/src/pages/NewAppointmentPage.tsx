import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import type { NewAppointmentInput } from "../types/forms";
import { clinicLocalToUtc, scheduling } from "@clinic/shared";
import { useExaminations, usePatients, useSchedule } from "../hooks/queries";
import {
  Button,
  Card,
  ErrorState,
  FormField,
  LoadingState,
} from "../components/ui";
import { newAppointmentSchema } from "../types/forms";
import styles from "../styles/layout.module.css";
export function NewAppointmentPage() {
  const patients = usePatients();
  const examinations = useExaminations();
  const schedule = useSchedule();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NewAppointmentInput>({
    resolver: zodResolver(newAppointmentSchema),
  });
  return (
    <>
      <Link to="/" className={styles.back}>
        ← Voltar à agenda
      </Link>
      <h1>Agendar exame</h1>
      <p className={styles.muted}>
        Selecione um paciente e um horário para a sala de exames.
      </p>
      <Card>
        {patients.isPending || examinations.isPending ? (
          <LoadingState />
        ) : (
          <form
            className={styles.form}
            noValidate
            onSubmit={handleSubmit((values) => {
              schedule.mutate(
                {
                  patientId: values.patientId,
                  examinationTypeId: values.examinationTypeId,
                  scheduledAt: clinicLocalToUtc(values.localTime),
                },
                { onSuccess: ({ id }) => navigate(`/appointments/${id}`) },
              );
            })}
          >
            <ErrorState
              error={schedule.error ?? patients.error ?? examinations.error}
            />
            <FormField
              id="patient"
              label="Paciente"
              error={errors.patientId?.message}
            >
              <select id="patient" {...register("patientId")}>
                <option value="">Selecione o paciente</option>
                {patients.data?.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.name}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField
              id="examination"
              label="Tipo de exame"
              error={errors.examinationTypeId?.message}
            >
              <select id="examination" {...register("examinationTypeId")}>
                <option value="">Selecione o exame</option>
                {examinations.data?.map((exam) => (
                  <option key={exam.id} value={exam.id}>
                    {exam.name}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField
              id="localTime"
              label="Data e horário (Brasília)"
              error={errors.localTime?.message}
            >
              <input
                id="localTime"
                type="datetime-local"
                step={scheduling.slotMinutes * 60}
                {...register("localTime")}
              />
            </FormField>
            <p className={styles.muted}>
              Horários aos 00 ou 30 minutos. A disponibilidade será confirmada
              ao agendar.
            </p>
            <Button type="submit" loading={schedule.isPending}>
              Confirmar agendamento
            </Button>
          </form>
        )}
      </Card>
    </>
  );
}
