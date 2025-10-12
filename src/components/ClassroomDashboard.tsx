import React, { useEffect, useMemo, useState } from "react";
import { ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Tooltip, CartesianGrid, XAxis, YAxis, Legend, BarChart, Bar } from "recharts";
import { motion } from "framer-motion";

const BEHAVIORS = ["Attentive", "Sleeping", "Talking", "Phone"];

function generateMockSessionData(durationMinutes = 60, intervalSec = 30) {
  const points = [];
  const totalStudents = 25;
  const steps = Math.ceil((durationMinutes * 60) / intervalSec);
  let baseAttentive = Math.round(totalStudents * 0.75);

  for (let i = 0; i < steps; i++) {
    const t = i * (intervalSec / 60);
    const drift = Math.round(3 * Math.sin(i / 8) + (Math.random() - 0.5) * 2);
    const attentive = Math.max(0, Math.min(totalStudents, baseAttentive + drift + Math.round((Math.random() - 0.5) * 3)));
    const sleeping = Math.max(0, Math.round((totalStudents - attentive) * Math.random() * 0.5));
    const phone = Math.max(0, Math.round((totalStudents - attentive - sleeping) * Math.random() * 0.7));
    const talking = Math.max(0, totalStudents - attentive - sleeping - phone);
    points.push({
      time: `${Math.floor(t)}:${String((i * intervalSec) % 60).padStart(2, "0")}`,
      Attentive: attentive,
      Sleeping: sleeping,
      Phone: phone,
      Talking: talking,
      total: totalStudents,
      attentivePct: Math.round((attentive / totalStudents) * 100),
    });
  }
  return { points, totalStudents };
}

function generateMockAttendanceLog(totalStudents = 25) {
  const log = [];
  for (let i = 0; i < totalStudents; i++) {
    const id = `S${String(1000 + i)}`;
    const detectedTime = new Date(Date.now() - Math.round(Math.random() * 1000 * 60 * 60)).toLocaleTimeString();
    const status = BEHAVIORS[Math.floor(Math.random() * BEHAVIORS.length)];
    log.push({ studentId: id, detectedTime, status });
  }
  return log;
}

const COLORS = {
  Attentive: "hsl(var(--chart-1))",
  Sleeping: "hsl(var(--chart-2))",
  Talking: "hsl(var(--chart-3))",
  Phone: "hsl(var(--chart-4))",
};

