import type { ButtonHTMLAttributes, PropsWithChildren } from "react";
import type {
  AppointmentStatus,
  ReportStatus,
  ReportDto,
  UserDto,
} from "@clinic/shared";
export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger";
  loading?: boolean;
};
export type FieldProps = PropsWithChildren<{
  label: string;
  id: string;
  error?: string;
}>;
export interface ReportEditorProps {
  appointmentId: string;
  report: ReportDto | null;
}
export interface UserPageProps {
  user: UserDto;
}

export interface ErrorStateProps {
  error: Error | null;
}
export interface BadgeProps {
  status: AppointmentStatus | ReportStatus;
}
