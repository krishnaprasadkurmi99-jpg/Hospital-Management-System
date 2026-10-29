import React from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider, useMutation, useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Activity, BedDouble, CalendarDays, Check, ChevronRight, CircleHelp, Edit3, FlaskConical, LayoutDashboard, Menu, MessageCircle, Pill, Save, Send, Stethoscope, Users, WalletCards, type LucideIcon } from "lucide-react";
import "./styles.css";

const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api/v1", withCredentials: true });
const queryClient = new QueryClient();
const nav: { label: string; icon: LucideIcon }[] = [{ label: "Dashboard", icon: LayoutDashboard }, { label: "Patients", icon: Users }, { label: "Doctors & Staff", icon: Stethoscope }, { label: "Appointments", icon: CalendarDays }, { label: "Admissions & Discharges", icon: BedDouble }, { label: "Pharmacy", icon: Pill }, { label: "Laboratory", icon: FlaskConical }, { label: "Billing & Payments", icon: WalletCards }];
type Summary = { patients:number; appointments:number; occupiedBeds:number; availableBeds:number; doctorsOnDuty:number; pendingLabs:number; pendingInvoices:number; revenue:number };
const demoSummary: Summary = { patients: 30, appointments: 8, occupiedBeds: 4, availableBeds: 12, doctorsOnDuty: 3, pendingLabs: 7, pendingInvoices: 9, revenue: 23625 };
const wards = [
  { id: "north", name: "North Wing", department: "Cardiology", x: 8, y: 12, beds: 8, occupied: 6, status: "High activity", patients: ["Aarav Sharma", "Diya Nair"] },
  { id: "east", name: "East Wing", department: "Neurology", x: 57, y: 12, beds: 6, occupied: 3, status: "Stable", patients: ["Aditi Rao"] },
  { id: "south", name: "South Wing", department: "General Medicine", x: 8, y: 58, beds: 8, occupied: 4, status: "Stable", patients: ["Ananya Patel", "Rohan Das"] },
  { id: "west", name: "West Wing", department: "Pediatrics", x: 57, y: 58, beds: 6, occupied: 2, status: "Quiet", patients: ["Arjun Mehta"] },
];
const journey = ["Registration", "Consultation", "Laboratory", "Pharmacy", "Billing", "Discharge"];
const demoRows: Record<string, { columns: string[]; rows: string[][] }> = {
  Patients: { columns: ["Patient ID", "Name", "Department", "Phone"], rows: [["DEMO-001", "Aarav Sharma", "Cardiology", "+91 90000 10000"], ["DEMO-002", "Aditi Rao", "Neurology", "+91 90000 10001"], ["DEMO-003", "Ananya Patel", "General Medicine", "+91 90000 10002"], ["DEMO-004", "Arjun Mehta", "Pediatrics", "+91 90000 10003"]] },
  "Doctors & Staff": { columns: ["Name", "Specialty", "Department", "Status"], rows: [["Dr. Demo 1", "Cardiology", "Cardiology", "On duty"], ["Dr. Demo 2", "Neurology", "Neurology", "On duty"], ["Dr. Demo 3", "General Medicine", "General Medicine", "On duty"]] },
  Appointments: { columns: ["Appointment", "Patient", "Doctor", "Status"], rows: [["DEMO-APT-001", "Aarav Sharma", "Dr. Demo 1", "Scheduled"], ["DEMO-APT-002", "Aditi Rao", "Dr. Demo 2", "Scheduled"], ["DEMO-APT-003", "Ananya Patel", "Dr. Demo 3", "Completed"]] },
  "Admissions & Discharges": { columns: ["Admission", "Patient", "Bed", "Status"], rows: [["DEMO-ADM-001", "Aarav Sharma", "Cardiology / D-1", "Active"], ["DEMO-ADM-002", "Aditi Rao", "Neurology / D-1", "Active"], ["DEMO-ADM-003", "Ananya Patel", "General Medicine / D-1", "Active"]] },
  Pharmacy: { columns: ["SKU", "Medicine", "Quantity", "Stock"], rows: [["DEMO-MED-001", "Paracetamol", "25", "In stock"], ["DEMO-MED-002", "Amoxicillin", "30", "In stock"], ["DEMO-MED-003", "Metformin", "40", "In stock"]] },
  Laboratory: { columns: ["Order", "Patient", "Test", "Status"], rows: [["DEMO-LAB-001", "Aarav Sharma", "Complete Blood Count", "Ordered"], ["DEMO-LAB-002", "Aditi Rao", "Lipid Profile", "Processing"], ["DEMO-LAB-003", "Ananya Patel", "Chest X-Ray", "Completed"]] },
  "Billing & Payments": { columns: ["Invoice", "Patient", "Total", "Status"], rows: [["DEMO-INV-001", "Aarav Sharma", "₹525.00", "Unpaid"], ["DEMO-INV-002", "Aditi Rao", "₹656.25", "Unpaid"], ["DEMO-INV-003", "Ananya Patel", "₹787.50", "Partial"]] },
};

