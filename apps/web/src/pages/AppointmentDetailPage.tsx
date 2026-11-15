import { Link, useParams } from "react-router-dom";
import { formatClinicDate, scheduling } from "@clinic/shared";
import type { UserPageProps } from "../types/ui.types";
import { useAppointment, useCancel } from "../hooks/queries";
import {
  Badge,
  Button,
  Card,
  ErrorState,
  LoadingState,
} from "../components/ui";
import { ReportEditor } from "../components/ReportEditor";
import styles from "../styles/layout.module.css";
export function AppointmentDetailPage({ user }: UserPageProps) {
  const { id = "" } = useParams();
  const query = useAppointment(id);
  const cancel = useCancel(id);
  const appointment = query.data;
  const staff = user.role === "CLINIC_STAFF";
  if (query.isPending) return <LoadingState />;
  if (!appointment)
    return (
      <>
        <Link to="/">← Voltar à agenda</Link>
        <ErrorState error={query.error} />
      </>
    );
  const report = appointment.report;
  return (
    <>
      <Link to="/" className={styles.back}>
        ← Voltar à agenda
      </Link>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>DETALHES DO EXAME</p>
          <h1>{appointment.examinationType.name}</h1>
          <p className={styles.muted}>
            {formatClinicDate(appointment.scheduledAt)} · Horário de Brasília
          </p>
        </div>
        <Badge status={appointment.status} />
      </header>
      <ErrorState error={cancel.error} />
      <div className={styles.grid}>
        <Card>
          <h2>Agendamento</h2>
          <dl>
            <dt>Paciente</dt>
            <dd>{appointment.patient.name}</dd>
            <dt>Exame</dt>
            <dd>{appointment.examinationType.name}</dd>
            <dt>Duração</dt>
            <dd>{scheduling.slotMinutes} minutos</dd>
            <dt>Laudo</dt>
            <dd>
              {report ? (
                <Badge status={report.status} />
              ) : (
                "Ainda não disponível"
              )}
            </dd>
          </dl>
          {staff &&
            appointment.status === "SCHEDULED" &&
            report?.status !== "PUBLISHED" && (
              <Button
                variant="danger"
                loading={cancel.isPending}
                onClick={() => {
                  if (
                    window.confirm(
                      "Cancelar este agendamento? O horário ficará disponível para outro exame.",
                    )
                  )
                    cancel.mutate();
                }}
              >
                Cancelar agendamento
              </Button>
            )}
        </Card>
        <Card>
          {report?.status === "PUBLISHED" ? (
            <>
              <Badge status="PUBLISHED" />
              <h2>{report.title}</h2>
              <p className={styles.report}>{report.text}</p>
              <hr />
              <p>
                <strong>Profissional responsável</strong>
                <br />
                {report.professionalName}
              </p>
              <small className={styles.muted}>
                Publicado em{" "}
                {report.publishedAt && formatClinicDate(report.publishedAt)}
              </small>
            </>
          ) : staff && appointment.status === "SCHEDULED" ? (
            <ReportEditor
              key={report?.id ?? appointment.id}
              appointmentId={appointment.id}
              report={report}
            />
          ) : (
            <>
              <h2>Laudo indisponível</h2>
              <p className={styles.muted}>
                {appointment.status === "CANCELLED"
                  ? "Este agendamento foi cancelado."
                  : "O laudo aparecerá aqui após a publicação pela clínica."}
              </p>
            </>
          )}
        </Card>
      </div>
    </>
  );
}
