import { useState, useMemo, useEffect } from "react";
import Navigation from "@/components/Navigation";
import { motion } from "framer-motion";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, PieChart, Pie, Cell, Area, AreaChart } from "recharts";
import { Search, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { loadActivityLog, calculateStudentSummaries, getBehaviorBreakdown, getEngagementOverTime, type StudentSummary, type ActivityRecord } from "@/utils/csvParser";

interface StudentActivity {
  studentId: string;
  name: string;
  totalMinutes: number;
  attentiveMinutes: number;
  inattentiveMinutes: number;
  attentivePercentage: number;
  timeline: Array<{
    time: string;
    behavior: "Attentive" | "Sleeping" | "Talking" | "Phone";
    duration: number;
  }>;
}

// Map CSV data to StudentActivity format
const mapToStudentActivity = (summary: StudentSummary): StudentActivity => {
  return {
    studentId: `S${1000 + summary.studentId}`,
    name: `Student ${summary.studentId}`,
    totalMinutes: summary.totalMinutes || 60,
    attentiveMinutes: summary.attentiveMinutes,
    inattentiveMinutes: summary.inattentiveMinutes,
    attentivePercentage: summary.engagementPct,
    timeline: summary.timeline.slice(0, 50).map(t => { // Limit to 50 points for performance
      const time = new Date(t.time);
      return {
        time: `${time.getHours()}:${String(time.getMinutes()).padStart(2, '0')}`,
        behavior: t.behavior === 'Studying/Attentive' ? 'Attentive' as const : 
                  t.behavior === 'Talking in Class' ? 'Talking' as const : 
                  t.behavior === 'Sleeping' ? 'Sleeping' as const : 'Phone' as const,
        duration: 1
      };
    })
  };
};

const COLORS = {
  Attentive: "hsl(var(--chart-1))",
  Sleeping: "hsl(var(--chart-2))",
  Talking: "hsl(var(--chart-3))",
  Phone: "hsl(var(--chart-4))",
};

export default function Analysis() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<StudentActivity | null>(null);
  const [students, setStudents] = useState<StudentActivity[]>([]);
  const [records, setRecords] = useState<ActivityRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivityLog().then(loadedRecords => {
      setRecords(loadedRecords);
      const summaries = calculateStudentSummaries(loadedRecords);
      const activities = summaries.map(mapToStudentActivity);
      setStudents(activities);
      setLoading(false);
    });
  }, []);

  const filteredStudents = useMemo(() => {
    return students.filter(
      (s) =>
        s.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [students, searchQuery]);

  const chartData = useMemo(() => {
    return filteredStudents.slice(0, 10).map((s) => ({
      name: s.studentId,
      Attentive: s.attentiveMinutes,
      Inattentive: s.inattentiveMinutes,
    }));
  }, [filteredStudents]);

  const pieData = useMemo(() => {
    return getBehaviorBreakdown(records);
  }, [records]);

  const engagementOverTimeData = useMemo(() => {
    if (records.length === 0) return [];
    
    // Group by 5-minute intervals
    const timeMap = new Map<string, { 
      Attentive: number, 
      Sleeping: number, 
      Talking: number, 
      Phone: number,
      total: number 
    }>();
    
    records.forEach(record => {
      const date = new Date(record.timestamp);
      const intervalKey = `${date.getHours()}:${String(Math.floor(date.getMinutes() / 5) * 5).padStart(2, '0')}`;
      
      if (!timeMap.has(intervalKey)) {
        timeMap.set(intervalKey, { Attentive: 0, Sleeping: 0, Talking: 0, Phone: 0, total: 0 });
      }
      
      const interval = timeMap.get(intervalKey)!;
      interval.total++;
      
      if (record.activity === 'Studying/Attentive') {
        interval.Attentive++;
      } else if (record.activity === 'Sleeping') {
        interval.Sleeping++;
      } else if (record.activity === 'Talking in Class') {
        interval.Talking++;
      } else if (record.activity.includes('Phone')) {
        interval.Phone++;
      }
    });
    
    return Array.from(timeMap.entries())
      .map(([time, data]) => ({
        time,
        Attentive: Math.round((data.Attentive / data.total) * 100),
        Sleeping: Math.round((data.Sleeping / data.total) * 100),
        Talking: Math.round((data.Talking / data.total) * 100),
        Phone: Math.round((data.Phone / data.total) * 100),
      }))
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [records]);

  const PIE_COLORS = [COLORS.Attentive, COLORS.Sleeping, COLORS.Talking, COLORS.Phone];

  const getTrendIcon = (percentage: number) => {
    if (percentage >= 80) return <TrendingUp className="w-4 h-4 text-success" />;
    if (percentage >= 60) return <Minus className="w-4 h-4 text-warning" />;
    return <TrendingDown className="w-4 h-4 text-destructive" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading real activity data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="max-w-7xl mx-auto p-4 md:p-6">
        <header className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Behavioral Analysis</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Individual student engagement tracking and timeline
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-xl bg-card border border-border">
                <h3 className="text-sm font-medium text-muted-foreground mb-4">
                  Behavior Distribution
                </h3>
                <div style={{ width: "100%", height: 300 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="p-6 rounded-xl bg-card border border-border">
                <h3 className="text-sm font-medium text-muted-foreground mb-4">
                  Top 10 Students by Engagement
                </h3>
                <div style={{ width: "100%", height: 300 }}>
                  <ResponsiveContainer>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="name" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="Attentive" stackId="a" fill={COLORS.Attentive} />
                      <Bar dataKey="Inattentive" stackId="a" fill={COLORS.Sleeping} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-xl bg-card border border-border">
              <h3 className="text-sm font-medium text-muted-foreground mb-4">
                Engagement Over Time
              </h3>
              <div style={{ width: "100%", height: 300 }}>
                <ResponsiveContainer>
                  <AreaChart data={engagementOverTimeData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="time" className="text-xs" />
                    <YAxis className="text-xs" label={{ value: '%', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="Attentive" stackId="1" stroke={COLORS.Attentive} fill={COLORS.Attentive} />
                    <Area type="monotone" dataKey="Sleeping" stackId="1" stroke={COLORS.Sleeping} fill={COLORS.Sleeping} />
                    <Area type="monotone" dataKey="Talking" stackId="1" stroke={COLORS.Talking} fill={COLORS.Talking} />
                    <Area type="monotone" dataKey="Phone" stackId="1" stroke={COLORS.Phone} fill={COLORS.Phone} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {selectedStudent && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 rounded-xl bg-card border border-border"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold">{selectedStudent.studentId}</h3>
                    <p className="text-sm text-muted-foreground">{selectedStudent.name}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">
                      {selectedStudent.attentivePercentage}%
                    </div>
                    <div className="text-xs text-muted-foreground">Engagement Rate</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-4 rounded-lg bg-background border border-border">
                    <div className="text-xs text-muted-foreground mb-1">Attentive Time</div>
                    <div className="text-xl font-bold text-success">
                      {selectedStudent.attentiveMinutes} min
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-background border border-border">
                    <div className="text-xs text-muted-foreground mb-1">Inattentive Time</div>
                    <div className="text-xl font-bold text-destructive">
                      {selectedStudent.inattentiveMinutes} min
                    </div>
                  </div>
                </div>

                <h4 className="text-sm font-medium text-muted-foreground mb-3">
                  Behavior Timeline
                </h4>
                <div className="space-y-2 max-h-64 overflow-auto">
                  {selectedStudent.timeline.map((event, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border"
                      style={{
                        borderLeft: `4px solid ${COLORS[event.behavior]}`,
                      }}
                    >
                      <div className="flex-1">
                        <div className="font-medium text-sm" style={{ color: COLORS[event.behavior] }}>
                          {event.behavior}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Duration: {event.duration} minutes
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">{event.time}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="p-6 rounded-xl bg-card border border-border sticky top-6">
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search students..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                All Students ({filteredStudents.length})
              </h3>

              <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-auto">
                {filteredStudents.map((student) => (
                  <motion.button
                    key={student.studentId}
                    onClick={() => setSelectedStudent(student)}
                    whileHover={{ scale: 1.02 }}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedStudent?.studentId === student.studentId
                        ? "border-primary bg-primary/10"
                        : "border-border bg-background/50 hover:bg-accent"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium text-sm">{student.studentId}</div>
                      {getTrendIcon(student.attentivePercentage)}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">
                        {student.attentiveMinutes}/{student.totalMinutes} min
                      </div>
                      <div className="text-sm font-bold text-primary">
                        {student.attentivePercentage}%
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
