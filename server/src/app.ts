import express from "express";
import helmet from "helmet";
import cors from "cors";
import { PrismaClient, AppointmentStatus, AdmissionStatus, LabStatus, InvoiceStatus } from "@prisma/client";
import { z } from "zod";
import { env } from "./config/env.js";

export const prisma = new PrismaClient();
export const app = express();
app.use(helmet());
app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.get("/api/v1/health", (_req, res) => res.json({ data: { status: "ok", syntheticData: true } }));
app.get("/api/v1/dashboard/summary", async (_req, res, next) => {
  try {
    const [patients, appointments, occupied, beds, doctors, labs, invoices, revenue] = await Promise.all([
      prisma.patient.count(), prisma.appointment.count({ where: { startsAt: { gte: new Date(new Date().setHours(0,0,0,0)) } } }),
      prisma.bed.count({ where: { status: "OCCUPIED" } }), prisma.bed.count(), prisma.doctor.count({ where: { onDuty: true } }),
      prisma.labOrder.count({ where: { status: { not: "COMPLETED" } } }), prisma.invoice.count({ where: { status: { not: "PAID" } } }),
      prisma.payment.aggregate({ _sum: { amount: true } }),
    ]);
    res.json({ data: { patients, appointments, occupiedBeds: occupied, availableBeds: beds - occupied, doctorsOnDuty: doctors, pendingLabs: labs, pendingInvoices: invoices, revenue: Number(revenue._sum.amount ?? 0) } });
  } catch (error) { next(error); }
});
app.get("/api/v1/patients", async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page ?? 1)); const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 20)));
    const search = String(req.query.search ?? "").trim();
    const where = search ? { OR: [{ firstName: { contains: search, mode: "insensitive" as const } }, { lastName: { contains: search, mode: "insensitive" as const } }, { patientNumber: { contains: search, mode: "insensitive" as const } }] } : {};
    const [items, total] = await prisma.$transaction([prisma.patient.findMany({ where, skip: (page-1)*limit, take: limit, orderBy: { createdAt: "desc" }, include: { department: true } }), prisma.patient.count({ where })]);
    res.json({ data: { items, page, limit, total } });
  } catch (error) { next(error); }
});
app.post("/api/v1/patients", async (req, res, next) => {
  try {
    const input = z.object({ firstName: z.string().min(1).max(80), lastName: z.string().min(1).max(80), dateOfBirth: z.coerce.date(), phone: z.string().min(7).max(30), emergencyContact: z.string().max(120).optional(), departmentId: z.string().optional() }).parse(req.body);
    const patient = await prisma.patient.create({ data: { ...input, patientNumber: `PT-${Date.now().toString().slice(-8)}` } });
    res.status(201).json({ data: patient });
  } catch (error) { next(error); }
});
app.patch("/api/v1/patients/:id", async (req, res, next) => {
  try {
    const input = z.object({
      firstName: z.string().min(1).max(80).optional(),
      lastName: z.string().min(1).max(80).optional(),
      dateOfBirth: z.coerce.date().optional(),
      phone: z.string().min(7).max(30).optional(),
      emergencyContact: z.string().max(120).optional(),
      departmentId: z.string().nullable().optional(),
    }).parse(req.body);
    const patient = await prisma.patient.update({ where: { id: String(req.params.id) }, data: input, include: { department: true } });
    res.json({ data: patient });
  } catch (error) { next(error); }
});
app.get("/api/v1/appointments", async (_req, res, next) => {
  try {
    const items = await prisma.appointment.findMany({
      orderBy: { startsAt: "asc" },
      include: { patient: true, doctor: { include: { user: true } }, department: true },
    });
    res.json({ data: items });
  } catch (error) { next(error); }
});
app.patch("/api/v1/appointments/:id/status", async (req, res, next) => {
  try {
    const input = z.object({ status: z.nativeEnum(AppointmentStatus) }).parse(req.body);
    const appointment = await prisma.appointment.update({ where: { id: String(req.params.id) }, data: { status: input.status } });
    res.json({ data: appointment });
  } catch (error) { next(error); }
});
app.get("/api/v1/admissions", async (_req, res, next) => {
  try {
    const items = await prisma.admission.findMany({ orderBy: { admittedAt: "desc" }, include: { patient: true, bed: { include: { ward: { include: { department: true } } } } } });
    res.json({ data: items });
  } catch (error) { next(error); }
});
app.patch("/api/v1/admissions/:id/status", async (req, res, next) => {
  try {
    const input = z.object({ status: z.nativeEnum(AdmissionStatus) }).parse(req.body);
    const admission = await prisma.$transaction(async (tx) => {
      const updated = await tx.admission.update({ where: { id: String(req.params.id) }, data: { status: input.status, dischargedAt: input.status === AdmissionStatus.DISCHARGED ? new Date() : null } });
      await tx.bed.update({ where: { id: updated.bedId }, data: { status: input.status === AdmissionStatus.DISCHARGED ? "AVAILABLE" : "OCCUPIED" } });
      return updated;
    });
    res.json({ data: admission });
  } catch (error) { next(error); }
});
app.get("/api/v1/lab-orders", async (_req, res, next) => {
  try {
    const items = await prisma.labOrder.findMany({ orderBy: { createdAt: "desc" }, include: { patient: true, result: true } });
    res.json({ data: items });
  } catch (error) { next(error); }
});
app.patch("/api/v1/lab-orders/:id/status", async (req, res, next) => {
  try {
    const input = z.object({ status: z.nativeEnum(LabStatus) }).parse(req.body);
    const order = await prisma.labOrder.update({ where: { id: String(req.params.id) }, data: { status: input.status } });
    res.json({ data: order });
  } catch (error) { next(error); }
});
app.get("/api/v1/invoices", async (_req, res, next) => {
  try {
    const items = await prisma.invoice.findMany({ orderBy: { createdAt: "desc" }, include: { patient: true } });
    res.json({ data: items });
  } catch (error) { next(error); }
});
app.patch("/api/v1/invoices/:id/status", async (req, res, next) => {
  try {
    const input = z.object({ status: z.nativeEnum(InvoiceStatus) }).parse(req.body);
    const invoice = await prisma.invoice.update({ where: { id: String(req.params.id) }, data: { status: input.status, balance: input.status === InvoiceStatus.PAID ? 0 : undefined } });
    res.json({ data: invoice });
  } catch (error) { next(error); }
});
app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (error instanceof z.ZodError) return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: error.issues[0]?.message ?? "Invalid request" } });
  console.error(error); res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } });
});