function HospitalMap() {
  const [selected, setSelected] = React.useState(wards[0]);
  return <section className="panel map-panel"><div className="panel-title"><div><p className="eyebrow">INTERACTIVE FLOOR PLAN</p><h2>Hospital digital twin</h2></div><span className="live">● Live sync</span></div><div className="map-layout"><div className="floor-plan"><div className="map-core"><Activity size={20}/><span>Central<br/>Hub</span></div>{wards.map(ward=><button key={ward.id} className={`ward ward-${ward.id} ${selected.id===ward.id?"selected":""}`} style={{left:`${ward.x}%`,top:`${ward.y}%`}} onClick={()=>setSelected(ward)}><strong>{ward.name}</strong><small>{ward.department}</small><span><b>{ward.occupied}</b>/{ward.beds} beds</span></button>)}</div><div className="ward-detail"><span className="badge">{selected.status}</span><h3>{selected.name}</h3><p className="muted">{selected.department} department</p><div className="detail-stats"><div><strong>{selected.beds-selected.occupied}</strong><small>Available</small></div><div><strong>{selected.occupied}</strong><small>Occupied</small></div></div><p className="detail-label">Assigned patients</p>{selected.patients.map(patient=><div className="patient-chip" key={patient}><span className="avatar">{patient[0]}</span>{patient}<ChevronRight size={14}/></div>)}<p className="room-status"><span className="status-dot"/> Room systems operational</p></div></div></section>;
}

function JourneyTracker() {
  const [active, setActive] = React.useState(2);
  return <section className="panel journey-panel"><div className="panel-title"><div><p className="eyebrow">PATIENT FLOW</p><h2>Patient journey tracker</h2></div><select aria-label="Select patient"><option>Aarav Sharma · DEMO-001</option><option>Aditi Rao · DEMO-002</option></select></div><div className="journey-track">{journey.map((step,index)=><button className={`journey-step ${index<active?"complete":""} ${index===active?"current":""}`} key={step} onClick={()=>setActive(index)}><span className="step-icon">{index<active?<Check size={15}/>:index+1}</span><strong>{step}</strong><small>{index<active?"Complete":index===active?"In progress":"Queued"}</small></button>)}</div><div className="journey-note"><Activity size={17}/><span><b>Laboratory is in progress</b><br/><small>Complete Blood Count · estimated 18 min remaining</small></span><span className="live">LIVE</span></div></section>;
}

function OperationsTwin({ summary }: { summary: Summary }) {
  const occupancy = Math.round((summary.occupiedBeds/(summary.occupiedBeds+summary.availableBeds))*100);
  return <section className="panel operations-panel"><div className="panel-title"><div><p className="eyebrow">OPERATIONS OVERVIEW</p><h2>Live hospital activity</h2></div><span className="badge">SYNTHETIC DATA</span></div><div className="ops-grid"><div className="op-card"><span className="op-icon cyan"><BedDouble size={17}/></span><div><small>Bed occupancy</small><strong>{occupancy}%</strong><div className="progress"><i style={{width:`${occupancy}%`}}/></div><em>{summary.availableBeds} beds available</em></div></div><div className="op-card"><span className="op-icon green"><Users size={17}/></span><div><small>Patient flow</small><strong>24 <em>today</em></strong><div className="flow-bars"><i/><i/><i/><i/><i/></div><em>+12% vs yesterday</em></div></div><div className="op-card"><span className="op-icon purple"><Stethoscope size={17}/></span><div><small>Staffing</small><strong>{summary.doctorsOnDuty} <em>on duty</em></strong><div className="staff-dots"><i/><i/><i/><i/><i/></div><em>2 shifts active</em></div></div></div></section>;
}

