import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";
import type { AppointmentFilters, ReportInput, UserDto } from "@clinic/shared";
import { clinic } from "../api/clinic";
import { ApiError } from "../api/client";
export const queryKeys = {
  session: ["session"] as const,
  appointments: ["appointments"] as const,
  list: (filters: AppointmentFilters) =>
    ["appointments", "list", filters] as const,
  detail: (id: string) => ["appointments", "detail", id] as const,
  patients: ["patients"] as const,
  examinations: ["examinations"] as const,
};
export function useSession() {
  return useQuery({
    queryKey: queryKeys.session,
    queryFn: clinic.me,
    retry: false,
    refetchOnWindowFocus: true,
    staleTime: 60000,
  });
}
export function usePatients(enabled = true) {
  return useQuery({
    queryKey: queryKeys.patients,
    queryFn: clinic.patients,
    enabled,
  });
}
export function useExaminations() {
  return useQuery({
    queryKey: queryKeys.examinations,
    queryFn: clinic.examinations,
  });
}
export function useAppointments(filters: AppointmentFilters) {
  return useQuery({
    queryKey: queryKeys.list(filters),
    queryFn: () => clinic.appointments(filters),
  });
}
export function useAppointment(id: string) {
  return useQuery({
    queryKey: queryKeys.detail(id),
    queryFn: () => clinic.appointment(id),
  });
}
async function updateSession(client: QueryClient, user: UserDto | null) {
  await client.cancelQueries();
  // Keep the observed session query alive while clearing the previous user's data.
  client.removeQueries({
    predicate: (query) => query.queryKey[0] !== queryKeys.session[0],
  });
  client.setQueryData(queryKeys.session, user);
}
export function useLogin() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: clinic.login,
    onSuccess: (user) => updateSession(client, user),
  });
}
export function useLogout() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: clinic.logout,
    onSuccess: () => updateSession(client, null),
    onError: (error) => {
      if (error instanceof ApiError && error.status === 401)
        return updateSession(client, null);
    },
  });
}
export function useSchedule() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: clinic.schedule,
    onSuccess: () =>
      client.invalidateQueries({ queryKey: queryKeys.appointments }),
  });
}
export function useCancel(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => clinic.cancel(id),
    onSuccess: () =>
      client.invalidateQueries({ queryKey: queryKeys.appointments }),
  });
}
export function useSaveReport(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: ReportInput) => clinic.saveReport(id, input),
    onSuccess: () =>
      client.invalidateQueries({ queryKey: queryKeys.appointments }),
  });
}
export function usePublish(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => clinic.publish(id),
    onSuccess: () =>
      client.invalidateQueries({ queryKey: queryKeys.appointments }),
  });
}
