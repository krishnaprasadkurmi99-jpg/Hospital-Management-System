import {
  AdmissionStatus,
  AppointmentStatus,
  BedStatus,
  InvoiceStatus,
  LabStatus,
  PrismaClient,
  Role,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import "dotenv/config";

const prisma = new PrismaClient();

const patientNames = [
  ["Aarav", "Sharma"], ["Aditi", "Rao"], ["Ananya", "Patel"], ["Arjun", "Mehta"],
  ["Diya", "Nair"], ["Ishaan", "Kapoor"], ["Kabir", "Joshi"], ["Kavya", "Iyer"],
  ["Krishna", "Verma"], ["Mira", "Desai"], ["Neel", "Kulkarni"], ["Nisha", "Bhat"],
  ["Om", "Malhotra"], ["Pooja", "Singh"], ["Rahul", "Gupta"], ["Riya", "Chawla"],
  ["Rohan", "Menon"], ["Saanvi", "Shah"], ["Samarth", "Mishra"], ["Sara", "Thomas"],
  ["Shaurya", "Pillai"], ["Siya", "Das"], ["Tara", "Saxena"], ["Varun", "Reddy"],
  ["Ved", "Agarwal"], ["Vihan", "Choudhary"], ["Vivaan", "Roy"], ["Yash", "Khan"],
  ["Zara", "Fernandes"], ["Zoya", "Sethi"],
] as const;

const specialties = ["Cardiology", "Neurology", "General Medicine", "Pediatrics", "Cardiology", "Neurology"];
const labTests = ["Complete Blood Count", "Lipid Profile", "Chest X-Ray", "Blood Glucose", "Thyroid Panel", "Urinalysis"];

function daysAgo(days: number, hour = 10) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, 0, 0, 0);
  return date;
}

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@example.test";
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!password) throw new Error("SEED_ADMIN_PASSWORD must be configured for seeding.");

  await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: "MediVerse Administrator",
      role: Role.ADMIN,
      passwordHash: await bcrypt.hash(password, 12),
    },
  });

  const departmentNames = ["Cardiology", "Neurology", "General Medicine", "Pediatrics"];
  const departments = await Promise.all(
    departmentNames.map((name) =>
      prisma.department.upsert({
        where: { name },
        update: {},
        create: { name, description: `${name} synthetic demo department` },
      }),
    ),
  );

  const departmentByName = new Map(departments.map((department) => [department.name, department]));
  const doctors = [];
  for (let index = 0; index < specialties.length; index += 1) {
    const specialty = specialties[index];
    const department = departmentByName.get(specialty) ?? departments[0];
    const emailAddress = `doctor${index + 1}@demo.mediverse.test`;
    const user = await prisma.user.upsert({
      where: { email: emailAddress },
      update: { name: `Dr. Demo ${index + 1}`, role: Role.DOCTOR, active: true },
      create: {
        email: emailAddress,
        name: `Dr. Demo ${index + 1}`,
        role: Role.DOCTOR,
        passwordHash: await bcrypt.hash(`demo-doctor-${index + 1}`, 10),
      },
    });
    doctors.push(
      await prisma.doctor.upsert({
        where: { userId: user.id },
        update: { departmentId: department.id, specialty, onDuty: index < 3 },
        create: { userId: user.id, departmentId: department.id, specialty, onDuty: index < 3 },
      }),
    );
  }

  const patients = [];
  for (let index = 0; index < patientNames.length; index += 1) {
    const [firstName, lastName] = patientNames[index];
    patients.push(
      await prisma.patient.upsert({
        where: { patientNumber: `DEMO-${String(index + 1).padStart(3, "0")}` },
        update: {
          firstName,
          lastName,
          phone: `+91 90000 ${String(10000 + index).slice(-5)}`,
          departmentId: departments[index % departments.length].id,
        },
        create: {
          patientNumber: `DEMO-${String(index + 1).padStart(3, "0")}`,
          firstName,
          lastName,
          dateOfBirth: new Date(1965 + (index % 35), index % 12, 1 + (index % 27)),
          phone: `+91 90000 ${String(10000 + index).slice(-5)}`,
          emergencyContact: `+91 98888 ${String(20000 + index).slice(-5)}`,
          departmentId: departments[index % departments.length].id,
        },
      }),
    );
  }

  const wards = [];
  for (let index = 0; index < departments.length; index += 1) {
    const department = departments[index];
    const ward = await prisma.ward.findFirst({ where: { name: `Demo ${department.name} Ward` } });
    wards.push(
      ward ??
        (await prisma.ward.create({
          data: { name: `Demo ${department.name} Ward`, departmentId: department.id },
        })),
    );
  }
  const beds = [];
  for (const ward of wards) {
    for (let index = 1; index <= 4; index += 1) {
      beds.push(
        await prisma.bed.upsert({
          where: { wardId_label: { wardId: ward.id, label: `D-${index}` } },
          update: { status: index === 1 ? BedStatus.OCCUPIED : BedStatus.AVAILABLE },
          create: { wardId: ward.id, label: `D-${index}`, status: index === 1 ? BedStatus.OCCUPIED : BedStatus.AVAILABLE },
        }),
      );
    }
  }

  for (let index = 0; index < 18; index += 1) {
    const patient = patients[index % patients.length];
    const doctor = doctors[index % doctors.length];
    const startsAt = index < 8 ? daysAgo(0, 9 + (index % 6)) : daysAgo(index % 10, 9 + (index % 6));
    await prisma.appointment.upsert({
      where: { id: `demo-appointment-${index + 1}` },
      update: { patientId: patient.id, doctorId: doctor.id, departmentId: doctor.departmentId, startsAt },
      create: {
        id: `demo-appointment-${index + 1}`,
        patientId: patient.id,
        doctorId: doctor.id,
        departmentId: doctor.departmentId,
        startsAt,
        endsAt: new Date(startsAt.getTime() + 30 * 60 * 1000),
        status: index < 8 ? AppointmentStatus.SCHEDULED : AppointmentStatus.COMPLETED,
      },
    });
  }

  for (let index = 0; index < 8; index += 1) {
    const patient = patients[index];
    const bed = beds[index * 2];
    await prisma.admission.upsert({
      where: { id: `demo-admission-${index + 1}` },
      update: { patientId: patient.id, bedId: bed.id, status: index < 4 ? AdmissionStatus.ACTIVE : AdmissionStatus.DISCHARGED },
      create: {
        id: `demo-admission-${index + 1}`,
        patientId: patient.id,
        bedId: bed.id,
        admittedAt: daysAgo(index + 1),
        dischargedAt: index < 4 ? null : daysAgo(index - 1),
        status: index < 4 ? AdmissionStatus.ACTIVE : AdmissionStatus.DISCHARGED,
      },
    });
  }

  for (let index = 0; index < 12; index += 1) {
    const medicine = await prisma.medicine.upsert({
      where: { sku: `DEMO-MED-${String(index + 1).padStart(3, "0")}` },
      update: { quantity: 25 + index * 5 },
      create: {
        name: ["Paracetamol", "Amoxicillin", "Atorvastatin", "Metformin", "Omeprazole", "Cetirizine"][index % 6],
        sku: `DEMO-MED-${String(index + 1).padStart(3, "0")}`,
        quantity: 25 + index * 5,
        reorderLevel: 20,
        expiresAt: new Date(2027, index % 12, 15),
      },
    });
    await prisma.inventoryTransaction.upsert({
      where: { id: `demo-inventory-transaction-${index + 1}` },
      update: { medicineId: medicine.id, quantity: 25 + index * 5, reason: "Initial demo stock" },
      create: {
        id: `demo-inventory-transaction-${index + 1}`,
        medicineId: medicine.id,
        quantity: 25 + index * 5,
        reason: "Initial demo stock",
      },
    });
  }

  for (let index = 0; index < 20; index += 1) {
    const patient = patients[index % patients.length];
    const order = await prisma.labOrder.upsert({
      where: { id: `demo-lab-order-${index + 1}` },
      update: { patientId: patient.id, testName: labTests[index % labTests.length], status: index < 7 ? LabStatus.ORDERED : LabStatus.COMPLETED },
      create: {
        id: `demo-lab-order-${index + 1}`,
        patientId: patient.id,
        testName: labTests[index % labTests.length],
        status: index < 7 ? LabStatus.ORDERED : LabStatus.COMPLETED,
      },
    });
    if (index >= 7) {
      await prisma.labResult.upsert({
        where: { labOrderId: order.id },
        update: { summary: "Within expected reference range for demo purposes." },
        create: { labOrderId: order.id, summary: "Within expected reference range for demo purposes." },
      });
    }
  }

  for (let index = 0; index < 15; index += 1) {
    const patient = patients[index];
    const subtotal = 500 + index * 125;
    const tax = subtotal * 0.05;
    const total = subtotal + tax;
    const status = index < 5 ? InvoiceStatus.UNPAID : index < 9 ? InvoiceStatus.PARTIAL : InvoiceStatus.PAID;
    const balance = status === InvoiceStatus.PAID ? 0 : status === InvoiceStatus.PARTIAL ? total / 2 : total;
    const invoice = await prisma.invoice.upsert({
      where: { id: `demo-invoice-${index + 1}` },
      update: { patientId: patient.id, subtotal, tax, total, balance, status },
      create: {
        id: `demo-invoice-${index + 1}`,
        patientId: patient.id,
        subtotal,
        tax,
        total,
        balance,
        status,
        items: { create: [{ description: "Consultation and care", quantity: 1, unitPrice: subtotal }] },
      },
    });
    if (status !== InvoiceStatus.UNPAID) {
      await prisma.payment.upsert({
        where: { reference: `DEMO-PAY-${String(index + 1).padStart(3, "0")}` },
        update: { invoiceId: invoice.id, amount: total - balance },
        create: {
          invoiceId: invoice.id,
          amount: total - balance,
          reference: `DEMO-PAY-${String(index + 1).padStart(3, "0")}`,
          simulated: true,
        },
      });
    }
  }

  console.log("Seeded synthetic demo records: 30 patients, 6 doctors, 16 beds, 18 appointments, 8 admissions, 12 medicines, 20 lab orders, and 15 invoices.");
}

main().finally(() => prisma.$disconnect());