function Assistant() {
  const [messages, setMessages] = React.useState(["Hi, I’m MediVerse AI. Ask me about operational data, such as beds or pending lab reports."]);
  const [input, setInput] = React.useState("");
  const answer = (question: string) => { const q=question.toLowerCase(); if(q.includes("bed")) return "There are 12 available beds across 4 wards. North Wing has 2, East Wing 3, South Wing 4, and West Wing 4 available."; if(q.includes("lab")) return "There are 7 pending lab orders. The oldest pending order is Aarav Sharma’s Complete Blood Count."; if(q.includes("staff")||q.includes("doctor")) return "3 doctors are currently on duty, with 2 active shifts in the hospital."; return "I can answer questions about beds, wards, staffing, patient flow, and pending laboratory work."; };
  const ask = (event: React.FormEvent) => { event.preventDefault(); const question=input.trim(); if(!question)return; setMessages([...messages, question, answer(question)]); setInput(""); };
  return <aside className="assistant"><div className="assistant-head"><span className="assistant-icon"><MessageCircle size={17}/></span><div><strong>MediVerse AI</strong><small>Operations assistant</small></div><span className="online-dot"/></div><div className="assistant-messages">{messages.map((message,index)=><div className={index%2===0?"ai-message":"user-message"} key={`${message}-${index}`}>{message}</div>)}</div><div className="suggestions"><button onClick={()=>setInput("How many beds are available?")}>Available beds</button><button onClick={()=>setInput("Which lab reports are pending?")}>Pending labs</button></div><form className="assistant-form" onSubmit={ask}><input value={input} onChange={e=>setInput(e.target.value)} placeholder="Ask an operations question…" aria-label="Ask MediVerse AI"/><button aria-label="Send question"><Send size={15}/></button></form><p className="assistant-disclaimer"><CircleHelp size={13}/> Operational information only · Not a diagnostic tool</p></aside>;
}

function App() {
  const [page,setPage]=React.useState("Dashboard");
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const selectPage = (nextPage: string) => {
    setPage(nextPage);
    setSidebarOpen(false);
  };
  return <div className="shell"><aside className={sidebarOpen ? "sidebar-open" : ""}><div className="logo">✦ <span>Medi<span>Verse</span></span></div><nav>{nav.map(item=>{const Icon=item.icon;return <button className={page===item.label?"active":""} onClick={()=>selectPage(item.label)} key={item.label}><Icon size={17}/>{item.label}</button>})}</nav><div className="sidebar-bottom"><span className="muted">Synthetic data only</span></div></aside><main className="main"><header><button className="mobile-menu" aria-label="Open navigation" aria-expanded={sidebarOpen} onClick={()=>setSidebarOpen(open=>!open)}><Menu/></button><span className="muted">Workspace / </span><b>{page}</b><span className="header-user">MediVerse</span></header><section className="content"><Dashboard page={page}/></section></main></div>;
}

type PatientRecord = { id: string; patientNumber: string; firstName: string; lastName: string; phone: string; department?: { name: string } | null };
type OperationalRecord = { id: string; patient?: { firstName: string; lastName: string; patientNumber: string }; status: string; testName?: string; startsAt?: string; bed?: { label: string; ward: { name: string } }; total?: string | number; balance?: string | number };
const moduleConfig: Record<string, { endpoint: string; title: string; statuses?: string[] }> = {
  Patients: { endpoint: "/patients", title: "patient records" },
  Appointments: { endpoint: "/appointments", title: "appointments", statuses: ["SCHEDULED", "CONFIRMED", "COMPLETED", "CANCELLED"] },
  "Admissions & Discharges": { endpoint: "/admissions", title: "admissions", statuses: ["ACTIVE", "DISCHARGED"] },
  Laboratory: { endpoint: "/lab-orders", title: "lab orders", statuses: ["ORDERED", "COLLECTED", "PROCESSING", "COMPLETED"] },
  "Billing & Payments": { endpoint: "/invoices", title: "invoices", statuses: ["UNPAID", "PARTIAL", "PAID"] },
};
function demoRecords(page: string): PatientRecord[] | OperationalRecord[] {
  const rows = demoRows[page]?.rows ?? [];
  if (page === "Patients") return rows.map((row, index) => ({ id: `demo-patient-${index}`, patientNumber: row[0], firstName: row[1].split(" ")[0], lastName: row[1].split(" ").slice(1).join(" "), phone: row[3], department: { name: row[2] } }));
  return rows.map((row, index) => ({
    id: `demo-${page.toLowerCase().replace(/\W/g, "-")}-${index}`,
    patient: { patientNumber: row[1], firstName: row[1].split(" ")[0], lastName: row[1].split(" ").slice(1).join(" ") },
    status: row[row.length - 1].toUpperCase(),
    testName: page === "Laboratory" ? row[2] : undefined,
    startsAt: page === "Appointments" ? new Date().toISOString() : undefined,
    total: page === "Billing & Payments" ? Number(row[2].replace(/[^\d.]/g, "")) : undefined,
  }));
}

