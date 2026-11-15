import type { PropsWithChildren } from "react";
import type {
  BadgeProps,
  ButtonProps,
  ErrorStateProps,
  FieldProps,
} from "../types/ui.types";
import styles from "./ui.module.css";
export function Button({
  variant = "primary",
  loading,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      aria-busy={loading}
      className={`${styles.button} ${styles[variant] ?? ""}`}
    >
      {loading ? "Aguarde…" : children}
    </button>
  );
}
export function Card({ children }: PropsWithChildren) {
  return <section className={styles.card}>{children}</section>;
}
export function FormField({ children, label, id, error }: FieldProps) {
  return (
    <div className={styles.field}>
      <label htmlFor={id}>{label}</label>
      {children}
      {error && (
        <span id={`${id}-error`} className={styles.error} role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
export function LoadingState() {
  return (
    <p className={styles.state} role="status">
      Carregando…
    </p>
  );
}
export function EmptyState() {
  return (
    <div className={styles.state}>
      <h2>Nenhum agendamento encontrado</h2>
      <p>Os agendamentos aparecerão aqui.</p>
    </div>
  );
}
export function ErrorState({ error }: ErrorStateProps) {
  return error ? (
    <p role="alert" className={styles.notice}>
      {error.message}
    </p>
  ) : null;
}
export function SuccessState({ children }: PropsWithChildren) {
  return (
    <p role="status" className={`${styles.notice} ${styles.success}`}>
      {children}
    </p>
  );
}
export function Badge({ status }: BadgeProps) {
  const labels = {
    SCHEDULED: "Agendado",
    CANCELLED: "Cancelado",
    DRAFT: "Rascunho",
    PUBLISHED: "Laudo publicado",
  };
  const classes = {
    SCHEDULED: "",
    CANCELLED: styles.cancelled,
    DRAFT: styles.draft,
    PUBLISHED: styles.published,
  };
  return (
    <span className={`${styles.badge} ${classes[status]}`}>
      {labels[status]}
    </span>
  );
}
