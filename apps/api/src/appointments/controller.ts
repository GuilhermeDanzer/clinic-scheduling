import type { FastifyReply, FastifyRequest } from "fastify";
import {
  appointmentInputSchema,
  filtersSchema,
  idSchema,
  reportInputSchema,
} from "@clinic/shared";
import { requireStaff, requireUser } from "../auth/session";
import { getAppointment, listAppointments } from "../database/appointments";
import { notFound } from "../errors";
import { saveDraft, publishReport } from "../reports/service";
import { presentAppointment } from "./presenter";
import { cancelAppointment, scheduleAppointment } from "./service";
export async function list(request: FastifyRequest) {
  const user = requireUser(request);
  const appointments = await listAppointments(
    user,
    filtersSchema.parse(request.query),
  );
  return appointments.map((appointment) =>
    presentAppointment(appointment, user),
  );
}
export async function detail(request: FastifyRequest) {
  const user = requireUser(request);
  return presentAppointment(
    await getAppointment(user, idSchema.parse(request.params).id),
    user,
  );
}
export async function create(request: FastifyRequest, reply: FastifyReply) {
  requireStaff(request);
  const appointment = await scheduleAppointment(
    appointmentInputSchema.parse(request.body),
  );
  return reply.code(201).send({ id: appointment.id });
}
export async function cancel(request: FastifyRequest, reply: FastifyReply) {
  requireStaff(request);
  await cancelAppointment(idSchema.parse(request.params).id);
  return reply.code(204).send();
}
export async function readReport(request: FastifyRequest) {
  const appointment = await detail(request);
  if (!appointment.report) notFound();
  return appointment.report;
}
export async function draft(request: FastifyRequest, reply: FastifyReply) {
  requireStaff(request);
  await saveDraft(
    idSchema.parse(request.params).id,
    reportInputSchema.parse(request.body),
  );
  return reply.code(204).send();
}
export async function publish(request: FastifyRequest, reply: FastifyReply) {
  requireStaff(request);
  await publishReport(idSchema.parse(request.params).id);
  return reply.code(204).send();
}
