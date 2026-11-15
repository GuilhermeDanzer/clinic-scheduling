import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
export const scheduling = {
  timeZone: "America/Sao_Paulo",
  slotMinutes: 30,
} as const;
export function clinicLocalToUtc(value: string): string {
  return fromZonedTime(value, scheduling.timeZone).toISOString();
}
export function formatClinicDate(value: string): string {
  return formatInTimeZone(value, scheduling.timeZone, "dd/MM/yyyy HH:mm");
}
export function isAlignedSlot(value: Date): boolean {
  const minute = Number(formatInTimeZone(value, scheduling.timeZone, "mm"));
  return (
    minute % scheduling.slotMinutes === 0 &&
    value.getUTCSeconds() === 0 &&
    value.getUTCMilliseconds() === 0
  );
}
export function clinicDayRange(date: string) {
  const nextDay = new Date(`${date}T12:00:00Z`);
  nextDay.setUTCDate(nextDay.getUTCDate() + 1);
  return {
    gte: fromZonedTime(`${date}T00:00:00`, scheduling.timeZone),
    lt: fromZonedTime(
      `${nextDay.toISOString().slice(0, 10)}T00:00:00`,
      scheduling.timeZone,
    ),
  };
}
