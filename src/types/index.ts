export type UserRole = 'admin' | 'student';

export interface UserProfile {
  id: string; // Document ID matching Firebase Auth UID
  name: string; // Firestore field: name
  email: string; // Firestore field: email
  role: UserRole; // Firestore field: role ("admin" | "student")
  active: boolean; // Firestore field: active (boolean)
  // Convenient aliases for UI components
  fullName: string; // equals name
  isActive: boolean; // equals active
  phone?: string;
  rollNumber?: string;
  batch?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type AttendanceStatus = 'Present' | 'Late' | 'Absent' | 'Leave';

export interface AttendanceRecord {
  id: string;
  date: string; // YYYY-MM-DD
  studentId: string;
  studentName: string;
  status: AttendanceStatus;
  inTime?: string;
  outTime?: string;
  notes?: string;
  markedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export type AssignmentScope = 'all' | 'selected';

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  dueDate: string; // YYYY-MM-DD
  assignedTo: AssignmentScope;
  assignedStudentIds?: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type TestType = 'Quiz' | 'Test' | 'Exam' | 'Midterm' | 'Final';

export interface TestItem {
  id: string;
  title: string;
  type: TestType;
  subject: string;
  date: string; // YYYY-MM-DD
  time: string; // e.g. 10:00 AM
  syllabus: string;
  assignedTo: AssignmentScope;
  assignedStudentIds?: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceSummary {
  total: number;
  present: number;
  late: number;
  absent: number;
  leave: number;
  percentage: number | string;
}

export interface MonthlyAttendanceMetric {
  month: string; // YYYY-MM
  monthName: string; // e.g. "October 2026"
  total: number;
  present: number;
  late: number;
  absent: number;
  leave: number;
  percentage: number | string;
}

export interface SingleStudentReportData {
  student: UserProfile;
  summary: AttendanceSummary;
  attendanceHistory: AttendanceRecord[];
  monthlyMetrics: MonthlyAttendanceMetric[];
  tasks: TaskItem[];
  tests: TestItem[];
}

