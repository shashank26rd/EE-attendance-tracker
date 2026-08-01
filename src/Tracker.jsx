
  
    import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Zap, Calendar, Settings2, CalendarOff, Gauge, Plus, Trash2, Check, X, Minus, ChevronLeft, ChevronRight, AlertTriangle, CircleCheck } from "lucide-react";

// ---------- constants ----------
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_LABELS = { Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday", Fri: "Friday", Sat: "Saturday" };
const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const STORAGE_KEY = "ee-attendance-v1";

// Best-effort readings of the KNIT EE Dept master timetable (WEF 15-07-2026), per year.
// All scanned from a table with merged cells — flagged for user verification in Setup.
const YEAR_TEMPLATES = {
  II: {
    label: "2nd Year",
    subjects: [
      { id: "bdms", name: "BDMS", full: "BDMS", color: "#e0a458" },
      { id: "cys", name: "CY.S", full: "CY.S", color: "#5fb3b3" },
      { id: "emft", name: "EMFT", full: "EMFT", color: "#c76b5c" },
      { id: "emi", name: "EM&I", full: "EM & I", color: "#8a7fd1" },
      { id: "uhv", name: "UHV", full: "UHV", color: "#d1a5c9" },
      { id: "bss", name: "BSS", full: "BSS", color: "#7ba8d4" },
      { id: "emilab", name: "EM&I Lab", full: "EM & I Lab", color: "#6fae5c" },
      { id: "workshop", name: "Workshop", full: "Electrical Workshop", color: "#b3a15f" },
      { id: "csimlab", name: "Ckt Sim Lab", full: "Circuit Simulation Lab", color: "#9a7fbf" },
    ],
    timetable: {
      Mon: ["bdms", "cys", "emft", "emi", "emilab"],
      Tue: ["emft", "emi", "bdms", "bss", "emilab", "workshop"],
      Wed: ["emi", "uhv", "bss", "bss", "emilab"],
      Thu: ["emi", "uhv", "emft", "emft", "workshop", "csimlab"],
      Fri: ["bdms", "bdms", "csimlab", "csimlab", "workshop"],
      Sat: ["cys", "uhv"],
    },
  },
  III: {
    label: "3rd Year",
    subjects: [
      { id: "smps", name: "SMPS", full: "SMPS", color: "#e0a458" },
      { id: "st", name: "S&T", full: "S & T", color: "#5fb3b3" },
      { id: "cs", name: "CS", full: "Control Systems (CS)", color: "#c76b5c" },
      { id: "emii", name: "EM-II", full: "Electrical Machines-II", color: "#8a7fd1" },
      { id: "psi", name: "PS-I", full: "Power Systems-I", color: "#d1a5c9" },
      { id: "nnfs", name: "NNFS", full: "NNFS", color: "#7ba8d4" },
      { id: "eoitk", name: "EOITK", full: "EOITK", color: "#b39ddb" },
      { id: "emeclab", name: "EMEC-II Lab", full: "EMEC-II Lab", color: "#6fae5c" },
      { id: "cslab", name: "Control Sys Lab", full: "Control System Lab", color: "#b3a15f" },
      { id: "pslab", name: "Power Sys Lab", full: "Power System Lab", color: "#9a7fbf" },
    ],
    timetable: {
      Mon: ["smps", "st", "cs", "emii", "emeclab", "cslab"],
      Tue: ["emii", "emii", "psi", "psi", "pslab", "emeclab"],
      Wed: ["smps", "nnfs", "emii", "eoitk", "emeclab", "pslab"],
      Thu: ["st", "nnfs", "cs", "cslab"],
      Fri: ["nnfs", "psi", "psi", "eoitk", "st", "pslab", "cslab"],
      Sat: ["smps", "smps", "cs", "cs"],
    },
  },
  IV: {
    label: "4th Year (Final)",
    subjects: [
      { id: "peres", name: "PERES", full: "Power Electronics for Renewable Energy Systems", color: "#e0a458" },
      { id: "psp", name: "PSP", full: "Power System Protection", color: "#5fb3b3" },
      { id: "ed", name: "ED", full: "Energy Auditing / Design (ED)", color: "#c76b5c" },
      { id: "proj", name: "PROJ", full: "Project-I / Project Progress / Startup Activity", color: "#8a7fd1" },
      { id: "psplab", name: "PSP LAB", full: "Power Systems Protection Lab", color: "#6fae5c" },
    ],
    timetable: {
      Mon: ["proj", "proj"],
      Tue: ["peres", "psp", "proj"],
      Wed: ["ed", "ed", "proj", "psplab"],
      Thu: ["ed", "psp", "proj", "peres", "psplab"],
      Fri: ["psp", "peres", "proj", "peres", "psplab"],
      Sat: [],
    },
  },
};

// UP state + national holidays, Jul 20 – Dec 31 2026 (verify against your institute calendar)
const DEFAULT_HOLIDAYS = [
  { date: "2026-08-15", name: "Independence Day" },
  { date: "2026-08-25", name: "Eid-e-Milad (tentative)" },
  { date: "2026-08-28", name: "Raksha Bandhan" },
  { date: "2026-09-04", name: "Janmashtami" },
  { date: "2026-10-02", name: "Gandhi Jayanti" },
  { date: "2026-10-20", name: "Maha Navami" },
  { date: "2026-10-21", name: "Vijaya Dashami / Dussehra" },
  { date: "2026-11-09", name: "Govardhan Puja / Diwali holiday" },
  { date: "2026-11-11", name: "Bhai Dooj" },
  { date: "2026-11-24", name: "Guru Nanak Jayanti" },
  { date: "2026-12-23", name: "Hazrat Ali Jayanti" },
  { date: "2026-12-25", name: "Christmas Day" },
];

const DEFAULT_KEYDATES = {
  semStart: "2026-07-15",
  ct1: "2026-10-05",
  ct2: "2026-11-16",
  semEnd: "2026-12-15",
};

const todayStr = () => new Date().toISOString().slice(0, 10);

function toDate(s) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function fmtDate(s) {
  return toDate(s).toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
}
function fmtShort(s) {
  return toDate(s).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}
function addDays(s, n) {
  const d = toDate(s);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}
function dayOfWeek(s) {
  return DAYS[toDate(s).getDay()];
}

import { supabase } from "./supabase";

export default function AttendanceTracker({ uid, userEmail, onSignOut }) {
  const [loaded, setLoaded] = useState(false);
  const [profileYear, setProfileYear] = useState(null); // "II" | "III" | "IV" | "custom" | null (not chosen yet)
  const [subjects, setSubjects] = useState([]);
  const [timetable, setTimetable] = useState({});
  const [holidays, setHolidays] = useState(DEFAULT_HOLIDAYS);
  const [keyDates, setKeyDates] = useState(DEFAULT_KEYDATES);
  const [attendance, setAttendance] = useState({});
  const [tab, setTab] = useState("dashboard");
  const [markDate, setMarkDate] = useState(todayStr());
  const [saveState, setSaveState] = useState("idle");

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase.from("attendance_data").select("data").eq("user_id", uid).maybeSingle();
        if (error) throw error;
        if (data && data.data) {
          const d = data.data;
          if (d.profileYear) setProfileYear(d.profileYear);
          if (d.subjects) setSubjects(d.subjects);
          if (d.timetable) setTimetable(d.timetable);
          if (d.holidays) setHolidays(d.holidays);
          if (d.keyDates) setKeyDates(d.keyDates);
          if (d.attendance) setAttendance(d.attendance);
        }
      } catch (e) {
        console.error("Load failed:", e);
      }
      setLoaded(true);
    })();
  }, [uid]);

  useEffect(() => {
    if (!loaded || !profileYear) return;
    setSaveState("saving");
    const t = setTimeout(async () => {
      try {
        const { error } = await supabase
          .from("attendance_data")
          .upsert({ user_id: uid, data: { profileYear, subjects, timetable, holidays, keyDates, attendance } }, { onConflict: "user_id" });
        if (error) throw error;
        setSaveState("saved");
      } catch (e) {
        console.error("Save failed:", e);
        setSaveState("error");
      }
    }, 500);
    return () => clearTimeout(t);
  }, [profileYear, subjects, timetable, holidays, keyDates, attendance, loaded, uid]);

  function chooseYear(yearKey) {
    const tpl = YEAR_TEMPLATES[yearKey];
    setSubjects(tpl.subjects);
    setTimetable(tpl.timetable);
    setProfileYear(yearKey);
  }

  const holidaySet = useMemo(() => new Set(holidays.map((h) => h.date)), [holidays]);
  const subjectMap = useMemo(() => Object.fromEntries(subjects.map((s) => [s.id, s])), [subjects]);

  const classDatesInRange = useCallback(
    (fromStr, toStr) => {
      if (!fromStr || !toStr) return [];
      const out = [];
      let cur = fromStr;
      let guard = 0;
      while (cur <= toStr && guard < 3000) {
        guard++;
        const dn = dayOfWeek(cur);
        if (WEEK_DAYS.includes(dn) && !holidaySet.has(cur)) {
          const slots = timetable[dn] || [];
          if (slots.length) out.push({ date: cur, dayName: dn, slots });
        }
        cur = addDays(cur, 1);
      }
      return out;
    },
    [timetable, holidaySet]
  );

  function subjectStats(subjectId, uptoDate, scheduleEndDate) {
    const allClassDays = classDatesInRange(keyDates.semStart, scheduleEndDate || uptoDate);
    let totalScheduled = 0,
      held = 0,
      present = 0;
    for (const day of allClassDays) {
      const rec = attendance[day.date];
      day.slots.forEach((sid, idx) => {
        if (sid !== subjectId) return;
        if (day.date <= uptoDate) totalScheduled++;
        if (day.date <= uptoDate && rec && rec[idx] && rec[idx] !== "cancelled") {
          held++;
          if (rec[idx] === "present") present++;
        }
      });
    }
    return { totalScheduled, held, present };
  }

  function projection(subjectId, checkpointDate) {
    const today = todayStr();
    const uptoToday = subjectStats(subjectId, today < checkpointDate ? today : checkpointDate, checkpointDate);
    let totalByCheckpoint = 0;
    classDatesInRange(keyDates.semStart, checkpointDate).forEach((day) => day.slots.forEach((sid) => sid === subjectId && totalByCheckpoint++));
    const heldSoFar = uptoToday.held;
    const presentSoFar = uptoToday.present;
    const remaining = totalByCheckpoint - heldSoFar;
    const needed = Math.ceil(0.75 * totalByCheckpoint);
    const maxCanMiss = presentSoFar + remaining - needed;
    return { totalByCheckpoint, heldSoFar, presentSoFar, remaining, needed, maxCanMiss };
  }

  function addSubject() {
    const id = "s" + Date.now();
    setSubjects((s) => [...s, { id, name: "NEW", full: "New Subject", color: "#999" }]);
  }
  function updateSubject(id, patch) {
    setSubjects((s) => s.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  }
  function removeSubject(id) {
    setSubjects((s) => s.filter((x) => x.id !== id));
    setTimetable((tt) => {
      const next = {};
      for (const d of WEEK_DAYS) next[d] = (tt[d] || []).filter((sid) => sid !== id);
      return next;
    });
  }

  function addSlot(day, subjectId) {
    setTimetable((tt) => ({ ...tt, [day]: [...(tt[day] || []), subjectId] }));
  }
  function removeSlot(day, idx) {
    setTimetable((tt) => ({ ...tt, [day]: (tt[day] || []).filter((_, i) => i !== idx) }));
  }

  function addHoliday() {
    setHolidays((h) => [...h, { date: todayStr(), name: "New holiday" }]);
  }
  function updateHoliday(idx, patch) {
    setHolidays((h) => h.map((x, i) => (i === idx ? { ...x, ...patch } : x)));
  }
  function removeHoliday(idx) {
    setHolidays((h) => h.filter((_, i) => i !== idx));
  }

  function setSlotStatus(date, idx, status) {
    setAttendance((a) => {
      const dn = dayOfWeek(date);
      const slotCount = (timetable[dn] || []).length;
      const prev = a[date] || Array(slotCount).fill(null);
      // Toggle off if the same status is tapped again; otherwise set it.
      const nextVal = prev[idx] === status ? null : status;
      const arr = prev.map((v, i) => (i === idx ? nextVal : v));
      return { ...a, [date]: arr };
    });
  }

  const dayName = dayOfWeek(markDate);
  const isHoliday = holidaySet.has(markDate);
  const isSunday = dayName === "Sun";
  const slotsToday = timetable[dayName] || [];
  const todayRecord = attendance[markDate] || [];

  if (!loaded) {
    return (
      <div style={{ ...styles.app, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#8b95a1", fontSize: 13 }}>loading…</div>
      </div>
    );
  }

  if (!profileYear) {
    return <Onboarding onChoose={chooseYear} />;
  }

  return (
    <div style={styles.app}>
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; }
        input, select { font-family: inherit; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-thumb { background: #3a4550; border-radius: 3px; }
      `}</style>

      <Header saveState={saveState} yearLabel={YEAR_TEMPLATES[profileYear]?.label} userEmail={userEmail} onSignOut={onSignOut} />

      <nav style={styles.nav}>
        <NavBtn active={tab === "dashboard"} onClick={() => setTab("dashboard")} icon={<Gauge size={16} />} label="Dashboard" />
        <NavBtn active={tab === "mark"} onClick={() => setTab("mark")} icon={<Calendar size={16} />} label="Mark" />
        <NavBtn active={tab === "setup"} onClick={() => setTab("setup")} icon={<Settings2 size={16} />} label="Setup" />
        <NavBtn active={tab === "holidays"} onClick={() => setTab("holidays")} icon={<CalendarOff size={16} />} label="Holidays" />
      </nav>

      <main style={styles.main}>
        {tab === "dashboard" && <Dashboard subjects={subjects} keyDates={keyDates} setKeyDates={setKeyDates} projection={projection} />}
        {tab === "mark" && (
          <MarkAttendance
            markDate={markDate}
            setMarkDate={setMarkDate}
            isHoliday={isHoliday}
            isSunday={isSunday}
            slotsToday={slotsToday}
            todayRecord={todayRecord}
            subjectMap={subjectMap}
            setSlotStatus={setSlotStatus}
            holidays={holidays}
          />
        )}
        {tab === "setup" && (
          <Setup
            subjects={subjects}
            addSubject={addSubject}
            updateSubject={updateSubject}
            removeSubject={removeSubject}
            timetable={timetable}
            addSlot={addSlot}
            removeSlot={removeSlot}
            profileYear={profileYear}
            onChangeYear={chooseYear}
          />
        )}
        {tab === "holidays" && <Holidays holidays={holidays} addHoliday={addHoliday} updateHoliday={updateHoliday} removeHoliday={removeHoliday} />}
      </main>
    </div>
  );
}

function Onboarding({ onChoose }) {
  return (
    <div style={{ ...styles.app, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center" }}>
      <Zap size={30} color="#e0a458" fill="#e0a458" />
      <div style={{ fontSize: 16, fontWeight: 800, color: "#f2ede4", marginTop: 12, letterSpacing: 0.5 }}>EE ATTENDANCE TRACKER</div>
      <div style={{ fontSize: 12.5, color: "#8b95a1", marginTop: 4, marginBottom: 26 }}>KNIT Sultanpur · Dept. of Electrical Engineering</div>
      <div style={{ fontSize: 12, color: "#8b95a1", marginBottom: 14 }}>Which year are you in?</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 300 }}>
        {Object.entries(YEAR_TEMPLATES).map(([key, tpl]) => (
          <button
            key={key}
            onClick={() => onChoose(key)}
            style={{ ...styles.card, textAlign: "left", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
          >
            <span style={{ fontWeight: 700, color: "#f2ede4", fontSize: 14 }}>{tpl.label}</span>
            <span style={{ fontSize: 11, color: "#6b7580" }}>{tpl.subjects.length} subjects</span>
          </button>
        ))}
      </div>
      <div style={{ fontSize: 11, color: "#5c6773", marginTop: 18, maxWidth: 300 }}>
        This loads a starting timetable for your year — you can rename subjects and fix any classes in Setup afterward. Your data stays private to your account.
      </div>
    </div>
  );
}

function Header({ saveState, yearLabel, userEmail, onSignOut }) {
  return (
    <header style={styles.header}>
      <div style={styles.headerLeft}>
        <Zap size={22} color="#e0a458" fill="#e0a458" />
        <div>
          <div style={styles.headerTitle}>ATTENDANCE // EE</div>
          <div style={styles.headerSub}>KNIT Sultanpur · {yearLabel || "Odd Sem 2026-27"}</div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={styles.saveIndicator}>{saveState === "saving" ? "saving…" : saveState === "saved" ? "saved" : ""}</div>
        <button onClick={onSignOut} title={userEmail} style={{ background: "none", border: "1px solid #232b33", borderRadius: 8, color: "#6b7580", fontSize: 10.5, padding: "5px 8px", cursor: "pointer" }}>
          Sign out
        </button>
      </div>
    </header>
  );
}

function NavBtn({ active, onClick, icon, label }) {
  return (
    <button onClick={onClick} style={{ ...styles.navBtn, ...(active ? styles.navBtnActive : {}) }}>
      {icon}
      <span>{label}</span>
    </button>
  );
}

function Dashboard({ subjects, keyDates, setKeyDates, projection }) {
  const checkpoints = [
    { key: "ct1", label: "CT-1", date: keyDates.ct1 },
    { key: "ct2", label: "CT-2", date: keyDates.ct2 },
    { key: "semEnd", label: "Sem End", date: keyDates.semEnd },
  ];

  return (
    <div>
      <div style={styles.sectionLabel}>Live status vs 75% requirement</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {subjects.map((sub) => {
          const overall = projection(sub.id, keyDates.semEnd);
          const pct = overall.heldSoFar > 0 ? (overall.presentSoFar / overall.heldSoFar) * 100 : null;
          return (
            <div key={sub.id} style={styles.card}>
              <div style={styles.cardTop}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#f2ede4" }}>{sub.name}</div>
                  <div style={{ fontSize: 11.5, color: "#8b95a1" }}>{sub.full}</div>
                </div>
                <Gauge2 pct={pct} color={sub.color} />
              </div>

              <div style={styles.cardStatsRow}>
                <Stat label="Held" value={overall.heldSoFar} />
                <Stat label="Present" value={overall.presentSoFar} />
                <Stat label="%" value={pct === null ? "—" : pct.toFixed(1)} />
              </div>

              <div style={styles.checkpointRow}>
                {checkpoints.map((cp) => {
                  const p = projection(sub.id, cp.date);
                  const ok = p.maxCanMiss >= 0;
                  return (
                    <div key={cp.key} style={styles.checkpointBox}>
                      <div style={styles.checkpointLabel}>{cp.label}</div>
                      <div style={{ fontSize: 11, color: "#8b95a1", marginBottom: 2 }}>{fmtShort(cp.date)}</div>
                      {p.totalByCheckpoint === 0 ? (
                        <div style={{ fontSize: 11, color: "#5c6773" }}>no classes yet</div>
                      ) : ok ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#7fc98f", fontSize: 12.5, fontWeight: 600 }}>
                          <CircleCheck size={13} /> can miss {p.maxCanMiss}
                        </div>
                      ) : (
                        <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#e07a5f", fontSize: 12.5, fontWeight: 600 }}>
                          <AlertTriangle size={13} /> attend all +{Math.abs(p.maxCanMiss)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ ...styles.sectionLabel, marginTop: 22 }}>Key dates</div>
      <div style={styles.card}>
        <DateField label="Semester start" value={keyDates.semStart} onChange={(v) => setKeyDates((k) => ({ ...k, semStart: v }))} />
        <DateField label="CT-1" value={keyDates.ct1} onChange={(v) => setKeyDates((k) => ({ ...k, ct1: v }))} />
        <DateField label="CT-2" value={keyDates.ct2} onChange={(v) => setKeyDates((k) => ({ ...k, ct2: v }))} />
        <DateField label="Semester end" value={keyDates.semEnd} onChange={(v) => setKeyDates((k) => ({ ...k, semEnd: v }))} last />
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div style={{ textAlign: "center", flex: 1 }}>
      <div style={{ fontSize: 17, fontWeight: 700, color: "#f2ede4", fontVariantNumeric: "tabular-nums" }}>{value}</div>
      <div style={{ fontSize: 10.5, color: "#8b95a1", letterSpacing: 0.5, textTransform: "uppercase" }}>{label}</div>
    </div>
  );
}

function Gauge2({ pct, color }) {
  const size = 74;
  const r = 30;
  const cx = size / 2;
  const cy = size / 2 + 6;
  const angleFor = (p) => -90 + (p / 100) * 180;
  const val = pct === null ? 0 : Math.max(0, Math.min(100, pct));
  const needleAngle = angleFor(val);
  const rad = (deg) => (deg * Math.PI) / 180;
  const nx = cx + r * 0.78 * Math.sin(rad(needleAngle));
  const ny = cy - r * 0.78 * Math.cos(rad(needleAngle));
  const thresholdAngle = angleFor(75);
  const tx1 = cx + r * 0.55 * Math.sin(rad(thresholdAngle));
  const ty1 = cy - r * 0.55 * Math.cos(rad(thresholdAngle));
  const tx2 = cx + r * 1.02 * Math.sin(rad(thresholdAngle));
  const ty2 = cy - r * 1.02 * Math.cos(rad(thresholdAngle));
  const arcStart = { x: cx - r, y: cy };
  const arcEnd = { x: cx + r, y: cy };
  const below = val < 75;

  return (
    <svg width={size} height={size * 0.68} viewBox={`0 0 ${size} ${size * 0.62}`}>
      <path d={`M ${arcStart.x} ${arcStart.y} A ${r} ${r} 0 0 1 ${arcEnd.x} ${arcEnd.y}`} stroke="#2c3540" strokeWidth="6" fill="none" strokeLinecap="round" />
      <line x1={tx1} y1={ty1} x2={tx2} y2={ty2} stroke="#e07a5f" strokeWidth="2" />
      <line x1={cx} y1={cy} x2={nx} y2={ny} stroke={below ? "#e07a5f" : color} strokeWidth="2.5" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r="3" fill={below ? "#e07a5f" : color} />
      <text x={cx} y={cy - 2} textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#f2ede4">
        {pct === null ? "–" : Math.round(pct) + "%"}
      </text>
    </svg>
  );
}

function DateField({ label, value, onChange, last }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: last ? "none" : "1px solid #263039" }}>
      <span style={{ fontSize: 13, color: "#c5cdd6" }}>{label}</span>
      <input type="date" value={value} onChange={(e) => onChange(e.target.value)} style={styles.dateInput} />
    </div>
  );
}

function MarkAttendance({ markDate, setMarkDate, isHoliday, isSunday, slotsToday, todayRecord, subjectMap, setSlotStatus, holidays }) {
  const holidayName = holidays.find((h) => h.date === markDate)?.name;
  return (
    <div>
      <div style={styles.dateNav}>
        <button style={styles.iconBtn} onClick={() => setMarkDate(addDays(markDate, -1))}>
          <ChevronLeft size={18} />
        </button>
        <div style={{ textAlign: "center", flex: 1 }}>
          <input type="date" value={markDate} onChange={(e) => setMarkDate(e.target.value)} style={styles.dateInputBig} />
          <div style={{ fontSize: 12, color: "#8b95a1", marginTop: 2 }}>{fmtDate(markDate)}</div>
        </div>
        <button style={styles.iconBtn} onClick={() => setMarkDate(addDays(markDate, 1))}>
          <ChevronRight size={18} />
        </button>
      </div>

      {isSunday || isHoliday ? (
        <div style={styles.emptyState}>
          <CalendarOff size={26} color="#5c6773" />
          <div style={{ marginTop: 8, fontSize: 13.5 }}>{isHoliday ? `Holiday — ${holidayName}` : "Sunday — no classes"}</div>
        </div>
      ) : slotsToday.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={{ fontSize: 13.5 }}>No classes scheduled this day. Edit the timetable in Setup if that's wrong.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {slotsToday.map((sid, idx) => {
            const sub = subjectMap[sid];
            const status = todayRecord[idx];
            if (!sub) return null;
            return (
              <div key={idx} style={styles.slotRow}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 99, background: sub.color, display: "inline-block" }} />
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#f2ede4" }}>{sub.name}</span>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <PillBtn active={status === "present"} color="#7fc98f" onClick={() => setSlotStatus(markDate, idx, "present")} icon={<Check size={14} />} label="Present" />
                  <PillBtn active={status === "absent"} color="#e07a5f" onClick={() => setSlotStatus(markDate, idx, "absent")} icon={<X size={14} />} label="Absent" />
                  <PillBtn active={status === "cancelled"} color="#8b95a1" onClick={() => setSlotStatus(markDate, idx, "cancelled")} icon={<Minus size={14} />} label="Off" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PillBtn({ active, color, onClick, icon, label }) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      onClick={() => {
        setPressed(true);
        setTimeout(() => setPressed(false), 150);
        onClick();
      }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        padding: "6px 10px",
        borderRadius: 8,
        border: `1.5px solid ${active ? color : "#2c3540"}`,
        background: active ? color : "transparent",
        color: active ? "#161b21" : "#8b95a1",
        fontSize: 11.5,
        fontWeight: 700,
        cursor: "pointer",
        transform: pressed ? "scale(0.9)" : "scale(1)",
        transition: "transform 100ms ease, background 100ms ease, border-color 100ms ease, color 100ms ease",
      }}
    >
      {icon}
      {label}
    </button>
  );
}

function Setup({ subjects, addSubject, updateSubject, removeSubject, timetable, addSlot, removeSlot, profileYear, onChangeYear }) {
  return (
    <div>
      <div style={{ ...styles.card, marginBottom: 18, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 11, color: "#6b7580", textTransform: "uppercase", letterSpacing: 0.5 }}>Your year</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#f2ede4" }}>{YEAR_TEMPLATES[profileYear]?.label}</div>
        </div>
        <select
          defaultValue=""
          onChange={(e) => {
            if (e.target.value && window.confirm("Switching year reloads the default subjects & timetable for that year, replacing your current setup (your marked attendance stays saved by date). Continue?")) {
              onChangeYear(e.target.value);
            }
            e.target.value = "";
          }}
          style={{ ...styles.select, width: "auto" }}
        >
          <option value="" disabled>
            Change year
          </option>
          {Object.entries(YEAR_TEMPLATES).map(([key, tpl]) => (
            <option key={key} value={key}>
              {tpl.label}
            </option>
          ))}
        </select>
      </div>

      <div style={styles.sectionLabel}>Subjects</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
        {subjects.map((s) => (
          <div key={s.id} style={styles.card}>
            <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
              <input value={s.name} onChange={(e) => updateSubject(s.id, { name: e.target.value })} style={{ ...styles.textInput, width: 90, fontWeight: 700 }} />
              <input value={s.full} onChange={(e) => updateSubject(s.id, { full: e.target.value })} style={{ ...styles.textInput, flex: 1 }} placeholder="Full name" />
              <button style={styles.trashBtn} onClick={() => removeSubject(s.id)}>
                <Trash2 size={15} />
              </button>
            </div>
            <input type="color" value={s.color} onChange={(e) => updateSubject(s.id, { color: e.target.value })} style={{ width: 32, height: 22, border: "none", background: "none" }} />
          </div>
        ))}
        <button style={styles.addBtn} onClick={addSubject}>
          <Plus size={14} /> Add subject
        </button>
      </div>

      <div style={styles.sectionLabel}>Weekly timetable</div>
      <div style={{ fontSize: 12, color: "#8b95a1", marginBottom: 10 }}>
        Best-effort reading from your PDF — please check each day against the real table and fix any mismatches.
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {WEEK_DAYS.map((day) => (
          <div key={day} style={styles.card}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#f2ede4", marginBottom: 8 }}>{DAY_LABELS[day]}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
              {(timetable[day] || []).map((sid, idx) => {
                const sub = subjects.find((s) => s.id === sid);
                return (
                  <span key={idx} style={{ ...styles.chip, borderColor: sub?.color || "#333" }}>
                    {sub?.name || "?"}
                    <button onClick={() => removeSlot(day, idx)} style={styles.chipX}>
                      ×
                    </button>
                  </span>
                );
              })}
              {(timetable[day] || []).length === 0 && <span style={{ fontSize: 12, color: "#5c6773" }}>No classes</span>}
            </div>
            <select
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) addSlot(day, e.target.value);
                e.target.value = "";
              }}
              style={styles.select}
            >
              <option value="" disabled>
                + Add class
              </option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}

function Holidays({ holidays, addHoliday, updateHoliday, removeHoliday }) {
  const sorted = holidays.map((h, i) => ({ ...h, i })).sort((a, b) => (a.date < b.date ? -1 : 1));
  return (
    <div>
      <div style={styles.sectionLabel}>Holidays (Jul – Dec 2026, UP)</div>
      <div style={{ fontSize: 12, color: "#8b95a1", marginBottom: 10 }}>
        Pre-filled from the UP govt calendar — add or remove institute-specific holidays as needed.
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {sorted.map((h) => (
          <div key={h.i} style={{ ...styles.card, display: "flex", alignItems: "center", gap: 8, padding: "8px 12px" }}>
            <input type="date" value={h.date} onChange={(e) => updateHoliday(h.i, { date: e.target.value })} style={styles.dateInput} />
            <input value={h.name} onChange={(e) => updateHoliday(h.i, { name: e.target.value })} style={{ ...styles.textInput, flex: 1 }} />
            <button style={styles.trashBtn} onClick={() => removeHoliday(h.i)}>
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
      <button style={{ ...styles.addBtn, marginTop: 10 }} onClick={addHoliday}>
        <Plus size={14} /> Add holiday
      </button>
    </div>
  );
}

const styles = {
  app: { minHeight: "100vh", background: "#161b21", color: "#c5cdd6", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", paddingBottom: 40 },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 16px 12px", borderBottom: "1px solid #232b33" },
  headerLeft: { display: "flex", alignItems: "center", gap: 10 },
  headerTitle: { fontSize: 14, fontWeight: 800, letterSpacing: 1, color: "#f2ede4", fontFamily: "'JetBrains Mono', monospace" },
  headerSub: { fontSize: 11, color: "#8b95a1", marginTop: 1 },
  saveIndicator: { fontSize: 10.5, color: "#5c6773", fontStyle: "italic" },
  nav: { display: "flex", padding: "10px 12px", gap: 6, borderBottom: "1px solid #232b33" },
  navBtn: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "8px 4px", borderRadius: 10, border: "1px solid transparent", background: "transparent", color: "#6b7580", fontSize: 10.5, fontWeight: 600, cursor: "pointer" },
  navBtnActive: { color: "#e0a458", background: "#20262e", borderColor: "#2c3540" },
  main: { padding: "16px 14px" },
  sectionLabel: { fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: "#6b7580", fontWeight: 700, marginBottom: 10 },
  card: { background: "#1b2129", border: "1px solid #232b33", borderRadius: 14, padding: "14px 14px" },
  cardTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  cardStatsRow: { display: "flex", marginTop: 10, paddingTop: 10, borderTop: "1px solid #232b33" },
  checkpointRow: { display: "flex", gap: 8, marginTop: 10, paddingTop: 10, borderTop: "1px solid #232b33" },
  checkpointBox: { flex: 1, background: "#161b21", borderRadius: 9, padding: "7px 8px" },
  checkpointLabel: { fontSize: 11, fontWeight: 700, color: "#c5cdd6" },
  dateInput: { background: "#161b21", border: "1px solid #2c3540", borderRadius: 7, color: "#c5cdd6", padding: "5px 7px", fontSize: 12.5 },
  dateInputBig: { background: "#161b21", border: "1px solid #2c3540", borderRadius: 8, color: "#f2ede4", padding: "6px 10px", fontSize: 14, fontWeight: 600 },
  dateNav: { display: "flex", alignItems: "center", marginBottom: 16 },
  iconBtn: { background: "#1b2129", border: "1px solid #232b33", borderRadius: 9, color: "#c5cdd6", padding: 8, cursor: "pointer" },
  emptyState: { textAlign: "center", padding: "40px 20px", color: "#8b95a1" },
  slotRow: { display: "flex", justifyContent: "space-between", alignItems: "center", background: "#1b2129", border: "1px solid #232b33", borderRadius: 12, padding: "10px 12px" },
  textInput: { background: "#161b21", border: "1px solid #2c3540", borderRadius: 7, color: "#c5cdd6", padding: "6px 9px", fontSize: 13 },
  trashBtn: { background: "none", border: "none", color: "#5c6773", cursor: "pointer", padding: 4 },
  addBtn: { display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%", padding: "10px", borderRadius: 10, border: "1px dashed #2c3540", background: "transparent", color: "#8b95a1", fontSize: 12.5, fontWeight: 600, cursor: "pointer" },
  chip: { display: "flex", alignItems: "center", gap: 4, border: "1px solid #333", borderRadius: 7, padding: "3px 6px 3px 9px", fontSize: 11.5, color: "#c5cdd6" },
  chipX: { background: "none", border: "none", color: "#8b95a1", cursor: "pointer", fontSize: 13, padding: "0 2px" },
  select: { width: "100%", background: "#161b21", border: "1px solid #2c3540", borderRadius: 8, color: "#c5cdd6", padding: "7px 9px", fontSize: 12.5 },
};
