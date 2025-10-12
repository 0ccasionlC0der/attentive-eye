import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import CameraFeed from "@/components/CameraFeed";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Clock, Users } from "lucide-react";

interface Student {
  id: string;
  name: string;
  status: "present" | "absent" | "late";
  detectedAt?: string;
}

export default function Attendance() {
  const [totalStudents] = useState(25);
  const [detectedCount, setDetectedCount] = useState(0);
  const [students, setStudents] = useState<Student[]>([]);

  useEffect(() => {
    // Initialize student list
    const initialStudents: Student[] = [];
    for (let i = 0; i < totalStudents; i++) {
      initialStudents.push({
        id: `S${1000 + i}`,
        name: `Student ${i + 1}`,
        status: "absent",
      });
    }
    setStudents(initialStudents);
  }, [totalStudents]);

  const handleFacesDetected = () => {
    // Simulate marking students as present when faces are detected
    setStudents((prev) => {
      const updated = [...prev];
      const absent = updated.filter((s) => s.status === "absent");
      if (absent.length > 0 && Math.random() > 0.7) {
        const randomStudent = absent[Math.floor(Math.random() * absent.length)];
        randomStudent.status = "present";
        randomStudent.detectedAt = new Date().toLocaleTimeString();
      }
      return updated;
    });
  };

  const presentCount = students.filter((s) => s.status === "present").length;
  const absentCount = students.filter((s) => s.status === "absent").length;
  const lateCount = students.filter((s) => s.status === "late").length;
  const attendanceRate = Math.round((presentCount / totalStudents) * 100);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="max-w-7xl mx-auto p-4 md:p-6">
        <header className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Attendance Tracking</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time face detection and attendance marking
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <CameraFeed
              onStudentCountChange={setDetectedCount}
              onFacesDetected={handleFacesDetected}
            />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-card border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Total</span>
                </div>
                <div className="text-2xl font-bold">{totalStudents}</div>
              </div>
              <div className="p-4 rounded-xl bg-card border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span className="text-xs text-muted-foreground">Present</span>
                </div>
                <div className="text-2xl font-bold text-success">{presentCount}</div>
              </div>
              <div className="p-4 rounded-xl bg-card border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="w-4 h-4 text-destructive" />
                  <span className="text-xs text-muted-foreground">Absent</span>
                </div>
                <div className="text-2xl font-bold text-destructive">{absentCount}</div>
              </div>
              <div className="p-4 rounded-xl bg-card border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-warning" />
                  <span className="text-xs text-muted-foreground">Attendance</span>
                </div>
                <div className="text-2xl font-bold text-primary">{attendanceRate}%</div>
              </div>
            </div>

            <div className="p-6 rounded-xl bg-card border border-border">
              <h3 className="text-sm font-medium text-muted-foreground mb-4">
                Currently Detected: {detectedCount} faces
              </h3>
              <div className="text-sm text-muted-foreground">
                <p>
                  The system continuously monitors the camera feed and automatically marks
                  students as present when their faces are detected.
                </p>
                <p className="mt-2">
                  <strong>Note:</strong> This is a demo using simulated face detection. In
                  production, this would use ML models for accurate face recognition.
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="p-6 rounded-xl bg-card border border-border sticky top-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-4">
                Student Roster
              </h3>
              <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-auto">
                {students.map((student) => (
                  <motion.div
                    key={student.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-between p-3 rounded-lg border border-border bg-background/50"
                  >
                    <div>
                      <div className="font-medium text-sm">{student.id}</div>
                      <div className="text-xs text-muted-foreground">{student.name}</div>
                      {student.detectedAt && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {student.detectedAt}
                        </div>
                      )}
                    </div>
                    <div>
                      {student.status === "present" && (
                        <span className="px-2 py-1 rounded-md text-xs font-medium bg-success/20 text-success">
                          Present
                        </span>
                      )}
                      {student.status === "absent" && (
                        <span className="px-2 py-1 rounded-md text-xs font-medium bg-muted text-muted-foreground">
                          Absent
                        </span>
                      )}
                      {student.status === "late" && (
                        <span className="px-2 py-1 rounded-md text-xs font-medium bg-warning/20 text-warning">
                          Late
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
