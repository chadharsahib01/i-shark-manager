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
  CheckCircle2
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
      const newId = await createTask({
        title: title.trim(),
        description: description.trim(),
        dueDate,
        assignedTo,
        assignedStudentIds: assignedTo === 'selected' ? selectedStudentIds : [],
        createdBy: currentUser?.uid || 'admin'
      });

      setToastMessage('Task created and assigned successfully.');
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

      setToastMessage('Task updated successfully.');
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
      setToastMessage('Task deleted successfully.');
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
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 flex items-center space-x-1">
          <AlertCircle className="w-3 h-3" />
          <span>Overdue ({Math.abs(diffDays)}d)</span>
        </span>
      );
    }
    if (diffDays === 0) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
          Due Today
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
        In {diffDays} days
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <CheckSquare className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <span>Task Assignments</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Assign homework, lab projects, and problem sets to all or selected students.
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
          className="px-5 py-2.5 rounded-2xl text-xs font-semibold bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white shadow-md shadow-indigo-600/25 transition flex items-center justify-center space-x-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Assign New Task</span>
        </button>
      </div>

      {/* Toast message */}
      {toastMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-50/90 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 flex items-center space-x-2 animate-in fade-in shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Task List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-3xl glass-panel shadow-sm">
          <CheckSquare className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">No Tasks Created</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Create your first academic task and distribute it to all or specific students.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="p-5 rounded-3xl glass-panel shadow-xs hover:border-indigo-400/50 dark:hover:border-indigo-500/50 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2">
                    {task.title}
                  </h3>
                  {getDaysBadge(task.dueDate)}
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 mb-4">
                  {task.description}
                </p>

                <div className="space-y-1.5 pt-3 border-t border-slate-100/80 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center space-x-1 text-slate-400">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Due Date:</span>
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {task.dueDate}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center space-x-1 text-slate-400">
                      <Users className="w-3.5 h-3.5" />
                      <span>Assigned:</span>
                    </span>
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                      {task.assignedTo === 'all'
                        ? 'All Active Students'
                        : `${task.assignedStudentIds?.length || 0} Students`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-100/80 dark:border-slate-800/80 flex items-center justify-end space-x-1.5">
                <button
                  onClick={() => handleOpenEdit(task)}
                  className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-slate-200/50 dark:hover:bg-slate-800/60 transition cursor-pointer"
                  title="Edit Task"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setSelectedTask(task);
                    setDeleteModalOpen(true);
                  }}
                  className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                  title="Delete Task"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Task Modal */}
      {(createModalOpen || editModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-[32px] sm:rounded-3xl glass-panel p-6 sm:p-7 shadow-2xl">
            <button
              onClick={() => {
                setCreateModalOpen(false);
                setEditModalOpen(false);
              }}
              className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/60 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              {createModalOpen ? 'Create New Task' : 'Edit Task'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Enter task requirements and specify target student assignees.
            </p>

            {formError && (
              <div className="mb-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={createModalOpen ? handleCreateTask : handleUpdateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Chapter 4 Problem Set: Computer Networks"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/70 dark:bg-slate-800/70 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description & Submission Guidelines *
                </label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detail instructions, required formats, and learning outcomes..."
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/70 dark:bg-slate-800/70 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-hidden"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Due Date *
                </label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/70 dark:bg-slate-800/70 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-hidden cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Assign To
                </label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setAssignedTo('all')}
                    className={`py-2 px-3 text-xs font-semibold rounded-xl border transition cursor-pointer ${
                      assignedTo === 'all'
                        ? 'bg-indigo-50/90 dark:bg-indigo-950/80 border-indigo-400 text-indigo-700 dark:text-indigo-300'
                        : 'border-slate-200/80 dark:border-slate-700/80 bg-white/40 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    All Students
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssignedTo('selected')}
                    className={`py-2 px-3 text-xs font-semibold rounded-xl border transition cursor-pointer ${
                      assignedTo === 'selected'
                        ? 'bg-indigo-50/90 dark:bg-indigo-950/80 border-indigo-400 text-indigo-700 dark:text-indigo-300'
                        : 'border-slate-200/80 dark:border-slate-700/80 bg-white/40 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Selected Students ({selectedStudentIds.length})
                  </button>
                </div>

                {assignedTo === 'selected' && (
                  <div className="max-h-44 overflow-y-auto border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-2 space-y-1 bg-white/50 dark:bg-slate-800/40">
                    {students.length === 0 ? (
                      <p className="text-xs text-slate-400 p-2">No active students available.</p>
                    ) : (
                      students.map((st) => (
                        <label
                          key={st.id}
                          className="flex items-center space-x-2 text-xs p-2 rounded-xl hover:bg-slate-100/70 dark:hover:bg-slate-700/50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedStudentIds.includes(st.id)}
                            onChange={() => toggleStudentSelection(st.id)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {st.fullName}
                          </span>
                          <span className="text-[11px] text-slate-400">({st.rollNumber || st.email})</span>
                        </label>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setCreateModalOpen(false);
                    setEditModalOpen(false);
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/60 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white shadow-md shadow-indigo-600/25 disabled:opacity-50 transition cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : createModalOpen ? 'Create Task' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl glass-panel p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Delete Task</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-5">
              Are you sure you want to delete <strong>"{selectedTask.title}"</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/60 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTask}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-sm disabled:opacity-50 transition cursor-pointer"
              >
                {isSubmitting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