function RecordsPage({ page }: { page: string }) {
  const config = moduleConfig[page];
  const query = useQuery<PatientRecord[] | OperationalRecord[]>({
    queryKey: ["records", page],
    queryFn: async () => {
      try {
        const response = await api.get(config.endpoint);
        return (response.data.data.items ?? response.data.data) as PatientRecord[] | OperationalRecord[];
      } catch {
        return demoRecords(page);
      }
    },
  });
  const isDemo = (query.data ?? []).length > 0 && (query.data ?? []).every(row => row.id.startsWith("demo-"));
  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => isDemo
      ? Promise.resolve(queryClient.setQueryData(["records", page], (current: PatientRecord[] | OperationalRecord[] | undefined) => current?.map(row => row.id === id ? { ...row, status } : row)))
      : api.patch(`${config.endpoint}/${id}/status`, { status }),
    onSuccess: () => {
      if (!isDemo) {
        queryClient.invalidateQueries({ queryKey: ["records", page] });
        queryClient.invalidateQueries({ queryKey: ["summary"] });
      }
    },
  });
  const updatePatient = useMutation({
    mutationFn: ({ id, values }: { id: string; values: Partial<PatientRecord> }) => isDemo
      ? Promise.resolve(queryClient.setQueryData(["records", page], (current: PatientRecord[] | OperationalRecord[] | undefined) => current?.map(row => row.id === id ? { ...row, ...values } : row)))
      : api.patch(`/patients/${id}`, values),
    onSuccess: () => {
      if (!isDemo) {
        queryClient.invalidateQueries({ queryKey: ["records", page] });
        queryClient.invalidateQueries({ queryKey: ["summary"] });
      }
    },
  });
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState({ firstName: "", lastName: "", phone: "" });
  if (query.isLoading) return <div className="empty">Loading {config.title}…</div>;
  if (query.isError) return <div className="empty"><h2>Unable to load records</h2><p className="muted">Sign in with an authorized hospital role and try again.</p></div>;
  const rows = query.data ?? [];
  const startEditing = (patient: PatientRecord) => {
    setEditingId(patient.id);
    setDraft({ firstName: patient.firstName, lastName: patient.lastName, phone: patient.phone });
  };
  const savePatient = (id: string) => {
    updatePatient.mutate({ id, values: draft });
    setEditingId(null);
  };
  const actionError = updateStatus.error ?? updatePatient.error;
  return <><p className="eyebrow">{isDemo ? "DEMO RECORDS" : "LIVE RECORDS"}</p><div className="page-head"><div><h1>{page}</h1><p className="muted">{isDemo ? "The API is unavailable. Changes are saved in this demo view only." : "Update records directly and complete pending work from this view."}</p>{actionError && <p className="error">Could not save this change. The API may be unavailable.</p>}</div></div><div className="panel data-panel"><div className="panel-title"><h2>{rows.length} {config.title}</h2><span className="badge">{isDemo ? "DEMO DATA" : "LIVE API"}</span></div>{rows.length === 0 ? <div className="empty">No records found.</div> : <div className="data-table">{page === "Patients" ? <div className="data-row data-header"><strong>Patient ID</strong><strong>Name</strong><strong>Department</strong><strong>Phone</strong><strong>Action</strong></div> : <div className="data-row data-header"><strong>Record</strong><strong>Patient</strong><strong>Details</strong><strong>Status</strong><strong>Action</strong></div>}{rows.map((row) => { const patient = row as PatientRecord; const record = row as OperationalRecord; return <div className="data-row" key={row.id}>{page === "Patients" ? <>{editingId === patient.id ? <><input value={draft.firstName} onChange={event => setDraft({ ...draft, firstName: event.target.value })} aria-label="First name"/><input value={draft.lastName} onChange={event => setDraft({ ...draft, lastName: event.target.value })} aria-label="Last name"/></> : <><span>{patient.patientNumber}</span><span>{patient.firstName} {patient.lastName}</span></>}<span>{patient.department?.name ?? "Unassigned"}</span>{editingId === patient.id ? <input value={draft.phone} onChange={event => setDraft({ ...draft, phone: event.target.value })} aria-label="Phone"/> : <span>{patient.phone}</span>}<button className="table-action" onClick={() => editingId === patient.id ? savePatient(patient.id) : startEditing(patient)} aria-label={editingId === patient.id ? "Save patient" : "Edit patient"}>{editingId === patient.id ? <Save size={15}/> : <Edit3 size={15}/>}</button></> : <><span>{record.id.slice(0, 12)}</span><span>{record.patient ? `${record.patient.firstName} ${record.patient.lastName}` : "—"}</span><span>{record.testName ?? record.bed ? `${record.testName ?? ""}${record.bed ? `${record.testName ? " · " : ""}${record.bed.ward.name} / ${record.bed.label}` : ""}` : record.startsAt ? new Date(record.startsAt).toLocaleString() : record.total !== undefined ? `₹${Number(record.total).toLocaleString("en-IN")}` : "—"}</span><span className="status-text">{record.status}</span><select className="status-select" value={record.status} onChange={event => updateStatus.mutate({ id: record.id, status: event.target.value })} disabled={updateStatus.isPending}>{config.statuses?.map(status => <option key={status} value={status}>{status}</option>)}</select></>}</div>; })}</div>}</div></>;
}

