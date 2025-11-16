export interface ActivityRecord {
  timestamp: string;
  studentId: number;
  activity: string;
  confidence: number;
}

export interface StudentSummary {
  studentId: number;
  totalMinutes: number;
  attentiveMinutes: number;
  inattentiveMinutes: number;
  sleepingMinutes: number;
  talkingMinutes: number;
  phoneMinutes: number;
  engagementPct: number;
  timeline: Array<{
    time: string;
    behavior: string;
    confidence: number;
  }>;
}

export async function loadActivityLog(): Promise<ActivityRecord[]> {
  try {
    const response = await fetch('/classroom4_ACTIVITY_LOG.csv');
    const text = await response.text();
    const lines = text.trim().split('\n');
    
    // Skip header
    const records: ActivityRecord[] = [];
    for (let i = 1; i < lines.length; i++) {
      const [timestamp, studentId, activity, confidence] = lines[i].split(',');
      records.push({
        timestamp: timestamp.trim(),
        studentId: parseInt(studentId),
        activity: activity.trim(),
        confidence: parseFloat(confidence)
      });
    }
    
    return records;
  } catch (error) {
    console.error('Error loading activity log:', error);
    return [];
  }
}

export function calculateStudentSummaries(records: ActivityRecord[]): StudentSummary[] {
  const studentMap = new Map<number, StudentSummary>();
  
  records.forEach(record => {
    if (!studentMap.has(record.studentId)) {
      studentMap.set(record.studentId, {
        studentId: record.studentId,
        totalMinutes: 0,
        attentiveMinutes: 0,
        inattentiveMinutes: 0,
        sleepingMinutes: 0,
        talkingMinutes: 0,
        phoneMinutes: 0,
        engagementPct: 0,
        timeline: []
      });
    }
    
    const student = studentMap.get(record.studentId)!;
    
    // Add to timeline
    student.timeline.push({
      time: record.timestamp,
      behavior: record.activity,
      confidence: record.confidence
    });
    
    // Count behaviors (assuming each record represents ~1 second or frame)
    student.totalMinutes += 1;
    
    if (record.activity === 'Studying/Attentive') {
      student.attentiveMinutes += 1;
    } else {
      student.inattentiveMinutes += 1;
      
      if (record.activity === 'Sleeping') {
        student.sleepingMinutes += 1;
      } else if (record.activity === 'Talking in Class') {
        student.talkingMinutes += 1;
      } else if (record.activity.includes('Phone')) {
        student.phoneMinutes += 1;
      }
    }
  });
  
  // Convert counts to minutes and calculate percentages
  const summaries = Array.from(studentMap.values()).map(student => {
    const totalFrames = student.totalMinutes;
    const attentiveFrames = student.attentiveMinutes;
    
    return {
      ...student,
      totalMinutes: Math.round(totalFrames / 30), // Assuming ~30 frames per minute
      attentiveMinutes: Math.round(attentiveFrames / 30),
      inattentiveMinutes: Math.round(student.inattentiveMinutes / 30),
      sleepingMinutes: Math.round(student.sleepingMinutes / 30),
      talkingMinutes: Math.round(student.talkingMinutes / 30),
      phoneMinutes: Math.round(student.phoneMinutes / 30),
      engagementPct: Math.round((attentiveFrames / totalFrames) * 100)
    };
  });
  
  return summaries.sort((a, b) => b.engagementPct - a.engagementPct);
}

export function getBehaviorBreakdown(records: ActivityRecord[]) {
  const counts = {
    'Studying/Attentive': 0,
    'Talking in Class': 0,
    'Sleeping': 0,
    'Phone': 0
  };
  
  records.forEach(record => {
    if (record.activity in counts) {
      counts[record.activity as keyof typeof counts]++;
    } else if (record.activity.includes('Phone')) {
      counts['Phone']++;
    }
  });
  
  return Object.entries(counts).map(([name, value]) => ({ name, value }));
}

export function getEngagementOverTime(records: ActivityRecord[], intervalSeconds = 10) {
  const timeMap = new Map<string, { total: number; attentive: number }>();
  
  records.forEach(record => {
    const date = new Date(record.timestamp);
    const intervalKey = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(Math.floor(date.getSeconds() / intervalSeconds) * intervalSeconds).padStart(2, '0')}`;
    
    if (!timeMap.has(intervalKey)) {
      timeMap.set(intervalKey, { total: 0, attentive: 0 });
    }
    
    const interval = timeMap.get(intervalKey)!;
    interval.total++;
    if (record.activity === 'Studying/Attentive') {
      interval.attentive++;
    }
  });
  
  return Array.from(timeMap.entries())
    .map(([time, data]) => ({
      time,
      AttentivePct: Math.round((data.attentive / data.total) * 100)
    }))
    .sort((a, b) => a.time.localeCompare(b.time));
}
