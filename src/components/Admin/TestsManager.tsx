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
  X,
  Sparkles,
  Search
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
  const [searchQuery, setSearchQuery] = useState('');

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

      setToastMessage('Test scheduled successfully.');
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
      setFormError(err.message || 'Failed to create test schedule.');
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
      setToastMessage('Test deleted successfully.');
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
        <span className="tag-mono px-2 py-0.5 rounded text-[9px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
          CONCLUDED ({Math.abs(diffDays)}D AGO)
        </span>
      );
    }
    if (diffDays === 0) {
      return (
        <span className="tag-mono px-2 py-0.5 rounded text-[9px] font-bold bg-amber-950/60 text-amber-300 border border-amber-500/40 animate-pulse">
          EXAM TODAY
        </span>
      );
    }
    if (diffDays === 1) {
      return (
        <span className="tag-mono px-2 py-0.5 rounded text-[9px] font-bold bg-sky-950/60 text-sky-300 border border-sky-500/40">
          TOMORROW
        </span>
      );
    }
    return (
      <span className="tag-mono px-2 py-0.5 rounded text-[9px] font-bold bg-violet-950/60 text-violet-300 border border-violet-500/40">
        IN {diffDays} DAYS
      </span>
    );
  };

  const filteredTests = tests.filter((t) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      t.title.toLowerCase().includes(q) ||
      t.subject.toLowerCase().includes(q) ||
      t.syllabus.toLowerCase().includes(q);
    if (!matchesSearch) return false;

    if (filterType === 'all') return true;
    return t.type.toLowerCase() === filterType.toLowerCase();
  });

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="ticket-pass p-5 sm:p-6 bg-slate-900/90 border-violet-500/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-1.5">
              <span className="tag-mono px-2 py-0.5 rounded bg-violet-500/10 text-violet-300 border border-violet-500/30 flex items-center space-x-1 font-bold">
                <Sparkles className="w-3 h-3 text-violet-400" />
                <span>TESTS & EXAMS</span>
              </span>
              <span className="tag-mono text-[9px] text-slate-500">SCHEDULE</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight flex items-center space-x-2">
              <FileText className="w-6 h-6 text-violet-400" />
              <span>Tests & Examinations</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Schedule tests, quizzes, and exams with syllabus topics and assigned students.
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
            className="glow-orb-btn px-4 py-2.5 text-xs font-bold text-white bg-violet-600 hover:bg-violet-500 border border-violet-400/40 flex items-center space-x-2 cursor-pointer shrink-0 shadow-lg shadow-violet-900/40"
          >
            <Plus className="w-4 h-4" />
            <span className="uppercase">Schedule Test</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-300 flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-mono font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Search and Type Filter Ribbon */}
      <div className="ticket-pass p-4 bg-slate-900/90 border-violet-500/20 flex flex-col md:flex-row items-center gap-3">
        <div className="relative w-full md:flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tests by title, subject, syllabus..."
            className="w-full pl-10 pr-3.5 py-2 text-xs font-mono rounded-xl border border-slate-700 bg-slate-950 text-slate-100 placeholder:text-slate-500 focus:border-violet-500 outline-hidden"
          />
        </div>

        <div className="flex items-center space-x-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {['all', 'quiz', 'test', 'exam', 'midterm', 'final'].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-xl tag-mono text-xs font-bold uppercase transition cursor-pointer btn-tactile shrink-0 ${
                filterType === t
                  ? 'bg-violet-600 text-white border border-violet-400 shadow-md shadow-violet-900/40'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Tests Grid: Examination Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredTests.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-3xl ticket-pass bg-slate-900/90 border-slate-800 text-slate-400">
          <FileText className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-white uppercase tag-mono">No Scheduled Tests</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {filterType !== 'all'
              ? `No tests match the "${filterType}" category.`
              : 'Schedule a test to notify students.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTests.map((test) => (
            <div
              key={test.id}
              className="ticket-pass p-0 bg-slate-950 border-violet-500/30 flex flex-col justify-between hover:border-violet-500/60 transition-all duration-300 shadow-xl"
            >
              <div className="p-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="tag-mono px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-violet-500/20 text-violet-300 border border-violet-500/30">
                      {test.type}
                    </span>
                    <span className="tag-mono text-[10px] font-bold text-slate-300">
                      {test.subject}
                    </span>
                  </div>
                  {getDaysBadge(test.date)}
                </div>

                <h3 className="text-sm font-black text-white uppercase tracking-tight mb-3 line-clamp-2">
                  {test.title}
                </h3>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5 text-xs text-slate-300 mb-3">
                  <div className="flex items-center justify-between">
                    <span className="tag-mono text-[9px] text-slate-500 flex items-center space-x-1">
                      <Calendar className="w-3 h-3 text-violet-400" />
                      <span>DATE:</span>
                    </span>
                    <span className="font-mono font-bold text-white">{test.date}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="tag-mono text-[9px] text-slate-500 flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-amber-400" />
                      <span>TIME:</span>
                    </span>
                    <span className="font-mono text-slate-200">{test.time}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="tag-mono text-[9px] text-slate-500 flex items-center space-x-1">
                      <Users className="w-3 h-3 text-emerald-400" />
                      <span>ASSIGNED:</span>
                    </span>
                    <span className="tag-mono text-[9px] font-bold text-violet-300">
                      {test.assignedTo === 'all'
                        ? 'ALL STUDENTS'
                        : `${test.assignedStudentIds?.length || 0} STUDENTS`}
                    </span>
                  </div>
                </div>

                {test.syllabus && (
                  <div className="text-xs">
                    <span className="tag-mono text-[9px] text-slate-500 flex items-center space-x-1 mb-1">
                      <BookOpen className="w-3 h-3 text-rose-400" />
                      <span>SYLLABUS & TOPICS:</span>
                    </span>
                    <p className="tag-mono text-[10px] line-clamp-2 text-slate-400 bg-slate-900/50 p-2 rounded-lg border border-slate-800/80">
                      {test.syllabus}
                    </p>
                  </div>
                )}
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
                    TEST #{test.id.slice(0, 6)}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleOpenEdit(test)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition btn-tactile text-xs flex items-center space-x-1"
                    title="Edit Test"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-violet-400" />
                    <span className="tag-mono text-[10px] font-bold">EDIT</span>
                  </button>
                  <button
                    onClick={() => {
                      setSelectedTest(test);
                      setDeleteModalOpen(true);
                    }}
                    className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition btn-tactile text-xs"
                    title="Delete Test"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
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
              {createModalOpen ? 'Schedule Test' : 'Edit Test Schedule'}
            </h2>
            <p className="tag-mono text-[10px] text-slate-400 mb-4">
              Enter subject, test type, date, time, and syllabus details.
            </p>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-xs text-rose-300 flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span className="font-mono">{formError}</span>
              </div>
            )}

            <form onSubmit={createModalOpen ? handleCreateTest : handleUpdateTest} className="space-y-4">
              <div>
                <label className="block tag-mono text-[10px] text-slate-400 mb-1">
                  TEST TITLE *
                </label>
                <div className="inset-field">
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Midterm Examination: Computer Architecture"
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block tag-mono text-[10px] text-slate-400 mb-1">
                    TEST TYPE *
                  </label>
                  <div className="inset-field">
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as TestType)}
                      className="text-xs bg-slate-950 text-slate-200 outline-hidden w-full cursor-pointer"
                    >
                      <option value="Quiz">Quiz</option>
                      <option value="Test">Test</option>
                      <option value="Exam">Exam</option>
                      <option value="Midterm">Midterm</option>
                      <option value="Final">Final</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block tag-mono text-[10px] text-slate-400 mb-1">
                    SUBJECT *
                  </label>
                  <div className="inset-field">
                    <input
                      type="text"
                      required
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="e.g. Computer Science"
                      className="text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block tag-mono text-[10px] text-slate-400 mb-1">
                    DATE *
                  </label>
                  <div className="inset-field">
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="text-xs font-mono cursor-pointer"
                    />
                  </div>
                </div>

                <div>
                  <label className="block tag-mono text-[10px] text-slate-400 mb-1">
                    TIME *
                  </label>
                  <div className="inset-field">
                    <input
                      type="text"
                      required
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      placeholder="e.g. 10:00 AM - 11:30 AM"
                      className="text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block tag-mono text-[10px] text-slate-400 mb-1">
                  SYLLABUS & TOPICS *
                </label>
                <div className="inset-field">
                  <textarea
                    required
                    rows={3}
                    value={syllabus}
                    onChange={(e) => setSyllabus(e.target.value)}
                    placeholder="Specify modules, chapters, and required topics..."
                    className="text-xs w-full bg-transparent outline-hidden text-slate-100 placeholder:text-slate-600 resize-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block tag-mono text-[10px] text-slate-400 mb-1">
                  ASSIGN TO
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
                    ALL STUDENTS
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
                      <p className="tag-mono text-xs text-slate-500 p-2">No students available.</p>
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
                  {isSubmitting ? 'SAVING...' : createModalOpen ? 'SCHEDULE TEST' : 'SAVE CHANGES'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && selectedTest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl ticket-pass bg-slate-950 border-rose-500/40 p-6 shadow-2xl">
            <h3 className="text-sm font-bold text-white uppercase tag-mono mb-2">Delete Test</h3>
            <p className="text-xs text-slate-400 mb-5 leading-relaxed">
              Are you sure you want to delete test <strong>"{selectedTest.title}"</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 tag-mono text-xs font-bold text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-xl transition cursor-pointer"
              >
                CANCEL
              </button>
              <button
                onClick={handleDeleteTest}
                disabled={isSubmitting}
                className="px-4 py-2 tag-mono text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-md disabled:opacity-50 transition cursor-pointer"
              >
                {isSubmitting ? 'DELETING...' : 'DELETE TEST'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
