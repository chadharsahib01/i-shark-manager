import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  writeBatch
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../config/firebase';
import {
  UserProfile,
  UserRole,
  AttendanceRecord,
  AttendanceStatus,
  TaskItem,
  TestItem,
  AttendanceSummary
} from '../types';

/* =========================================================================
   USER / STUDENT SERVICES
   ========================================================================= */

export async function getAllStudents(): Promise<UserProfile[]> {
  const path = 'users';
  try {
    const q = query(collection(db, path), where('role', '==', 'student'));
    const snapshot = await getDocs(q);
    const students: UserProfile[] = [];
    snapshot.forEach((d) => {
      const data = d.data();
      const studentName = (data.name || data.fullName || 'Unnamed Student') as string;
      const studentActive = data.active !== undefined ? Boolean(data.active) : (data.isActive !== undefined ? Boolean(data.isActive) : true);
      students.push({
        id: d.id,
        name: studentName,
        fullName: studentName,
        email: data.email || '',
        role: (data.role as UserRole) || 'student',
        active: studentActive,
        isActive: studentActive,
        rollNumber: data.rollNumber || '',
        batch: data.batch || '',
        phone: data.phone || '',
        createdAt: data.createdAt || '',
        updatedAt: data.updatedAt || ''
      });
    });
    return students;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function updateStudentProfile(
  studentId: string,
  data: Partial<UserProfile>
): Promise<void> {
  const path = `users/${studentId}`;
  try {
    const ref = doc(db, 'users', studentId);
    const updatePayload: Record<string, any> = {
      updatedAt: new Date().toISOString()
    };
    if (data.name !== undefined || data.fullName !== undefined) {
      const nameVal = data.name !== undefined ? data.name : data.fullName;
      updatePayload.name = nameVal;
    }
    if (data.email !== undefined) updatePayload.email = data.email;
    if (data.role !== undefined) updatePayload.role = data.role;
    if (data.active !== undefined || data.isActive !== undefined) {
      const activeVal = data.active !== undefined ? data.active : data.isActive;
      updatePayload.active = activeVal;
    }
    if (data.rollNumber !== undefined) updatePayload.rollNumber = data.rollNumber;
    if (data.batch !== undefined) updatePayload.batch = data.batch;
    if (data.phone !== undefined) updatePayload.phone = data.phone;

    await updateDoc(ref, updatePayload);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function toggleStudentStatus(studentId: string, active: boolean): Promise<void> {
  const path = `users/${studentId}`;
  try {
    const ref = doc(db, 'users', studentId);
    await updateDoc(ref, {
      active: active,
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

/* =========================================================================
   ATTENDANCE SERVICES
   ========================================================================= */

export async function getAttendanceByDate(dateStr: string): Promise<AttendanceRecord[]> {
  const path = 'attendance';
  try {
    const q = query(collection(db, path), where('date', '==', dateStr));
    const snapshot = await getDocs(q);
    const records: AttendanceRecord[] = [];
    snapshot.forEach((d) => {
      records.push({ id: d.id, ...d.data() } as AttendanceRecord);
    });
    return records;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function saveAttendanceRecords(records: AttendanceRecord[]): Promise<void> {
  if (records.length === 0) return;
  const path = 'attendance';
  try {
    const batch = writeBatch(db);
    const now = new Date().toISOString();
    for (const rec of records) {
      const docId = rec.id || `${rec.studentId}_${rec.date}`;
      const ref = doc(db, path, docId);
      batch.set(ref, {
        ...rec,
        id: docId,
        updatedAt: now
      }, { merge: true });
    }
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function getStudentAttendance(studentId: string): Promise<AttendanceRecord[]> {
  const path = 'attendance';
  try {
    const q = query(
      collection(db, path),
      where('studentId', '==', studentId)
    );
    const snapshot = await getDocs(q);
    const records: AttendanceRecord[] = [];
    snapshot.forEach((d) => {
      records.push({ id: d.id, ...d.data() } as AttendanceRecord);
    });
    // Sort chronologically descending
    return records.sort((a, b) => b.date.localeCompare(a.date));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function getAllAttendance(): Promise<AttendanceRecord[]> {
  const path = 'attendance';
  try {
    const snapshot = await getDocs(collection(db, path));
    const records: AttendanceRecord[] = [];
    snapshot.forEach((d) => {
      records.push({ id: d.id, ...d.data() } as AttendanceRecord);
    });
    return records.sort((a, b) => b.date.localeCompare(a.date));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export function calculateAttendanceSummary(records: AttendanceRecord[]): AttendanceSummary {
  const total = records.length;
  let present = 0;
  let late = 0;
  let absent = 0;
  let leave = 0;

  for (const r of records) {
    if (r.status === 'Present') present++;
    else if (r.status === 'Late') late++;
    else if (r.status === 'Absent') absent++;
    else if (r.status === 'Leave') leave++;
  }

  // Count Present & Late
  const attended = present + late;
  const percentage = total > 0 ? Math.round((attended / total) * 100) : '—';

  return { total, present, late, absent, leave, percentage };
}

/* =========================================================================
   TASK SERVICES
   ========================================================================= */

export async function getAllTasks(): Promise<TaskItem[]> {
  const path = 'tasks';
  try {
    const snapshot = await getDocs(collection(db, path));
    const tasks: TaskItem[] = [];
    snapshot.forEach((d) => {
      tasks.push({ id: d.id, ...d.data() } as TaskItem);
    });
    return tasks.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function getStudentTasks(studentId: string): Promise<TaskItem[]> {
  const path = 'tasks';
  try {
    const q1 = query(collection(db, path), where('assignedTo', '==', 'all'));
    const q2 = query(collection(db, path), where('assignedStudentIds', 'array-contains', studentId));
    const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);

    const taskMap = new Map<string, TaskItem>();
    snap1.forEach((d) => {
      taskMap.set(d.id, { id: d.id, ...d.data() } as TaskItem);
    });
    snap2.forEach((d) => {
      taskMap.set(d.id, { id: d.id, ...d.data() } as TaskItem);
    });

    const tasks = Array.from(taskMap.values());
    return tasks.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export const getTasksForStudent = getStudentTasks;

export async function createTask(task: Omit<TaskItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const path = 'tasks';
  try {
    const ref = doc(collection(db, path));
    const now = new Date().toISOString();
    const newTask: TaskItem = {
      ...task,
      id: ref.id,
      createdAt: now,
      updatedAt: now
    };
    await setDoc(ref, newTask);
    return ref.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function updateTask(taskId: string, data: Partial<TaskItem>): Promise<void> {
  const path = `tasks/${taskId}`;
  try {
    const ref = doc(db, 'tasks', taskId);
    await updateDoc(ref, {
      ...data,
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function deleteTask(taskId: string): Promise<void> {
  const path = `tasks/${taskId}`;
  try {
    await deleteDoc(doc(db, 'tasks', taskId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

/* =========================================================================
   TEST / QUIZ SERVICES
   ========================================================================= */

export async function getAllTests(): Promise<TestItem[]> {
  const path = 'tests';
  try {
    const snapshot = await getDocs(collection(db, path));
    const tests: TestItem[] = [];
    snapshot.forEach((d) => {
      tests.push({ id: d.id, ...d.data() } as TestItem);
    });
    return tests.sort((a, b) => a.date.localeCompare(b.date));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function getStudentTests(studentId: string): Promise<TestItem[]> {
  const path = 'tests';
  try {
    const q1 = query(collection(db, path), where('assignedTo', '==', 'all'));
    const q2 = query(collection(db, path), where('assignedStudentIds', 'array-contains', studentId));
    const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);

    const testMap = new Map<string, TestItem>();
    snap1.forEach((d) => {
      testMap.set(d.id, { id: d.id, ...d.data() } as TestItem);
    });
    snap2.forEach((d) => {
      testMap.set(d.id, { id: d.id, ...d.data() } as TestItem);
    });

    const tests = Array.from(testMap.values());
    return tests.sort((a, b) => a.date.localeCompare(b.date));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export const getTestsForStudent = getStudentTests;

export async function createTest(test: Omit<TestItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const path = 'tests';
  try {
    const ref = doc(collection(db, path));
    const now = new Date().toISOString();
    const newTest: TestItem = {
      ...test,
      id: ref.id,
      createdAt: now,
      updatedAt: now
    };
    await setDoc(ref, newTest);
    return ref.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function updateTest(testId: string, data: Partial<TestItem>): Promise<void> {
  const path = `tests/${testId}`;
  try {
    const ref = doc(db, 'tests', testId);
    await updateDoc(ref, {
      ...data,
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function deleteTest(testId: string): Promise<void> {
  const path = `tests/${testId}`;
  try {
    await deleteDoc(doc(db, 'tests', testId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}
