import { db } from "../src/database/client";
import { hashPassword } from "../src/auth/password";
export async function seed() {
  if (process.env.NODE_ENV === "production")
    throw new Error("Demo seed is disabled in production");
  const passwordHash = await hashPassword("Clinica123!");
  for (const user of [
    {
      id: "staff",
      name: "Equipe da clínica",
      email: "equipe@clinica.test",
      role: "CLINIC_STAFF" as const,
    },
    {
      id: "patient-ana",
      name: "Ana Silva",
      email: "ana@clinica.test",
      role: "PATIENT" as const,
    },
    {
      id: "patient-bruno",
      name: "Bruno Costa",
      email: "bruno@clinica.test",
      role: "PATIENT" as const,
    },
  ])
    await db.user.upsert({
      where: { id: user.id },
      create: { ...user, passwordHash },
      update: { ...user, passwordHash },
    });
  for (const exam of [
    { id: "xray", name: "Raio-X" },
    { id: "ultrasound", name: "Ultrassom" },
    { id: "mri", name: "Ressonância magnética" },
  ])
    await db.examinationType.upsert({
      where: { id: exam.id },
      create: exam,
      update: exam,
    });
  const base = new Date();
  base.setUTCDate(base.getUTCDate() + 7);
  base.setUTCHours(12, 0, 0, 0);
  for (const [index, id] of [
    "example-draft",
    "example-published",
    "example-cancelled",
    "example-bruno",
  ].entries()) {
    const appointment = {
      patientId: index === 3 ? "patient-bruno" : "patient-ana",
      examinationTypeId: ["xray", "ultrasound", "mri"][index % 3] ?? "xray",
      scheduledAt: new Date(base.getTime() + index * 30 * 60000),
      status: index === 2 ? ("CANCELLED" as const) : ("SCHEDULED" as const),
    };
    await db.appointment.upsert({
      where: { id },
      create: { id, ...appointment },
      update: {},
    });
    if (index < 2)
      await db.medicalReport.upsert({
        where: { appointmentId: id },
        create: {
          id: `report-${id}`,
          appointmentId: id,
          title: "Laudo demonstrativo",
          text: "Conteúdo fictício para demonstrar a consulta de laudos. Sem validade clínica.",
          professionalName: "Dra. Maria Oliveira",
          status: index === 1 ? "PUBLISHED" : "DRAFT",
          publishedAt: index === 1 ? new Date() : null,
        },
        update: {},
      });
  }
}
if (process.argv[1]?.endsWith("seed.ts"))
  seed().finally(() => db.$disconnect());
