import { Link, Navigate, Route, Routes } from "react-router-dom";
import { useLogout, useSession } from "./hooks/queries";
import { ApiError } from "./api/client";
import { Button, ErrorState, LoadingState } from "./components/ui";
import { LoginPage } from "./pages/LoginPage";
import { AppointmentsPage } from "./pages/AppointmentsPage";
import { NewAppointmentPage } from "./pages/NewAppointmentPage";
import { AppointmentDetailPage } from "./pages/AppointmentDetailPage";
import styles from "./styles/layout.module.css";
export function App() {
  const session = useSession();
  const logout = useLogout();
  if (session.isPending) return <LoadingState />;
  if (
    session.error &&
    !(session.error instanceof ApiError && session.error.status === 401)
  )
    return (
      <main className={styles.shell}>
        <ErrorState error={session.error} />
        <Button onClick={() => void session.refetch()}>Tentar novamente</Button>
      </main>
    );
  const user = session.data;
  if (!user) return <LoginPage />;
  return (
    <>
      <a href="#main" className={styles.skipLink}>
        Ir para o conteúdo
      </a>
      <header className={styles.topbar}>
        <div className={styles.topbarInner}>
          <Link className={styles.brand} to="/">
            <span className={styles.mark} aria-hidden="true">
              ✚
            </span>
            Clínica
          </Link>
          <div className={styles.user}>
            <div>
              {user.name}
              <br />
              <small className={styles.muted}>
                {user.role === "CLINIC_STAFF"
                  ? "Equipe da clínica"
                  : "Paciente"}
              </small>
            </div>
            <Button
              variant="secondary"
              loading={logout.isPending}
              onClick={() => logout.mutate()}
            >
              Sair
            </Button>
          </div>
        </div>
      </header>
      <main id="main" className={styles.shell}>
        <ErrorState error={logout.error} />
        <Routes>
          <Route path="/" element={<AppointmentsPage user={user} />} />
          <Route
            path="/appointments/new"
            element={
              user.role === "CLINIC_STAFF" ? (
                <NewAppointmentPage />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/appointments/:id"
            element={<AppointmentDetailPage user={user} />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}
