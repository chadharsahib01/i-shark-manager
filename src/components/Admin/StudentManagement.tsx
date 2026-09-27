import React, { useEffect, useState } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Edit2,
  Phone,
  Mail,
  BookOpen,
  Hash,
  AlertCircle,
  Check,
  X,
  Sparkles,
  Barcode,
  Eye,
  EyeOff,
  FileText,
  Trash2
} from 'lucide-react';
import { UserProfile } from '../../types';
import {
  getAllStudents,
  updateStudentProfile,
  toggleStudentStatus,
  deleteStudent
} from '../../services/firestoreService';
import { useAuth } from '../../context/AuthContext';
import { StudentReportModal } from '../StudentReportModal';

export const StudentManagement: React.FC = () => {
  const { createStudentAccount, resetPassword } = useAuth();

  const [students, setStudents] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [batchFilter, setBatchFilter] = useState<string>('all');

  // Modal states
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<UserProfile | null>(null);
  const [reportModalStudentId, setReportModalStudentId] = useState<string | null>(null);
  const [deleteStudentTarget, setDeleteStudentTarget] = useState<UserProfile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [resetPasswordSent, setResetPasswordSent] = useState(false);

  // Form states for Add Student
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [newRollNumber, setNewRollNumber] = useState('');
  const [newBatch, setNewBatch] = useState('Batch A - Computer Science');
  const [newPhone, setNewPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 10; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(result);
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const data = await getAllStudents();
      setStudents(data);
    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (newPassword.length < 8) {
      setFormError('Initial password must be at least 8 characters long.');
      return;
    }

    setIsSubmitting(true);

    try {
      const created = await createStudentAccount(
        newEmail,
        newPassword,
        newFullName,
        newRollNumber,
        newBatch,
        newPhone
      );

      setStudents((prev) => [...prev, created]);
      setSuccessMessage(`Successfully enrolled ${newFullName} (Auth credentials + profile generated).`);
      setTimeout(() => setSuccessMessage(null), 4000);

      // Reset form
      setNewFullName('');
      setNewEmail('');
      setNewPassword('');
      setNewRollNumber('');
      setNewPhone('');
      setAddModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to provision student account. Verify email uniqueness.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    setIsSubmitting(true);
    setFormError(null);

    try {
      await updateStudentProfile(selectedStudent.id, {
        fullName: selectedStudent.fullName,
        rollNumber: selectedStudent.rollNumber,
        batch: selectedStudent.batch,
        phone: selectedStudent.phone,
        isActive: selectedStudent.isActive
      });

      setStudents((prev) =>
        prev.map((s) => (s.id === selectedStudent.id ? selectedStudent : s))
      );

      setSuccessMessage(`Updated profile record for ${selectedStudent.fullName}.`);
      setTimeout(() => setSuccessMessage(null), 4000);
      setEditModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to update student profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (student: UserProfile) => {
    const nextStatus = !student.isActive;
    try {
      await toggleStudentStatus(student.id, nextStatus);
      setStudents((prev) =>
        prev.map((s) => (s.id === student.id ? { ...s, isActive: nextStatus } : s))
      );
      setSuccessMessage(
        `${student.fullName} has been ${nextStatus ? 'reactivated' : 'deactivated'}.`
      );
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      alert(`Could not change status: ${err.message}`);
    }
  };

  const handleDeleteStudent = async () => {
    if (!deleteStudentTarget) return;
    setIsDeleting(true);
    try {
      await deleteStudent(deleteStudentTarget.id);
      setStudents((prev) => prev.filter((s) => s.id !== deleteStudentTarget.id));
      setSuccessMessage(`Student ${deleteStudentTarget.fullName} has been removed from database.`);
      setDeleteStudentTarget(null);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      alert(`Failed to delete student: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSendPasswordReset = async (email: string) => {
    try {
      await resetPassword(email);
      setResetPasswordSent(true);
      setTimeout(() => setResetPasswordSent(false), 4000);
    } catch (err: any) {
      alert(`Could not send password reset email: ${err.message}`);
    }
  };

  const batches = Array.from(new Set(students.map((s) => s.batch).filter(Boolean))) as string[];

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.rollNumber && s.rollNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.batch && s.batch.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'active'
        ? s.isActive
        : !s.isActive;

    const matchesBatch = batchFilter === 'all' || s.batch === batchFilter;

    return matchesSearch && matchesStatus && matchesBatch;
  });

  const activeCount = students.filter((s) => s.isActive).length;
  const inactiveCount = students.length - activeCount;

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="ticket-pass p-5 sm:p-6 bg-slate-900/90 border-violet-500/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-1.5">
              <span className="tag-mono px-2 py-0.5 rounded bg-violet-500/10 text-violet-300 border border-violet-500/30 flex items-center space-x-1 font-bold">
                <Sparkles className="w-3 h-3 text-violet-400" />
                <span>STUDENT DIRECTORY // ACADEMIC</span>
              </span>
              <span className="tag-mono text-[9px] text-slate-500">RECORDS</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight flex items-center space-x-2">
              <Users className="w-6 h-6 text-violet-400" />
              <span>Student Directory</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Manage student profiles, enrollment, roll numbers, batches, and account status.
            </p>
          </div>

          <button
            onClick={() => {
              setFormError(null);
              setAddModalOpen(true);
            }}
            id="btn-add-student"
            className="glow-orb-btn px-4 py-2.5 text-xs font-bold text-white bg-violet-600 hover:bg-violet-500 border border-violet-400/40 flex items-center space-x-2 cursor-pointer shrink-0 shadow-lg shadow-violet-900/40"
          >
            <UserPlus className="w-4 h-4" />
            <span className="uppercase">Add Student</span>
          </button>
        </div>
      </div>

      {/* Success Notification Toast */}
      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-300 flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-mono font-bold">{successMessage}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="ticket-pass p-4 bg-slate-900/90 border-violet-500/20 flex flex-col md:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative w-full md:flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, roll number, email, batch..."
            className="w-full pl-10 pr-3.5 py-2 text-xs font-mono rounded-xl border border-slate-700 bg-slate-950 text-slate-100 placeholder:text-slate-500 focus:border-violet-500 outline-hidden"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-violet-400 shrink-0 hidden sm:block" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="py-2 px-3 text-xs tag-mono font-bold rounded-xl border border-slate-700 bg-slate-950 text-slate-200 outline-hidden w-full md:w-auto focus:border-violet-500"
          >
            <option value="all">ALL STUDENTS ({students.length})</option>
            <option value="active">ACTIVE ({activeCount})</option>
            <option value="inactive">INACTIVE ({inactiveCount})</option>
          </select>

          {/* Batch Filter */}
          {batches.length > 0 && (
            <select
              value={batchFilter}
              onChange={(e) => setBatchFilter(e.target.value)}
              className="py-2 px-3 text-xs tag-mono font-bold rounded-xl border border-slate-700 bg-slate-950 text-slate-200 outline-hidden w-full md:w-auto focus:border-violet-500"
            >
              <option value="all">ALL BATCHES</option>
              {batches.map((b) => (
                <option key={b} value={b}>
                  {b.toUpperCase()}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Student List View: Academic Pass Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-3xl ticket-pass bg-slate-900/90 border-slate-800 text-slate-400">
          <Users className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-white uppercase tag-mono">No Students Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchQuery || statusFilter !== 'all'
              ? 'Try modifying search criteria or status filter.'
              : 'Add your first student to begin tracking records.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
          {filteredStudents.map((student) => (
            <div
              key={student.id}
              className={`ticket-pass p-0 bg-slate-950 border-violet-500/30 flex flex-col justify-between transition-all duration-300 relative ${
                student.isActive
                  ? 'hover:border-violet-500/60 shadow-xl'
                  : 'opacity-60 grayscale-[40%]'
              }`}
            >
              {/* Top Main Section */}
              <div className="p-5 relative">
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-black text-white uppercase tracking-tight truncate">
                      {student.fullName}
                    </h3>
                    <div className="flex items-center space-x-1.5 tag-mono text-[10px] text-slate-400 mt-0.5">
                      <Mail className="w-3 h-3 text-violet-400 shrink-0" />
                      <span className="truncate max-w-[170px]">{student.email}</span>
                    </div>
                  </div>

                  <span
                    className={`tag-mono shrink-0 px-2.5 py-0.5 rounded-full text-[9px] font-bold flex items-center space-x-1 ${
                      student.isActive
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {student.isActive ? (
                      <>
                        <Check className="w-3 h-3" />
                        <span>ACTIVE</span>
                      </>
                    ) : (
                      <>
                        <X className="w-3 h-3" />
                        <span>INACTIVE</span>
                      </>
                    )}
                  </span>
                </div>

                {/* Details Matrix */}
                <div className="pt-3 border-t border-slate-800 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="tag-mono text-[9px] text-slate-500 flex items-center space-x-1">
                      <Hash className="w-3 h-3 text-violet-400" />
                      <span>ROLL NUMBER:</span>
                    </span>
                    <span className="font-mono font-bold text-slate-200">
                      {student.rollNumber || 'UNASSIGNED'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="tag-mono text-[9px] text-slate-500 flex items-center space-x-1">
                      <BookOpen className="w-3 h-3 text-rose-400" />
                      <span>BATCH:</span>
                    </span>
                    <span className="font-mono font-bold text-slate-200 truncate max-w-[160px]">
                      {student.batch || 'ICT-CORE'}
                    </span>
                  </div>

                  {student.phone && (
                    <div className="flex items-center justify-between">
                      <span className="tag-mono text-[9px] text-slate-500 flex items-center space-x-1">
                        <Phone className="w-3 h-3 text-emerald-400" />
                        <span>PHONE:</span>
                      </span>
                      <span className="font-mono text-slate-300">{student.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Perforation Divider Notches */}
              <div className="ticket-perforation-divider bg-slate-950">
                <div className="ticket-notch-left" />
                <div className="ticket-dashed-line" />
                <div className="ticket-notch-right" />
              </div>

              {/* Bottom Section & Action Controls */}
              <div className="p-3.5 sm:p-4 bg-slate-900/80 flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex items-center space-x-2 shrink-0">
                  <div className="ticket-barcode-graphic text-slate-400 w-12 sm:w-16 shrink-0" />
                  <span className="tag-mono text-[8px] sm:text-[9px] text-slate-400 font-bold truncate">
                    ID #{student.id.slice(0, 6)}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 justify-end flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => setReportModalStudentId(student.id)}
                    className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-violet-600/20 hover:bg-violet-600 text-violet-300 hover:text-white border border-violet-500/30 transition btn-tactile text-xs flex items-center space-x-1 cursor-pointer shrink-0 font-bold shadow-xs"
                    title="View Single Student Academic Report"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span className="tag-mono text-[10px] font-bold">REPORT</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedStudent({ ...student });
                      setFormError(null);
                      setEditModalOpen(true);
                    }}
                    className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition btn-tactile text-xs flex items-center space-x-1 cursor-pointer shrink-0 font-bold shadow-xs"
                    title="Edit Student Record"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-violet-400" />
                    <span className="tag-mono text-[10px] font-bold">EDIT</span>
                  </button>

                  <button
                    onClick={() => handleToggleStatus(student)}
                    className={`px-2 py-1.5 rounded-lg tag-mono text-[10px] font-bold border transition btn-tactile cursor-pointer shrink-0 ${
                      student.isActive
                        ? 'bg-rose-500/10 text-rose-300 border-rose-500/30 hover:bg-rose-500/20'
                        : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                    }`}
                    title={student.isActive ? 'Deactivate student account' : 'Activate student account'}
                  >
                    {student.isActive ? 'DEACTIVATE' : 'ACTIVATE'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeleteStudentTarget(student)}
                    className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/30 transition btn-tactile text-xs cursor-pointer shrink-0"
                    title="Delete Student Record"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Student Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-2xl ticket-pass bg-slate-950 border-violet-500/40 p-6 sm:p-7 shadow-2xl max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setAddModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-5">
              <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-white uppercase tag-mono">Add Student</h2>
                <p className="tag-mono text-[10px] text-slate-400">
                  Creates login credentials and a student profile in the directory.
                </p>
              </div>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-xs text-rose-300 flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span className="font-mono">{formError}</span>
              </div>
            )}

            <form onSubmit={handleAddStudent} className="space-y-4">
              <div>
                <label className="block tag-mono text-[10px] text-slate-400 mb-1">
                  FULL NAME *
                </label>
                <div className="inset-field">
                  <input
                    type="text"
                    required
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    placeholder="e.g. Jordan Miller"
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block tag-mono text-[10px] text-slate-400 mb-1">
                    EMAIL ADDRESS (LOGIN) *
                  </label>
                  <div className="inset-field">
                    <input
                      type="email"
                      required
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="jordan@ishark.edu"
                      className="text-xs"
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="tag-mono text-[10px] text-slate-400">
                      PASSWORD *
                    </label>
                    <button
                      type="button"
                      onClick={generateRandomPassword}
                      className="tag-mono text-[9px] text-violet-400 hover:text-violet-300 font-bold px-2 py-0.5 rounded bg-violet-500/10 border border-violet-500/30 flex items-center space-x-1 cursor-pointer transition hover:bg-violet-500/20"
                    >
                      <Sparkles className="w-2.5 h-2.5 text-violet-400" />
                      <span>GENERATE</span>
                    </button>
                  </div>
                  <div className="inset-field relative flex items-center">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 8 characters"
                      className="text-xs w-full pr-8"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 text-slate-400 hover:text-slate-200 p-0.5 cursor-pointer transition"
                      title={showPassword ? 'Hide password' : 'Show password'}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block tag-mono text-[10px] text-slate-400 mb-1">
                    ROLL NUMBER
                  </label>
                  <div className="inset-field">
                    <input
                      type="text"
                      value={newRollNumber}
                      onChange={(e) => setNewRollNumber(e.target.value)}
                      placeholder="e.g. CS-2026-035"
                      className="text-xs"
                    />
                  </div>
                </div>
                <div>
                  <label className="block tag-mono text-[10px] text-slate-400 mb-1">
                    BATCH / CLASS
                  </label>
                  <div className="inset-field">
                    <input
                      type="text"
                      value={newBatch}
                      onChange={(e) => setNewBatch(e.target.value)}
                      placeholder="e.g. Batch A - CS"
                      className="text-xs"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block tag-mono text-[10px] text-slate-400 mb-1">
                  PHONE NUMBER (OPTIONAL)
                </label>
                <div className="inset-field">
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl tag-mono text-xs font-bold text-slate-400 hover:text-white bg-slate-900 border border-slate-800 transition cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="glow-orb-btn px-5 py-2 text-xs font-bold text-white bg-violet-600 hover:bg-violet-500 border border-violet-400/40 disabled:opacity-50 transition cursor-pointer uppercase shadow-lg shadow-violet-900/40"
                >
                  {isSubmitting ? 'ADDING STUDENT...' : 'ADD STUDENT'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {editModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-2xl ticket-pass bg-slate-950 border-violet-500/40 p-6 sm:p-7 shadow-2xl max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setEditModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-base font-black text-white uppercase tag-mono mb-1">
              Edit Student: {selectedStudent.fullName}
            </h2>
            <p className="tag-mono text-[10px] text-slate-400 mb-4">
              Update student details. Email ({selectedStudent.email}) is used for logging into the portal.
            </p>

            <form onSubmit={handleEditStudent} className="space-y-4">
              <div>
                <label className="block tag-mono text-[10px] text-slate-400 mb-1">
                  FULL NAME
                </label>
                <div className="inset-field">
                  <input
                    type="text"
                    required
                    value={selectedStudent.fullName}
                    onChange={(e) =>
                      setSelectedStudent({ ...selectedStudent, fullName: e.target.value })
                    }
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block tag-mono text-[10px] text-slate-400 mb-1">
                    ROLL NUMBER
                  </label>
                  <div className="inset-field">
                    <input
                      type="text"
                      value={selectedStudent.rollNumber || ''}
                      onChange={(e) =>
                        setSelectedStudent({ ...selectedStudent, rollNumber: e.target.value })
                      }
                      className="text-xs"
                    />
                  </div>
                </div>
                <div>
                  <label className="block tag-mono text-[10px] text-slate-400 mb-1">
                    BATCH / CLASS
                  </label>
                  <div className="inset-field">
                    <input
                      type="text"
                      value={selectedStudent.batch || ''}
                      onChange={(e) =>
                        setSelectedStudent({ ...selectedStudent, batch: e.target.value })
                      }
                      className="text-xs"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block tag-mono text-[10px] text-slate-400 mb-1">
                  PHONE NUMBER
                </label>
                <div className="inset-field">
                  <input
                    type="text"
                    value={selectedStudent.phone || ''}
                    onChange={(e) =>
                      setSelectedStudent({ ...selectedStudent, phone: e.target.value })
                    }
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="student-active-check"
                  checked={selectedStudent.isActive}
                  onChange={(e) =>
                    setSelectedStudent({ ...selectedStudent, isActive: e.target.checked })
                  }
                  className="rounded border-slate-700 bg-slate-900 text-violet-600 focus:ring-violet-500"
                />
                <label htmlFor="student-active-check" className="tag-mono text-xs text-slate-300">
                  ACTIVE STUDENT (INCLUDED IN DAILY ATTENDANCE)
                </label>
              </div>

              {/* Password Reset Action */}
              <div className="pt-2 pb-1 border-t border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="tag-mono text-[10px] text-slate-400 block">ACCOUNT LOGIN</span>
                  <span className="text-xs text-slate-300 font-mono">{selectedStudent.email}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleSendPasswordReset(selectedStudent.email)}
                  className="px-3 py-1.5 rounded-lg tag-mono text-[10px] font-bold text-violet-300 hover:text-white bg-violet-950/40 hover:bg-violet-900/60 border border-violet-700/50 transition cursor-pointer"
                >
                  {resetPasswordSent ? 'LINK SENT!' : 'SEND PASSWORD RESET'}
                </button>
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl tag-mono text-xs font-bold text-slate-400 hover:text-white bg-slate-900 border border-slate-800 transition cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="glow-orb-btn px-5 py-2 text-xs font-bold text-white bg-violet-600 hover:bg-violet-500 border border-violet-400/40 disabled:opacity-50 transition cursor-pointer uppercase shadow-lg shadow-violet-900/40"
                >
                  {isSubmitting ? 'SAVING...' : 'SAVE CHANGES'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Student Confirmation Dialog */}
      {deleteStudentTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl bg-slate-950 border border-rose-500/40 p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-rose-400">
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Student</h3>
                <span className="tag-mono text-[10px] text-rose-400 font-bold">PERMANENT DELETION</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              Are you sure you want to permanently delete{' '}
              <strong className="text-white font-mono">{deleteStudentTarget.fullName}</strong> ({deleteStudentTarget.email})
              from the student directory? This action cannot be undone.
            </p>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteStudentTarget(null)}
                className="px-4 py-2 rounded-xl tag-mono text-xs font-bold text-slate-400 hover:text-white bg-slate-900 border border-slate-800 transition cursor-pointer"
              >
                CANCEL
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteStudent}
                className="px-4 py-2 rounded-xl tag-mono text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 border border-rose-400/40 transition cursor-pointer shadow-lg shadow-rose-900/40"
              >
                {isDeleting ? 'DELETING...' : 'CONFIRM DELETE'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Single Student Report Modal */}
      {reportModalStudentId && (
        <StudentReportModal
          studentId={reportModalStudentId}
          onClose={() => setReportModalStudentId(null)}
        />
      )}
    </div>
  );
};
