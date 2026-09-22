import React, { useEffect, useState } from 'react';
import {
  CheckSquare,
  Plus,
  Calendar,
  Users,
  Edit2,
  Trash2,
  AlertCircle,
  Clock,
  X,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { TaskItem, UserProfile } from '../../types';
import {
  getAllTasks,
  createTask,
  updateTask,
  deleteTask,
  getAllStudents
} from '../../services/firestoreService';
import { useAuth } from '../../context/AuthContext';
import { getLocalDateString, addDaysLocal, getDaysDiffLocal } from '../../utils/dateUtils';

export const TaskManager: React.FC = () => {
  const { currentUser } = useAuth();

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(addDaysLocal(getLocalDateString(), 3));
  const [assignedTo, setAssignedTo] = useState<'all' | 'selected'>('all');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchTasksAndStudents = async () => {
    setLoading(true);
    try {
      const [tasksData, studentsData] = await Promise.all([
        getAllTasks(),
        getAllStudents()
      ]);
      setTasks(tasksData);
      setStudents(studentsData.filter((s) => s.isActive));
    } catch (err) {
      console.error('Error loading tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasksAndStudents();
  }, []);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (assignedTo === 'selected' && selectedStudentIds.length === 0) {
      setFormError('Please select at least one student or choose "Assign to All Students".');
      return;
    }

    setIsSubmitting(true);
    try {
      await createTask({
        title: title.trim(),
        description: description.trim(),
        dueDate,
        assignedTo,
        assignedStudentIds: assignedTo === 'selected' ? selectedStudentIds : [],
        createdBy: currentUser?.uid || 'admin'
      });

      setToastMessage('Task assignment voucher committed to ledger.');
      setTimeout(() => setToastMessage(null), 3000);

      // Reset and close
      setTitle('');
      setDescription('');
      setSelectedStudentIds([]);
      setAssignedTo('all');
      setCreateModalOpen(false);
      await fetchTasksAndStudents();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create task.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (task: TaskItem) => {
    setSelectedTask(task);
    setTitle(task.title);
    setDescription(task.description);
    setDueDate(task.dueDate);
    setAssignedTo(task.assignedTo);
    setSelectedStudentIds(task.assignedStudentIds || []);
    setFormError(null);
    setEditModalOpen(true);
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;
    setFormError(null);

    if (assignedTo === 'selected' && selectedStudentIds.length === 0) {
      setFormError('Please select at least one student or choose "Assign to All Students".');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateTask(selectedTask.id, {
        title: title.trim(),
        description: description.trim(),
        dueDate,
        assignedTo,
        assignedStudentIds: assignedTo === 'selected' ? selectedStudentIds : []
      });

      setToastMessage('Task assignment voucher updated.');
      setTimeout(() => setToastMessage(null), 3000);
      setEditModalOpen(false);
      await fetchTasksAndStudents();
    } catch (err: any) {
      setFormError(err.message || 'Failed to update task.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!selectedTask) return;
    setIsSubmitting(true);
    try {
      await deleteTask(selectedTask.id);
      setToastMessage('Task voucher removed from registry.');
      setTimeout(() => setToastMessage(null), 3000);
      setDeleteModalOpen(false);
      await fetchTasksAndStudents();
    } catch (err: any) {
      alert(`Error deleting task: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const todayStr = getLocalDateString();

  const getDaysBadge = (dueDateStr: string) => {
    const diffDays = getDaysDiffLocal(dueDateStr, todayStr);

    if (diffDays < 0) {
      return (
        <span className="tag-mono px-2 py-0.5 rounded text-[9px] font-bold bg-rose-950/60 text-rose-300 border border-rose-500/40 flex items-center space-x-1">
          <AlertCircle className="w-3 h-3 text-rose-400" />
          <span>OVERDUE ({Math.abs(diffDays)}D)</span>
        </span>
      );
    }
    if (diffDays === 0) {
      return (
        <span className="tag-mono px-2 py-0.5 rounded text-[9px] font-bold bg-amber-950/60 text-amber-300 border border-amber-500/40">
          DUE TODAY
        </span>
      );
    }
    return (
      <span className="tag-mono px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-500/40">
        IN {diffDays} DAYS
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="ticket-pass p-5 sm:p-6 bg-slate-900/90 border-violet-500/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-1.5">
              <span className="tag-mono px-2 py-0.5 rounded bg-violet-500/10 text-violet-300 border border-violet-500/30 flex items-center space-x-1 font-bold">
                <Sparkles className="w-3 h-3 text-violet-400" />
                <span>COURSEWORK DISTRIBUTION VOUCHER</span>
              </span>
              <span className="tag-mono text-[9px] text-slate-500">ASSIGNMENTS</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight flex items-center space-x-2">
              <CheckSquare className="w-6 h-6 text-violet-400" />
              <span>Task Assignments</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Dispatch problem sets, practical lab projects, and coursework to specific or cohort rosters.
            </p>
          </div>

          <button
            onClick={() => {
              setTitle('');
              setDescription('');
              setDueDate(addDaysLocal(getLocalDateString(), 3));
              setAssignedTo('all');
              setSelectedStudentIds([]);
              setFormError(null);
              setCreateModalOpen(true);
            }}
            id="btn-create-task"
            className="glow-orb-btn px-4 py-2.5 text-xs font-bold text-white bg-violet-600 hover:bg-violet-500 border border-violet-400/40 flex items-center space-x-2 cursor-pointer shrink-0 shadow-lg shadow-violet-900/40"
          >
            <Plus className="w-4 h-4" />
            <span className="uppercase">Issue Task Voucher</span>
          </button>
        </div>
      </div>

      {/* Toast message */}
      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-300 flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-mono font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Task List: Ticket Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-3xl ticket-pass bg-slate-900/90 border-slate-800 text-slate-400">
          <CheckSquare className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-white uppercase tag-mono">No Task Vouchers Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Issue an assignment voucher to distribute tasks across students.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="ticket-pass p-0 bg-slate-950 border-violet-500/30 flex flex-col justify-between hover:border-violet-500/60 transition-all duration-300 shadow-xl"
            >
              <div className="p-5">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-sm font-black text-white uppercase tracking-tight line-clamp-2">
                    {task.title}
                  </h3>
                  {getDaysBadge(task.dueDate)}
                </div>

                <p className="text-xs text-slate-400 line-clamp-3 mb-4 leading-relaxed font-sans">
                  {task.description}
                </p>

                <div className="space-y-1.5 pt-3 border-t border-slate-800 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="tag-mono text-[9px] text-slate-500 flex items-center space-x-1">
                      <Calendar className="w-3 h-3 text-violet-400" />
                      <span>DEADLINE:</span>
                    </span>
                    <span className="font-mono font-bold text-slate-200">
                      {task.dueDate}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="tag-mono text-[9px] text-slate-500 flex items-center space-x-1">
                      <Users className="w-3 h-3 text-emerald-400" />
                      <span>ALLOCATION:</span>
                    </span>
                    <span className="tag-mono text-[10px] font-bold text-violet-300">
                      {task.assignedTo === 'all'
                        ? 'ALL ACTIVE STUDENTS'
                        : `${task.assignedStudentIds?.length || 0} RECIPIENTS`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Perforation Divider */}
              <div className="ticket-perforation-divider bg-slate-950">
                <div className="ticket-notch-left" />
                <div className="ticket-dashed-line" />
                <div className="ticket-notch-right" />
              </div>

              {/* Stub Footer Controls */}
              <div className="p-4 bg-slate-900/80 flex items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <div className="ticket-barcode-graphic text-slate-400 w-16" />
                  <span className="tag-mono text-[8px] text-slate-500">
                    VOUCHER #{task.id.slice(0, 6)}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleOpenEdit(task)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition btn-tactile text-xs flex items-center space-x-1"
                    title="Edit Task"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-violet-400" />
                    <span className="tag-mono text-[10px] font-bold">EDIT</span>
                  </button>
                  <button
                    onClick={() => {
                      setSelectedTask(task);
                      setDeleteModalOpen(true);
                    }}
                    className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition btn-tactile text-xs"
                    title="Delete Task"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Task Modal */}
      {(createModalOpen || editModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl ticket-pass bg-slate-950 border-violet-500/40 p-6 sm:p-7 shadow-2xl">
            <button
              onClick={() => {
                setCreateModalOpen(false);
                setEditModalOpen(false);
              }}
              className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-base font-black text-white uppercase tag-mono mb-1">
              {createModalOpen ? 'Issue Task Voucher' : 'Modify Task Voucher'}
            </h2>
            <p className="tag-mono text-[10px] text-slate-400 mb-4">
              Enter coursework specifications and target student assignees.
            </p>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-xs text-rose-300 flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span className="font-mono">{formError}</span>
              </div>
            )}

            <form onSubmit={createModalOpen ? handleCreateTask : handleUpdateTask} className="space-y-4">
              <div>
                <label className="block tag-mono text-[10px] text-slate-400 mb-1">
                  TASK TITLE *
                </label>
                <div className="inset-field">
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Practical Lab: Socket Programming in C"
                    className="text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block tag-mono text-[10px] text-slate-400 mb-1">
                  SUBMISSION CRITERIA & GUIDELINES *
                </label>
                <div className="inset-field">
                  <textarea
                    required
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Specify project objectives, deliverables, and repo format..."
                    className="text-xs w-full bg-transparent outline-hidden text-slate-100 placeholder:text-slate-600 resize-none"
                  />
                </div>
              </div>

              <div>
                <label className="block tag-mono text-[10px] text-slate-400 mb-1">
                  DUE DATE *
                </label>
                <div className="inset-field">
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="text-xs cursor-pointer font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block tag-mono text-[10px] text-slate-400 mb-1">
                  TARGET ALLOCATION
                </label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setAssignedTo('all')}
                    className={`py-2 px-3 text-xs tag-mono font-bold rounded-xl border transition cursor-pointer btn-tactile ${
                      assignedTo === 'all'
                        ? 'bg-violet-600 text-white border-violet-400 shadow-md shadow-violet-900/40'
                        : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    ALL ACTIVE STUDENTS
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssignedTo('selected')}
                    className={`py-2 px-3 text-xs tag-mono font-bold rounded-xl border transition cursor-pointer btn-tactile ${
                      assignedTo === 'selected'
                        ? 'bg-violet-600 text-white border-violet-400 shadow-md shadow-violet-900/40'
                        : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    SELECTED STUDENTS ({selectedStudentIds.length})
                  </button>
                </div>

                {assignedTo === 'selected' && (
                  <div className="max-h-44 overflow-y-auto border border-slate-800 rounded-xl p-2 space-y-1 bg-slate-950">
                    {students.length === 0 ? (
                      <p className="tag-mono text-xs text-slate-500 p-2">No active students found.</p>
                    ) : (
                      students.map((st) => (
                        <label
                          key={st.id}
                          className="flex items-center space-x-2 text-xs p-2 rounded-lg hover:bg-slate-900 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedStudentIds.includes(st.id)}
                            onChange={() => toggleStudentSelection(st.id)}
                            className="rounded border-slate-700 bg-slate-900 text-violet-600 focus:ring-violet-500"
                          />
                          <span className="font-bold text-white">
                            {st.fullName}
                          </span>
                          <span className="tag-mono text-[10px] text-slate-400">
                            ({st.rollNumber || st.email})
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setCreateModalOpen(false);
                    setEditModalOpen(false);
                  }}
                  className="px-4 py-2 rounded-xl tag-mono text-xs font-bold text-slate-400 hover:text-white bg-slate-900 border border-slate-800 transition cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="glow-orb-btn px-5 py-2 text-xs font-bold text-white bg-violet-600 hover:bg-violet-500 border border-violet-400/40 disabled:opacity-50 transition cursor-pointer uppercase shadow-lg shadow-violet-900/40"
                >
                  {isSubmitting ? 'DISPATCHING...' : createModalOpen ? 'DISPATCH VOUCHER' : 'SAVE CHANGES'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl ticket-pass bg-slate-950 border-rose-500/40 p-6 shadow-2xl">
            <h3 className="text-sm font-bold text-white uppercase tag-mono mb-2">Delete Assignment Voucher</h3>
            <p className="tag-mono text-xs text-slate-400 mb-5 leading-relaxed">
              Confirm purge of voucher <strong>"{selectedTask.title}"</strong> from institutional records?
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 tag-mono text-xs font-bold text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-xl transition cursor-pointer"
              >
                CANCEL
              </button>
              <button
                onClick={handleDeleteTask}
                disabled={isSubmitting}
                className="px-4 py-2 tag-mono text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-md disabled:opacity-50 transition cursor-pointer"
              >
                {isSubmitting ? 'PURGING...' : 'CONFIRM PURGE'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
