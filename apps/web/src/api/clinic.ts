import type {
  AppointmentDto,
  AppointmentFilters,
  AppointmentInput,
  ExaminationTypeDto,
  LoginInput,
  ReportInput,
  UserDto,
} from "@clinic/shared";
import { request, requestEmpty } from "./client";
export const clinic = {
  me: () => request<UserDto>("/auth/me"),
  login: (input: LoginInput) =>
    request<UserDto>("/auth/login", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  logout: () => requestEmpty("/auth/logout", { method: "POST" }),
  patients: () => request<UserDto[]>("/patients"),
  examinations: () => request<ExaminationTypeDto[]>("/examination-types"),
  appointments: (filters: AppointmentFilters) => {
    const query = new URLSearchParams();
    if (filters.date) query.set("date", filters.date);
    if (filters.patientId) query.set("patientId", filters.patientId);
    return request<AppointmentDto[]>(`/appointments?${query}`);
  },
  appointment: (id: string) => request<AppointmentDto>(`/appointments/${id}`),
  schedule: (input: AppointmentInput) =>
    request<{ id: string }>("/appointments", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  cancel: (id: string) =>
    requestEmpty(`/appointments/${id}/cancel`, { method: "PATCH" }),
  saveReport: (id: string, input: ReportInput) =>
    requestEmpty(`/appointments/${id}/report`, {
      method: "PUT",
      body: JSON.stringify(input),
    }),
  publish: (id: string) =>
    requestEmpty(`/appointments/${id}/report/publish`, { method: "POST" }),
};