function DemoPage({ page }: { page: string }) {
  const module = demoRows[page];
  return <><p className="eyebrow">SYNTHETIC DEMO RECORDS</p><div className="page-head"><div><h1>{page}</h1><p className="muted">Demo records are shown while the API is not connected.</p></div></div><div className="panel data-panel"><div className="panel-title"><h2>{module?.rows.length ?? 0} records</h2><span className="badge">DEMO DATA</span></div>{module && <div className="data-table"><div className="data-row data-header">{module.columns.map(column => <strong key={column}>{column}</strong>)}</div>{module.rows.map((row, index) => <div className="data-row" key={index}>{row.map((cell, cellIndex) => <span key={cellIndex}>{cell}</span>)}</div>)}</div>}</div></>;
}

function Dashboard({page}:{page:string}) {
 const query=useQuery<Summary>({queryKey:["summary"],queryFn:()=>api.get("/dashboard/summary").then(r=>r.data.data).catch(()=>demoSummary),refetchInterval:60000});
 if(page!=="Dashboard") return moduleConfig[page] ? <RecordsPage page={page}/> : <DemoPage page={page}/>;
 const s=query.data ?? demoSummary; const cards: [string, number | string, LucideIcon][]=[["Registered patients",s.patients,Users],["Appointments today",s.appointments,CalendarDays],["Occupied beds",s.occupiedBeds,BedDouble],["Available beds",s.availableBeds,BedDouble],["Doctors on duty",s.doctorsOnDuty,Stethoscope],["Pending lab orders",s.pendingLabs,FlaskConical],["Collected revenue",`₹${s.revenue.toLocaleString("en-IN")}`,WalletCards]];
 return <><div className="page-head"><div><p className="eyebrow">WEDNESDAY · OCTOBER 28, 2026</p><h1>Good morning, Administrator <span>✦</span></h1><p className="muted">Your hospital operations at a glance.</p></div><button className="primary">+ New action</button></div><div className="metrics">{cards.map(([label,value,Icon])=><div className="metric" key={String(label)}><Icon size={18}/><small>{label}</small><strong>{String(value)}</strong><span>{label === "Collected revenue" ? "Collected payments" : "Live from API"}</span></div>)}</div><div className="dashboard-columns"><div><HospitalMap/><JourneyTracker/><OperationsTwin summary={s}/></div><Assistant/></div></>;
}

function Root() { return <App/>; }
createRoot(document.getElementById("root")!).render(<QueryClientProvider client={queryClient}><Root/></QueryClientProvider>);
