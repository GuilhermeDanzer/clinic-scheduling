import { useState } from "react";
import { Link } from "react-router-dom";
import { formatClinicDate, scheduling } from "@clinic/shared";
import type { UserPageProps } from "../types/ui.types";
import { useAppointments, usePatients } from "../hooks/queries";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  FormField,
  LoadingState,
} from "../components/ui";
import styles from "../styles/layout.module.css";
import uiStyles from "../components/ui.module.css";
export function AppointmentsPage({ user }: UserPageProps) {
  const staff = user.role === "CLINIC_STAFF";
  const [date, setDate] = useState("");
  const [patientId, setPatientId] = useState("");
  const patients = usePatients(staff);
  const appointments = useAppointments({
    ...(date ? { date } : {}),
    ...(patientId ? { patientId } : {}),
  });
  return (
    <>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>
            {staff ? "PAINEL DA CLÍNICA" : "ÁREA DO PACIENTE"}
          </p>
          <h1>{staff ? "Agenda de exames" : "Meus exames"}</h1>
          <p className={styles.muted}>
            {staff
              ? "Acompanhe os agendamentos e os laudos da clínica."
              : "Consulte seus agendamentos e laudos publicados."}
          </p>
        </div>
        {staff && (
          <Link className={uiStyles.button} to="/appointments/new">
            + Agendar exame
          </Link>
        )}
      </header>
      <Card>
        <div className={styles.filters}>
          <FormField id="filter-date" label="Data do exame">
            <input
              type="date"
              id="filter-date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </FormField>
          {staff && (
            <FormField id="filter-patient" label="Paciente">
              <select
                id="filter-patient"
                value={patientId}
                onChange={(event) => setPatientId(event.target.value)}
              >
                <option value="">Todos os pacientes</option>
                {patients.data?.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.name}
                  </option>
                ))}
              </select>
            </FormField>
          )}
          <Button
            variant="secondary"
            onClick={() => {
              setDate("");
              setPatientId("");
            }}
          >
            Limpar filtros
          </Button>
        </div>
        <ErrorState error={patients.error} />
        <ErrorState error={appointments.error} />
        {appointments.isPending && <LoadingState />}
        {appointments.data?.length === 0 && <EmptyState />}
        <div className={styles.list}>
          {appointments.data?.map((appointment) => (
            <article key={appointment.id}>
              <div className={styles.row}>
                <div>
                  <h2>
                    <Link to={`/appointments/${appointment.id}`}>
                      {appointment.examinationType.name}
                    </Link>
                  </h2>
                  <p>
                    {formatClinicDate(appointment.scheduledAt)}
                    {staff && ` · ${appointment.patient.name}`}
                  </p>
                  <div className={styles.actions}>
                    <Badge status={appointment.status} />
                    {appointment.report && (
                      <Badge status={appointment.report.status} />
                    )}
                  </div>
                </div>
                <Link to={`/appointments/${appointment.id}`}>
                  {appointment.report?.status === "PUBLISHED"
                    ? "Consultar laudo →"
                    : "Ver agendamento →"}
                </Link>
              </div>
              <hr />
            </article>
          ))}
        </div>
      </Card>
      <p className={styles.footer}>
        Horários de Brasília · {scheduling.timeZone} · Exames de{" "}
        {scheduling.slotMinutes} minutos
      </p>
    </>
  );
}
