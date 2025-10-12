import { useState, useMemo } from "react";
import Navigation from "@/components/Navigation";
import { motion } from "framer-motion";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line } from "recharts";
import { Search, TrendingUp, TrendingDown, Minus } from "lucide-react";

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

function generateMockStudentData(): StudentActivity[] {
  const students: StudentActivity[] = [];
  const totalSessionMinutes = 60;

  for (let i = 0; i < 25; i++) {
    const attentiveMin = Math.round(30 + Math.random() * 25);
    const timeline = [];
    let currentTime = 0;

    while (currentTime < totalSessionMinutes) {
      const behaviors: Array<"Attentive" | "Sleeping" | "Talking" | "Phone"> = [
        "Attentive",
        "Sleeping",
        "Talking",
        "Phone",
      ];
      const behavior = behaviors[Math.floor(Math.random() * behaviors.length)];
      const duration = Math.round(5 + Math.random() * 10);

      timeline.push({
        time: `${Math.floor(currentTime / 60)}:${String(currentTime % 60).padStart(2, "0")}`,
        behavior,
        duration: Math.min(duration, totalSessionMinutes - currentTime),
      });

      currentTime += duration;
    }

    students.push({
      studentId: `S${1000 + i}`,
      name: `Student ${i + 1}`,
      totalMinutes: totalSessionMinutes,
      attentiveMinutes: attentiveMin,
      inattentiveMinutes: totalSessionMinutes - attentiveMin,
      attentivePercentage: Math.round((attentiveMin / totalSessionMinutes) * 100),
      timeline,
    });
  }

  return students.sort((a, b) => b.attentivePercentage - a.attentivePercentage);
}

const COLORS = {
  Attentive: "hsl(var(--chart-1))",
  Sleeping: "hsl(var(--chart-2))",
  Talking: "hsl(var(--chart-3))",
  Phone: "hsl(var(--chart-4))",
};

export default function Analysis() {
  const [students] = useState<StudentActivity[]>(generateMockStudentData);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<StudentActivity | null>(null);

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

  const getTrendIcon = (percentage: number) => {
    if (percentage >= 80) return <TrendingUp className="w-4 h-4 text-success" />;
    if (percentage >= 60) return <Minus className="w-4 h-4 text-warning" />;
    return <TrendingDown className="w-4 h-4 text-destructive" />;
  };

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