export default function ClassroomDashboard() {
  const [dark, setDark] = useState(false);
  const [session] = useState(() => generateMockSessionData(60, 30));
  const [sessionPoints, setSessionPoints] = useState(session.points);
  const [attendanceLog, setAttendanceLog] = useState(() => generateMockAttendanceLog(session.totalStudents));
  const [snapshot, setSnapshot] = useState(() => {
    const last = session.points[session.points.length - 1];
    return {
      totalDetected: last.total,
      engagementPct: last.attentivePct,
      breakdown: { Attentive: last.Attentive, Sleeping: last.Sleeping, Talking: last.Talking, Phone: last.Phone },
    };
  });

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [dark]);

  useEffect(() => {
    const interval = setInterval(() => {
      setSessionPoints((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        const total = last.total;
        const jitter = () => Math.round((Math.random() - 0.5) * 2);
        const attentive = Math.max(0, Math.min(total, last.Attentive + jitter()));
        const sleeping = Math.max(0, Math.round((total - attentive) * Math.random() * 0.4));
        const phone = Math.max(0, Math.round((total - attentive - sleeping) * Math.random() * 0.6));
        const talking = Math.max(0, total - attentive - sleeping - phone);
        const newPoint = {
          time: new Date().toLocaleTimeString(),
          Attentive: attentive,
          Sleeping: sleeping,
          Phone: phone,
          Talking: talking,
          total,
          attentivePct: Math.round((attentive / total) * 100),
        };
        next.push(newPoint);
        if (next.length > 120) next.shift();
        setSnapshot({ totalDetected: total, engagementPct: newPoint.attentivePct, breakdown: { Attentive: attentive, Sleeping: sleeping, Talking: talking, Phone: phone } });
        setAttendanceLog((log) => log.map((r) => (Math.random() > 0.995 ? { ...r, status: BEHAVIORS[Math.floor(Math.random() * BEHAVIORS.length)] } : r)));
        return next;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const behaviorTotals = useMemo(() => {
    const last = sessionPoints[sessionPoints.length - 1];
    return BEHAVIORS.map((b) => ({ name: b, value: last[b] }));
  }, [sessionPoints]);

  const attentiveSeries = useMemo(() => sessionPoints.map((p) => ({ name: p.time, AttentivePct: p.attentivePct })), [sessionPoints]);

  const studentRisk = useMemo(() => {
    return attendanceLog
      .map((s) => {
        const riskScore = Math.random();
        return { ...s, riskScore: riskScore, timeInattentiveMin: Math.round(riskScore * 40) };
      })
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 8);
  }, [attendanceLog]);

  const handleExport = () => {
    const payload = { snapshot, lastPoints: sessionPoints.slice(-10), attendanceLog: attendanceLog.slice(0, 20) };
    navigator.clipboard?.writeText(JSON.stringify(payload, null, 2));
    alert("Snapshot copied to clipboard (JSON)");
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors"> 
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Class Analytics</h1>
            <p className="text-sm text-muted-foreground mt-1">Real-time classroom engagement & attendance tracking</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDark((d) => !d)}
              className="px-4 py-2 rounded-lg border border-border hover:bg-accent transition-colors text-sm font-medium"
            >
              {dark ? "☀️ Light" : "🌙 Dark"}
            </button>
            <button
              onClick={handleExport}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity text-sm font-medium"
            >
              Export Data
            </button>
          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <section className="lg:col-span-8 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <div className="col-span-1 p-6 rounded-xl shadow-sm bg-card border border-border">
                <h3 className="text-sm font-medium text-muted-foreground">Total Students Detected</h3>
                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <div className="text-4xl font-bold">{snapshot.totalDetected}</div>
                    <div className="text-sm text-muted-foreground mt-1">Unique faces tracked</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground">Engagement</div>
                    <div className="text-3xl font-bold text-primary">{snapshot.engagementPct}%</div>
                    <div className="text-xs text-muted-foreground">Attentive</div>
                  </div>
                </div>
              </div>

              <div className="col-span-1 p-6 rounded-xl shadow-sm bg-card border border-border">
                <h3 className="text-sm font-medium text-muted-foreground mb-4">Behavioral Breakdown</h3>
                <div className="grid grid-cols-2 gap-3">
                  {BEHAVIORS.map((b) => (
                    <div key={b} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background/50">
                      <div className="w-12 h-12 flex items-center justify-center rounded-full font-bold text-lg" style={{ background: `${COLORS[b]}20`, color: COLORS[b] }}>
                        {b[0]}
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">{b}</div>
                        <div className="text-xl font-bold">{snapshot.breakdown[b]}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            <div className="p-6 rounded-xl shadow-sm bg-card border border-border">
              <h3 className="text-sm font-medium text-muted-foreground mb-4">Behavior Distribution</h3>
              <div style={{ width: "100%", height: 280 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={behaviorTotals}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={90}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                    >
                      {behaviorTotals.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[entry.name]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="p-6 rounded-xl shadow-sm bg-card border border-border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-muted-foreground">Engagement Over Time</h3>
                <div className="text-xs text-muted-foreground">% Attentive</div>
              </div>
              <div style={{ width: "100%", height: 280 }}>
                <ResponsiveContainer>
                  <LineChart data={attentiveSeries}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="name" interval={Math.max(0, Math.floor(attentiveSeries.length / 8))} className="text-xs" />
                    <YAxis domain={[0, 100]} className="text-xs" />
                    <Tooltip />
                    <Line type="monotone" dataKey="AttentivePct" stroke={COLORS.Attentive} strokeWidth={3} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="p-6 rounded-xl shadow-sm bg-card border border-border">
              <h3 className="text-sm font-medium text-muted-foreground mb-4">Behavior Counts Timeline</h3>
              <div style={{ width: "100%", height: 320 }}>
                <ResponsiveContainer>
                  <BarChart data={sessionPoints.slice(-12)}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="time" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Attentive" stackId="a" fill={COLORS.Attentive} />
                    <Bar dataKey="Talking" stackId="a" fill={COLORS.Talking} />
                    <Bar dataKey="Phone" stackId="a" fill={COLORS.Phone} />
                    <Bar dataKey="Sleeping" stackId="a" fill={COLORS.Sleeping} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          <aside className="lg:col-span-4 space-y-6">
            <div className="p-6 rounded-xl shadow-sm bg-card border border-border">
              <h3 className="text-sm font-medium text-muted-foreground mb-4">Attendance Log</h3>
              <div className="max-h-72 overflow-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-card">
                    <tr className="text-left text-xs text-muted-foreground border-b border-border">
                      <th className="pb-3 font-medium">Student ID</th>
                      <th className="pb-3 font-medium">Time</th>
                      <th className="pb-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceLog.slice(0, 50).map((r) => (
                      <tr key={r.studentId} className="border-b border-border/50">
                        <td className="py-3 font-medium">{r.studentId}</td>
                        <td className="py-3 text-muted-foreground text-xs">{r.detectedTime}</td>
                        <td className="py-3">
                          <span className="px-2 py-1 rounded-md text-xs font-medium" style={{ background: `${COLORS[r.status]}20`, color: COLORS[r.status] }}>
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-6 rounded-xl shadow-sm bg-card border border-border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-muted-foreground">Intervention List</h3>
                <div className="text-xs text-muted-foreground">At-risk students</div>
              </div>
              <div className="space-y-3 max-h-96 overflow-auto">
                {studentRisk.map((s) => (
                  <motion.div 
                    key={s.studentId} 
                    whileHover={{ scale: 1.02 }} 
                    className="p-4 rounded-lg border border-border bg-background/50 flex items-center justify-between"
                    style={{
                      borderLeft: `4px solid ${s.riskScore > 0.7 ? COLORS.Sleeping : s.riskScore > 0.45 ? COLORS.Talking : COLORS.Attentive}`
                    }}
                  >
                    <div>
                      <div className="font-semibold">{s.studentId}</div>
                      <div className="text-xs text-muted-foreground">Inattentive: {s.timeInattentiveMin} min</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium" style={{ color: COLORS[s.status] }}>{s.status}</div>
                      <div className="text-xs text-muted-foreground">Risk {Math.round(s.riskScore * 100)}%</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="p-6 rounded-xl shadow-sm bg-card border border-border">
              <h3 className="text-sm font-medium text-muted-foreground mb-4">Session Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg engagement (last 10)</span>
                  <span className="font-semibold">{Math.round(sessionPoints.slice(-10).reduce((a, b) => a + b.attentivePct, 0) / Math.max(1, sessionPoints.slice(-10).length))}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Peak attention</span>
                  <span className="font-semibold">{Math.max(...sessionPoints.map((p) => p.attentivePct))}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Session duration</span>
                  <span className="font-semibold">{Math.round(sessionPoints.length * 0.5)} min</span>
                </div>
              </div>
            </div>
          </aside>
        </main>

        <footer className="mt-8 p-4 rounded-lg bg-muted/30 text-xs text-muted-foreground">
          <div className="font-medium mb-2">Integration Notes:</div>
          <ul className="list-disc ml-5 space-y-1">
            <li>Replace mock data generators with live API endpoints</li>
            <li>Attendance stream: <code className="bg-background px-1 rounded">{`{ studentId, timestamp, bbox, faceEmbeddingHash }`}</code></li>
            <li>Behavior stream: <code className="bg-background px-1 rounded">{`{ studentId, timestamp, behaviorLabel }`}</code></li>
          </ul>
        </footer>
      </div>
    </div>
  );
}
