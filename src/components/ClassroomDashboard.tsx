import React, { useEffect, useMemo, useState } from "react";
import { ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Tooltip, CartesianGrid, XAxis, YAxis, Legend, BarChart, Bar } from "recharts";
import { motion } from "framer-motion";
import { loadActivityLog, getBehaviorBreakdown, getEngagementOverTime } from "@/utils/csvParser";
import Navigation from "@/components/Navigation";

const BEHAVIORS = ["Attentive", "Sleeping", "Talking", "Phone"];

const COLORS = {
  Attentive: "hsl(var(--chart-1))",
  Sleeping: "hsl(var(--chart-2))",
  Talking: "hsl(var(--chart-3))",
  Phone: "hsl(var(--chart-4))",
};

export default function ClassroomDashboard() {
  const [dark, setDark] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessionPoints, setSessionPoints] = useState<any[]>([]);
  const [attendanceLog, setAttendanceLog] = useState<any[]>([]);
  const [snapshot, setSnapshot] = useState({
    totalDetected: 0,
    engagementPct: 0,
    breakdown: { Attentive: 0, Sleeping: 0, Talking: 0, Phone: 0 },
  });

  // Load real data from CSV
  useEffect(() => {
    loadActivityLog().then(records => {
      const breakdown = getBehaviorBreakdown(records);
      const engagement = getEngagementOverTime(records, 1);
      
      const uniqueStudents = new Set(records.map(r => r.studentId)).size;
      const attentiveCount = records.filter(r => r.activity === 'Studying/Attentive').length;
      const engagementPct = Math.round((attentiveCount / records.length) * 100);
      
      const breakdownObj = {
        Attentive: breakdown.find(b => b.name === 'Studying/Attentive')?.value || 0,
        Sleeping: breakdown.find(b => b.name === 'Sleeping')?.value || 0,
        Talking: breakdown.find(b => b.name === 'Talking in Class')?.value || 0,
        Phone: breakdown.find(b => b.name === 'Phone')?.value || 0,
      };
      
      setSnapshot({
        totalDetected: uniqueStudents,
        engagementPct,
        breakdown: breakdownObj
      });
      
      setSessionPoints(engagement);
      
      // Create attendance log from records
      const logEntries = Array.from(new Set(records.map(r => r.studentId)))
        .slice(0, 25)
        .map(id => {
          const studentRecords = records.filter(r => r.studentId === id);
          const latestRecord = studentRecords[studentRecords.length - 1];
          return {
            studentId: `S${1000 + id}`,
            detectedTime: new Date(latestRecord.timestamp).toLocaleTimeString(),
            status: latestRecord.activity === 'Studying/Attentive' ? 'Attentive' : 
                    latestRecord.activity === 'Talking in Class' ? 'Talking' :
                    latestRecord.activity === 'Sleeping' ? 'Sleeping' : 'Phone'
          };
        });
      
      setAttendanceLog(logEntries);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [dark]);

  const behaviorTotals = useMemo(() => {
    return [
      { name: 'Attentive', value: snapshot.breakdown.Attentive },
      { name: 'Sleeping', value: snapshot.breakdown.Sleeping },
      { name: 'Talking', value: snapshot.breakdown.Talking },
      { name: 'Phone', value: snapshot.breakdown.Phone }
    ];
  }, [snapshot]);

  const attentiveSeries = useMemo(() => sessionPoints, [sessionPoints]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading classroom data from CSV...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      <Navigation />
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
