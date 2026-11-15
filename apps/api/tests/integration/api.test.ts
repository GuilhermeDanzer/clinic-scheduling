import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../../src/app";
import { db } from "../../src/database/client";
import { seed } from "../../prisma/seed";
const origin = "http://localhost:5173";
const app = await createApp({ origin, production: false });
let staff = "";
let ana = "";
let bruno = "";
const reportInput = {
  title: "Laudo de teste",
  text: "Conteúdo reservado do rascunho",
  professionalName: "Dra. Teste",
};
async function login(email: string) {
  const response = await app.inject({
    method: "POST",
    url: "/auth/login",
    headers: { origin },
    payload: { email, password: "Clinica123!" },
  });
  expect(response.statusCode).toBe(200);
  const cookie = response.cookies[0];
  if (!cookie) throw new Error("Missing session cookie");
  return `${cookie.name}=${cookie.value}`;
}
function get(url: string, cookie = staff) {
  return app.inject({ method: "GET", url, headers: { cookie } });
}
function post(url: string, payload?: object, cookie = staff) {
  return app.inject({
    method: "POST",
    url,
    headers: { origin, cookie },
    payload,
  });
}
function draft(id: string, payload: object = reportInput, cookie = staff) {
  return app.inject({
    method: "PUT",
    url: `/appointments/${id}/report`,
    headers: { origin, cookie },
    payload,
  });
}
function cancel(id: string) {
  return app.inject({
    method: "PATCH",
    url: `/appointments/${id}/cancel`,
    headers: { origin, cookie: staff },
  });
}
function slot(offset = 0) {
  const date = new Date();
  date.setUTCFullYear(date.getUTCFullYear() + 2);
  date.setUTCHours(12, 0, 0, 0);
  return new Date(date.getTime() + offset * 30 * 60000).toISOString();
}
async function appointment(patientId = "patient-ana", offset = 0) {
  const response = await post("/appointments", {
    patientId,
    examinationTypeId: "xray",
    scheduledAt: slot(offset),
  });
  expect(response.statusCode).toBe(201);
  const body: { id: string } = response.json();
  return body.id;
}
beforeAll(async () => {
  if (new URL(process.env.DATABASE_URL ?? "").pathname !== "/clinic_test")
    throw new Error("Refusing non-test database");
  await db.medicalReport.deleteMany();
  await db.appointment.deleteMany();
  await seed();
  staff = await login("equipe@clinica.test");
  ana = await login("ana@clinica.test");
  bruno = await login("bruno@clinica.test");
});
beforeEach(async () => {
  await db.medicalReport.deleteMany();
  await db.appointment.deleteMany();
});
afterAll(async () => {
  await app.close();
  await db.$disconnect();
});
describe("real PostgreSQL API invariants", () => {
  it("accepts exactly one simultaneous booking and persists one active appointment", async () => {
    const payload = {
      patientId: "patient-ana",
      examinationTypeId: "xray",
      scheduledAt: slot(),
    };
    const responses = await Promise.all([
      post("/appointments", payload),
      post("/appointments", payload),
    ]);
    expect(responses.map((response) => response.statusCode).sort()).toEqual([
      201, 409,
    ]);
    expect(
      await db.appointment.count({
        where: { scheduledAt: new Date(slot()), status: "SCHEDULED" },
      }),
    ).toBe(1);
  });
  it("denies another patient appointment and report even by direct ID", async () => {
    const id = await appointment();
    await draft(id);
    await post(`/appointments/${id}/report/publish`);
    expect((await get(`/appointments/${id}`, bruno)).statusCode).toBe(404);
    expect((await get(`/appointments/${id}/report`, bruno)).statusCode).toBe(
      404,
    );
    expect((await get("/appointments", bruno)).json()).toEqual([]);
  });
  it("never exposes draft content or draft existence to the patient", async () => {
    const id = await appointment();
    await draft(id);
    const list = await get("/appointments", ana);
    expect(list.body).not.toContain(reportInput.text);
    expect(list.body).not.toContain("DRAFT");
    const detail = await get(`/appointments/${id}`, ana);
    expect(detail.json().report).toBeNull();
    expect((await get(`/appointments/${id}/report`, ana)).statusCode).toBe(404);
    expect((await get(`/appointments/${id}/report`)).json().text).toBe(
      reportInput.text,
    );
  });
  it("publishes for the correct patient, records timestamp and becomes immutable", async () => {
    const id = await appointment();
    await draft(id);
    expect((await post(`/appointments/${id}/report/publish`)).statusCode).toBe(
      204,
    );
    const response = await get(`/appointments/${id}/report`, ana);
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      status: "PUBLISHED",
      text: reportInput.text,
    });
    expect(response.json().publishedAt).toBeTruthy();
    expect(
      (await draft(id, { ...reportInput, text: "alterado" })).statusCode,
    ).toBe(409);
    expect((await cancel(id)).statusCode).toBe(409);
    expect((await post(`/appointments/${id}/report/publish`)).statusCode).toBe(
      409,
    );
  });
  it("rejects past and unaligned bookings", async () => {
    expect(
      (
        await post("/appointments", {
          patientId: "patient-ana",
          examinationTypeId: "xray",
          scheduledAt: "2020-01-01T12:00:00Z",
        })
      ).statusCode,
    ).toBe(422);
    expect(
      (
        await post("/appointments", {
          patientId: "patient-ana",
          examinationTypeId: "xray",
          scheduledAt: slot().replace(":00:00.", ":15:00."),
        })
      ).statusCode,
    ).toBe(422);
  });
  it("reuses cancelled slots and prevents reports on cancelled appointments", async () => {
    const id = await appointment();
    expect((await cancel(id)).statusCode).toBe(204);
    expect((await draft(id)).statusCode).toBe(409);
    await appointment();
    expect(await db.appointment.count({ where: { status: "SCHEDULED" } })).toBe(
      1,
    );
  });
  it("edits one draft and enforces one report even under concurrent saves", async () => {
    const id = await appointment();
    const responses = await Promise.all([
      draft(id),
      draft(id, { ...reportInput, title: "Outro título" }),
    ]);
    expect(responses.map((response) => response.statusCode)).toEqual([
      204, 204,
    ]);
    expect(await db.medicalReport.count({ where: { appointmentId: id } })).toBe(
      1,
    );
    expect(
      (await draft(id, { ...reportInput, title: "Título final" })).statusCode,
    ).toBe(204);
    expect((await get(`/appointments/${id}/report`)).json().title).toBe(
      "Título final",
    );
  });
  it("serializes cancellation and publication without an invalid persisted state", async () => {
    for (let index = 0; index < 8; index++) {
      const id = await appointment("patient-ana", index);
      await draft(id);
      const operations =
        index % 2 === 0
          ? [cancel(id), post(`/appointments/${id}/report/publish`)]
          : [post(`/appointments/${id}/report/publish`), cancel(id)];
      const responses = await Promise.all(operations);
      expect(responses.map((response) => response.statusCode).sort()).toEqual([
        204, 409,
      ]);
      const persisted = await db.appointment.findUniqueOrThrow({
        where: { id },
        include: { report: true },
      });
      expect(
        persisted.status === "CANCELLED" &&
          persisted.report?.status === "PUBLISHED",
      ).toBe(false);
    }
  });
  it("denies all staff mutations and patient directory to patients", async () => {
    const id = await appointment();
    expect(
      (
        await post(
          "/appointments",
          {
            patientId: "patient-ana",
            examinationTypeId: "xray",
            scheduledAt: slot(1),
          },
          ana,
        )
      ).statusCode,
    ).toBe(403);
    expect((await draft(id, reportInput, ana)).statusCode).toBe(403);
    expect(
      (await post(`/appointments/${id}/report/publish`, undefined, ana))
        .statusCode,
    ).toBe(403);
    expect(
      (
        await app.inject({
          method: "PATCH",
          url: `/appointments/${id}/cancel`,
          headers: { origin, cookie: ana },
        })
      ).statusCode,
    ).toBe(403);
    expect((await get("/patients", ana)).statusCode).toBe(403);
  });
  it("validates required fields and safe error shape", async () => {
    expect((await post("/appointments", {})).statusCode).toBe(400);
    const id = await appointment();
    const response = await draft(id, { ...reportInput, title: " " });
    expect(response.statusCode).toBe(400);
    expect(response.json()).toHaveProperty("error.code", "VALIDATION_ERROR");
    expect(response.body).not.toContain("stack");
  });
  it("filters clinic-local dates and patient ownership", async () => {
    const id = await appointment();
    await appointment("patient-bruno", 1);
    const localDate = slot().slice(0, 10);
    expect(
      (
        await get(`/appointments?date=${localDate}&patientId=patient-ana`)
      ).json(),
    ).toHaveLength(1);
    const own = await get("/appointments?patientId=patient-bruno", ana);
    expect(own.json()).toHaveLength(1);
    expect(own.json()[0].id).toBe(id);
  });
  it("requires valid server-side session and rejects CSRF origins", async () => {
    expect((await get("/appointments", "")).statusCode).toBe(401);
    expect(
      (await get("/appointments", "clinic_session=forged")).statusCode,
    ).toBe(401);
    expect(
      (
        await app.inject({
          method: "POST",
          url: "/appointments",
          headers: { cookie: staff, origin: "https://evil.example" },
          payload: {},
        })
      ).statusCode,
    ).toBe(403);
    expect(
      (await app.inject({ method: "POST", url: "/auth/login", payload: {} }))
        .statusCode,
    ).toBe(403);
  });
  it("expires sessions and revokes them at logout", async () => {
    const cookie = await login("ana@clinica.test");
    expect((await post("/auth/logout", undefined, cookie)).statusCode).toBe(
      204,
    );
    expect((await get("/auth/me", cookie)).statusCode).toBe(401);
    await db.session.updateMany({
      where: { userId: "patient-bruno" },
      data: { expiresAt: new Date(0) },
    });
    expect((await get("/auth/me", bruno)).statusCode).toBe(401);
  });
});
