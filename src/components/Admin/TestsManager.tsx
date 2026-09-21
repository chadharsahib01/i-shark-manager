import React, { useEffect, useState } from 'react';
import {
  FileText,
  Plus,
  Calendar,
  Clock,
  BookOpen,
  Users,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  X
} from 'lucide-react';
import { TestItem, TestType, UserProfile } from '../../types';
import {
  getAllTests,
  createTest,
  updateTest,
  deleteTest,
  getAllStudents
} from '../../services/firestoreService';
import { useAuth } from '../../context/AuthContext';
import { getLocalDateString, addDaysLocal, getDaysDiffLocal } from '../../utils/dateUtils';

export const TestsManager: React.FC = () => {
  const { currentUser } = useAuth();

  const [tests, setTests] = useState<TestItem[]>([]);
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState<TestItem | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [type, setType] = useState<TestType>('Test');
  const [subject, setSubject] = useState('');
  const [date, setDate] = useState(addDaysLocal(getLocalDateString(), 4));
  const [time, setTime] = useState('10:00 AM - 11:30 AM');
  const [syllabus, setSyllabus] = useState('');
  const [assignedTo, setAssignedTo] = useState<'all' | 'selected'>('all');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchTestsAndStudents = async () => {
    setLoading(true);
    try {
      const [testsData, studentsData] = await Promise.all([
        getAllTests(),
        getAllStudents()
      ]);
      setTests(testsData);
      setStudents(studentsData.filter((s) => s.isActive));
    } catch (err) {
      console.error('Error fetching tests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestsAndStudents();
  }, []);

  const handleCreateTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (assignedTo === 'selected' && selectedStudentIds.length === 0) {
      setFormError('Please select at least one student or choose "All Students".');
      return;
    }

    setIsSubmitting(true);
    try {
      await createTest({
        title: title.trim(),
        type,
        subject: subject.trim(),
        date,
        time: time.trim(),
        syllabus: syllabus.trim(),
        assignedTo,
        assignedStudentIds: assignedTo === 'selected' ? selectedStudentIds : [],
        createdBy: currentUser?.uid || 'admin'
      });

      setToastMessage('Test schedule created successfully.');
      setTimeout(() => setToastMessage(null), 3000);

      // Reset
      setTitle('');
      setSubject('');
      setSyllabus('');
      setSelectedStudentIds([]);
      setAssignedTo('all');
      setCreateModalOpen(false);
      await fetchTestsAndStudents();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create test.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (t: TestItem) => {
    setSelectedTest(t);
    setTitle(t.title);
    setType(t.type);
    setSubject(t.subject);
    setDate(t.date);
    setTime(t.time);
    setSyllabus(t.syllabus);
    setAssignedTo(t.assignedTo);
    setSelectedStudentIds(t.assignedStudentIds || []);
    setFormError(null);
    setEditModalOpen(true);
  };

  const handleUpdateTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTest) return;
    setFormError(null);

    if (assignedTo === 'selected' && selectedStudentIds.length === 0) {
      setFormError('Please select at least one student or choose "All Students".');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateTest(selectedTest.id, {
        title: title.trim(),
        type,
        subject: subject.trim(),
        date,
        time: time.trim(),
        syllabus: syllabus.trim(),
        assignedTo,
        assignedStudentIds: assignedTo === 'selected' ? selectedStudentIds : []
      });

      setToastMessage('Test schedule updated successfully.');
      setTimeout(() => setToastMessage(null), 3000);
      setEditModalOpen(false);
      await fetchTestsAndStudents();
    } catch (err: any) {
      setFormError(err.message || 'Failed to update test.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTest = async () => {
    if (!selectedTest) return;
    setIsSubmitting(true);
    try {
      await deleteTest(selectedTest.id);
      setToastMessage('Test schedule deleted successfully.');
      setTimeout(() => setToastMessage(null), 3000);
      setDeleteModalOpen(false);
      await fetchTestsAndStudents();
    } catch (err: any) {
      alert(`Error deleting test: ${err.message}`);
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

  const getDaysBadge = (testDateStr: string) => {
    const diffDays = getDaysDiffLocal(testDateStr, todayStr);

    if (diffDays < 0) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
          Completed ({Math.abs(diffDays)}d ago)
        </span>
      );
    }
    if (diffDays === 0) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 animate-pulse">
          Today
        </span>
      );
    }
    if (diffDays === 1) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">
          Tomorrow
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
        In {diffDays} days
      </span>
    );
  };

  const filteredTests = tests.filter((t) => {
    if (filterType === 'all') return true;
    return t.type.toLowerCase() === filterType.toLowerCase();
  });

  return (
    <div className="space-y-6">
      {/* Header and Add Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <FileText className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <span>Tests & Quizzes Schedule</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Create examinations, surprise quizzes, subjects, timings, and syllabus coverage.
          </p>
        </div>

        <button
          onClick={() => {
            setTitle('');
            setType('Test');
            setSubject('');
            setDate(addDaysLocal(getLocalDateString(), 4));
            setTime('10:00 AM - 11:30 AM');
            setSyllabus('');
            setAssignedTo('all');
            setSelectedStudentIds([]);
            setFormError(null);
            setCreateModalOpen(true);
          }}
          id="btn-create-test"
          className="px-5 py-2.5 rounded-2xl text-xs font-semibold bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white shadow-md shadow-indigo-600/25 transition flex items-center justify-center space-x-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule New Test</span>
        </button>
      </div>

      {/* Toast */}
      {toastMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-50/90 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 flex items-center space-x-2 animate-in fade-in shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Type Filter Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1">
        {['all', 'quiz', 'test', 'exam', 'midterm', 'final'].map((t) => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition cursor-pointer ${
              filterType === t
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                : 'glass-panel text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/60'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tests Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredTests.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-3xl glass-panel shadow-sm">
          <FileText className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">No Tests Found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {filterType !== 'all'
              ? `No tests match the "${filterType}" category filter.`
              : 'Schedule your first quiz or examination to notify students.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTests.map((test) => (
            <div
              key={test.id}
              className="p-5 rounded-3xl glass-panel shadow-xs hover:border-indigo-400/50 dark:hover:border-indigo-500/50 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase bg-indigo-50/90 text-indigo-700 border border-indigo-200/80 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800">
                      {test.type}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {test.subject}
                    </span>
                  </div>
                  {getDaysBadge(test.date)}
                </div>

                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2 line-clamp-2">
                  {test.title}
                </h3>

                <div className="p-3 rounded-2xl bg-white/50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800/70 space-y-1.5 text-xs text-slate-600 dark:text-slate-300 mb-3">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>
                      Date: <strong className="text-slate-800 dark:text-white">{test.date}</strong>
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Time: {test.time}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>
                      {test.assignedTo === 'all'
                        ? 'Assigned to All Students'
                        : `${test.assignedStudentIds?.length || 0} Students`}
                    </span>
                  </div>
                </div>

                {test.syllabus && (
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-1 mb-1">
                      <BookOpen className="w-3 h-3 text-slate-400" />
                      <span>Syllabus:</span>
                    </span>
                    <p className="text-[11px] line-clamp-3 italic bg-white/40 dark:bg-slate-800/30 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                      {test.syllabus}
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-100/80 dark:border-slate-800/80 flex items-center justify-end space-x-1.5">
                <button
                  onClick={() => handleOpenEdit(test)}
                  className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-slate-200/50 dark:hover:bg-slate-800/60 transition cursor-pointer"
                  title="Edit Test"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setSelectedTest(test);
                    setDeleteModalOpen(true);
                  }}
                  className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                  title="Delete Test"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
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
              {createModalOpen ? 'Schedule New Test / Quiz' : 'Edit Test Schedule'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Enter subject, evaluation type, date, duration, and curriculum syllabus.
            </p>

            {formError && (
              <div className="mb-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={createModalOpen ? handleCreateTest : handleUpdateTest} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Test Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Unit 3: Graph Algorithms Quiz"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/70 dark:bg-slate-800/70 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Evaluation Type *
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as TestType)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/70 dark:bg-slate-800/70 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-hidden"
                  >
                    <option value="Quiz">Quiz</option>
                    <option value="Test">Test</option>
                    <option value="Exam">Exam</option>
                    <option value="Midterm">Midterm</option>
                    <option value="Final">Final</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Subject / Course *
                  </label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Computer Science"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/70 dark:bg-slate-800/70 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Test Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/70 dark:bg-slate-800/70 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-hidden cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Time / Duration *
                  </label>
                  <input
                    type="text"
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    placeholder="e.g. 10:00 AM - 11:30 AM"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/70 dark:bg-slate-800/70 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Syllabus & Topics Covered *
                </label>
                <textarea
                  required
                  rows={3}
                  value={syllabus}
                  onChange={(e) => setSyllabus(e.target.value)}
                  placeholder="Topics, chapters, and allowed reference materials..."
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/70 dark:bg-slate-800/70 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-hidden"
                ></textarea>
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
                  <div className="max-h-40 overflow-y-auto border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-2 space-y-1 bg-white/50 dark:bg-slate-800/40">
                    {students.length === 0 ? (
                      <p className="text-xs text-slate-400 p-2">No active students found.</p>
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
                  {isSubmitting ? 'Saving...' : createModalOpen ? 'Schedule Test' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModalOpen && selectedTest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl glass-panel p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Delete Test</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-5">
              Are you sure you want to delete <strong>"{selectedTest.title}"</strong>?
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/60 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTest}
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
