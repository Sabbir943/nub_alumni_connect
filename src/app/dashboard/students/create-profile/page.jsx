'use client';

import { useState, useEffect, useRef } from 'react';
import { authClient } from '@/lib/auth-client';
import { apiFetch } from '@/lib/api';
import { uploadImage } from '@/lib/upload';
import toast, { Toaster } from 'react-hot-toast';
import {
  FaUser,
  FaEnvelope,
  FaIdCard,
  FaGraduationCap,
  FaPhone,
  FaGithub,
  FaLinkedin,
  FaCode,
  FaImage,
  FaCheckCircle,
  FaExclamationCircle,
  FaMapMarkerAlt,
  FaSave,
  FaSpinner,
  FaCamera,
  FaShieldAlt,
  FaSyncAlt,
  FaTimes,
  FaEdit,
} from 'react-icons/fa';

function VerificationBadgeInline({ verification }) {
  if (!verification) {
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-zinc-100 text-zinc-500 text-xs font-semibold border border-zinc-200">
        <FaShieldAlt className="w-3.5 h-3.5" />
        Not Verified
      </span>
    );
  }
  const { badge, trustScore, breakdown, analysis, linkValidation } = verification;
  const colors = {
    Verified: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', bar: 'bg-emerald-500' },
    Unverified: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', bar: 'bg-amber-500' },
    Suspicious: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', bar: 'bg-red-500' },
  };
  const c = colors[badge] || colors.Unverified;

  return (
    <div className={`p-4 rounded-xl border ${c.border} ${c.bg}`}>
      <div className="flex items-center gap-2 mb-2">
        <FaShieldAlt className={`w-4 h-4 ${c.text}`} />
        <span className={`text-sm font-bold ${c.text}`}>{badge} ({trustScore}%)</span>
      </div>
      <div className="w-full h-2 bg-white/60 rounded-full overflow-hidden mb-2">
        <div className={`h-full ${c.bar} rounded-full`} style={{ width: `${trustScore}%` }} />
      </div>

      {linkValidation && linkValidation.length > 0 && (
        <div className="mb-3 p-3 bg-white rounded-lg border border-zinc-100">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Link Status</p>
          <div className="space-y-1.5">
            {linkValidation.map((link, i) => (
              <div key={i} className="flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-1.5">
                  {link.valid ? (
                    <span className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center">
                      <FaCheckCircle className="w-2.5 h-2.5 text-emerald-600" />
                    </span>
                  ) : link.url ? (
                    <span className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center">
                      <FaExclamationCircle className="w-2.5 h-2.5 text-red-600" />
                    </span>
                  ) : (
                    <span className="w-4 h-4 rounded-full bg-zinc-100 flex items-center justify-center">
                      <FaExclamationCircle className="w-2.5 h-2.5 text-zinc-400" />
                    </span>
                  )}
                  <span className="font-semibold text-zinc-600">{link.label}</span>
                </div>
                <span className={`font-medium ${link.valid ? 'text-emerald-600' : link.url ? 'text-red-600' : 'text-zinc-400'}`}>
                  {link.valid ? 'Valid' : link.url ? `Error ${link.status || ''}` : 'Not provided'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {breakdown && (
        <div className="grid grid-cols-2 gap-1 mb-2">
          {Object.entries(breakdown).map(([key, val]) => (
            <div key={key} className="flex justify-between text-[10px] text-zinc-600">
              <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
              <span className="font-semibold">{val}/25</span>
            </div>
          ))}
        </div>
      )}
      {analysis && <p className="text-xs text-zinc-600 mt-1">{analysis}</p>}
    </div>
  );
}

const DEPARTMENT_OPTIONS = [
  { value: 'CSE', label: 'Computer Science & Engineering' },
  { value: 'EEE', label: 'Electrical & Electronic Engineering' },
  { value: 'BBA', label: 'Business Administration' },
  { value: 'English', label: 'English' },
  { value: 'MBA', label: 'MBA' },
];

const INITIAL_FORM = {
  fullName: '',
  email: '',
  studentId: '',
  department: '',
  semester: '',
  batch: '',
  phone: '',
  profilePictureUrl: '',
  githubUrl: '',
  linkedinUrl: '',
  skills: '',
  bio: '',
  location: '',
};

function fieldClass(extra = '') {
  return `w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none dark:text-white transition-all ${extra}`;
}

export default function StudentProfileForm() {
  const { data: session, isPending: sessionLoading } = authClient.useSession();
  const userEmail = session?.user?.email;
  const userName = session?.user?.name;

  const [view, setView] = useState('loading');
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [isExisting, setIsExisting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [reverifyLoading, setReverifyLoading] = useState(false);

  useEffect(() => {
    if (sessionLoading || !userEmail) return;
    let cancelled = false;
    async function load() {
      try {
        const data = await apiFetch(`/api/students/check/${encodeURIComponent(userEmail)}`);
        if (cancelled) return;
        if (data.exists && data.profile) {
          setFormData((prev) => ({ ...prev, ...data.profile, email: userEmail }));
          setIsExisting(true);
          setView('view');
        } else {
          setFormData((prev) => ({ ...prev, email: userEmail }));
          setView('create');
        }
      } catch {
        setFormData((prev) => ({ ...prev, email: userEmail }));
        setView('create');
      }
    }
    load();
    return () => { cancelled = true; };
  }, [userEmail, sessionLoading]);

  useEffect(() => {
    if (!sessionLoading && !userEmail) setView('not-signed-in');
  }, [sessionLoading, userEmail]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB.');
      return;
    }
    setUploading(true);
    try {
      const url = await uploadImage(file);
      setFormData((prev) => ({ ...prev, profilePictureUrl: url }));
      toast.success('Image uploaded!');
    } catch (err) {
      toast.error(err.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setFormData((prev) => ({ ...prev, profilePictureUrl: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.profilePictureUrl) {
      toast.error('Profile photo is required.');
      return;
    }
    setLoading(true);

    const endpoint = isExisting
      ? `/api/students/${encodeURIComponent(formData.email)}`
      : `/api/students`;
    const method = isExisting ? 'PATCH' : 'POST';

    try {
      const data = await apiFetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (data.profile) {
        setFormData((prev) => ({ ...prev, ...data.profile }));
      }

      setIsExisting(true);
      toast.success(isExisting ? 'Profile updated!' : 'Profile created!');
      setView('view');
    } catch (err) {
      toast.error(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReverify = async () => {
    if (!isExisting) return;
    setReverifyLoading(true);
    try {
      const data = await apiFetch('/api/verify-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: { ...formData, email: userEmail, fullName: userName }, type: 'student' }),
      });
      if (data.verification) {
        setFormData((prev) => ({ ...prev, verification: data.verification }));
      }
      toast.success('Profile re-verified!');
    } catch {
      toast.error('Verification failed.');
    } finally {
      setReverifyLoading(false);
    }
  };

  if (view === 'loading' || sessionLoading) {
    return (
      <div className="flex flex-col justify-center items-center py-20 gap-4">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600"></div>
          <div className="absolute inset-0 animate-spin rounded-full h-12 w-12 border-4 border-transparent border-b-purple-500" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
        </div>
        <p className="text-sm text-gray-500 font-medium">Loading your profile...</p>
      </div>
    );
  }

  if (view === 'not-signed-in') {
    return (
      <div className="max-w-2xl mx-auto my-8 p-8 sm:p-12 text-center bg-white rounded-3xl shadow-xl border border-gray-100">
        <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-6">
          <FaUser className="w-10 h-10 text-indigo-400" />
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Sign In Required</h3>
        <p className="text-gray-500 text-sm">Please sign in to create your student profile.</p>
      </div>
    );
  }

  if (view === 'view') {
    return (
      <div className="max-w-2xl mx-auto">
        <Toaster position="top-center" />
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-5 sm:p-8 text-center">
          <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-5">
            <FaCheckCircle className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
            Profile is Live
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 max-w-sm mx-auto">
            Your student profile has been saved successfully. You can update it
            anytime.
          </p>

          <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800">
            {formData.profilePictureUrl && (
              <img
                src={formData.profilePictureUrl}
                alt={userName}
                className="w-20 h-20 rounded-full object-cover mx-auto mb-4 border-2 border-indigo-500"
                onError={(e) => (e.target.style.display = 'none')}
              />
            )}

            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
              {formData.fullName || userName}
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {formData.studentId && `ID: ${formData.studentId}`}
            </p>

            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {formData.department && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  <FaGraduationCap className="w-3 h-3" />
                  {DEPARTMENT_OPTIONS.find((d) => d.value === formData.department)?.label || formData.department}
                </span>
              )}
              {formData.semester && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  {formData.semester}
                </span>
              )}
              {formData.batch && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  Batch {formData.batch}
                </span>
              )}
              {formData.location && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  <FaMapMarkerAlt className="w-3 h-3" />
                  {formData.location}
                </span>
              )}
            </div>

            {formData.skills && (
              <div className="flex flex-wrap justify-center gap-1.5 mt-3">
                {formData.skills.split(',').map((s, i) => s.trim() && (
                  <span key={i} className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-100 dark:bg-indigo-950/30 dark:text-indigo-300 dark:border-indigo-800">
                    {s.trim()}
                  </span>
                ))}
              </div>
            )}

            {formData.bio && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-3 max-w-md mx-auto">
                {formData.bio}
              </p>
            )}

            <div className="flex flex-wrap justify-center gap-3 mt-3">
              {formData.githubUrl && (
                <a href={formData.githubUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-indigo-600 transition-colors">
                  <FaGithub className="w-3.5 h-3.5" /> GitHub
                </a>
              )}
              {formData.linkedinUrl && (
                <a href={formData.linkedinUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-indigo-600 transition-colors">
                  <FaLinkedin className="w-3.5 h-3.5" /> LinkedIn
                </a>
              )}
            </div>

            <div className="mt-4">
              <VerificationBadgeInline verification={formData.verification} />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => setView('edit')}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors"
            >
              <FaEdit className="w-4 h-4" /> Edit Profile
            </button>
            <button
              onClick={handleReverify}
              disabled={reverifyLoading}
              className="inline-flex items-center gap-2 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-sm font-semibold px-6 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 transition-colors disabled:opacity-50"
            >
              {reverifyLoading ? (
                <FaSpinner className="w-4 h-4 animate-spin" />
              ) : (
                <FaSyncAlt className="w-4 h-4" />
              )}
              Re-verify
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isEdit = view === 'edit';

  return (
    <div className="max-w-3xl mx-auto">
      <Toaster position="top-center" />

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="px-6 md:px-8 py-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-white">
              {isEdit ? 'Edit Student Profile' : 'Create Student Profile'}
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
              {isEdit
                ? 'Update your academic details.'
                : 'Fill in your details to appear in the student directory.'}
            </p>
          </div>
          {isEdit && (
            <button
              onClick={() => setView('view')}
              className="text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-white underline"
            >
              Cancel
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
          {/* Profile Picture */}
          <div className="flex flex-col sm:flex-row items-center gap-4 bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60">
            <div className="w-20 h-20 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center overflow-hidden border-2 border-indigo-500 shrink-0">
              {formData.profilePictureUrl ? (
                <img
                  src={formData.profilePictureUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.src = ''; e.target.style.display = 'none'; }}
                />
              ) : (
                <FaUser className="w-8 h-8 text-zinc-400" />
              )}
            </div>
            <div className="space-y-1.5 w-full text-center sm:text-left">
              <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                Profile Photo <span className="text-red-500">*</span>
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Choose a photo from your computer
              </p>
              {formData.profilePictureUrl ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-500 truncate max-w-[200px]">Photo selected</span>
                  <button type="button" onClick={handleRemoveImage} className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors">
                    <FaTimes className="w-3.5 h-3.5 text-zinc-400" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl text-sm hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors"
                >
                  <FaCamera className="w-4 h-4 text-zinc-400" />
                  <span className="text-zinc-500 dark:text-zinc-400">
                    {uploading ? 'Uploading...' : 'Browse Photo'}
                  </span>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Full Name *</label>
              <div className="relative">
                <FaUser className="absolute left-3.5 top-3 text-zinc-400 w-4 h-4" />
                <input
                  type="text"
                  name="fullName"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className={fieldClass()}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Email *</label>
              <div className="relative">
                <FaEnvelope className="absolute left-3.5 top-3 text-zinc-400 w-4 h-4" />
                <input
                  type="email"
                  name="email"
                  required
                  disabled
                  value={formData.email}
                  className={fieldClass('bg-zinc-100 dark:bg-zinc-800/50 text-zinc-500 cursor-not-allowed')}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Student ID *</label>
              <div className="relative">
                <FaIdCard className="absolute left-3.5 top-3 text-zinc-400 w-4 h-4" />
                <input
                  type="text"
                  name="studentId"
                  required
                  value={formData.studentId}
                  onChange={handleChange}
                  placeholder="e.g. 011201001"
                  className={fieldClass()}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Department *</label>
              <div className="relative">
                <FaGraduationCap className="absolute left-3.5 top-3 text-zinc-400 w-4 h-4" />
                <select
                  name="department"
                  required
                  value={formData.department}
                  onChange={handleChange}
                  className={`${fieldClass()} appearance-none cursor-pointer`}
                >
                  <option value="">Select Department</option>
                  {DEPARTMENT_OPTIONS.map((d) => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Semester / Year *</label>
              <input
                type="text"
                name="semester"
                required
                value={formData.semester}
                onChange={handleChange}
                placeholder="e.g. 8th Semester"
                className="w-full px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none dark:text-white transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Batch *</label>
              <input
                type="text"
                name="batch"
                required
                value={formData.batch}
                onChange={handleChange}
                placeholder="e.g. 211"
                className="w-full px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none dark:text-white transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Phone *</label>
              <div className="relative">
                <FaPhone className="absolute left-3.5 top-3 text-zinc-400 w-4 h-4" />
                <input
                  type="text"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+8801700000000"
                  className={fieldClass()}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Location *</label>
              <div className="relative">
                <FaMapMarkerAlt className="absolute left-3.5 top-3 text-zinc-400 w-4 h-4" />
                <input
                  type="text"
                  name="location"
                  required
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g. Dhaka, Bangladesh"
                  className={fieldClass()}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">GitHub</label>
              <div className="relative">
                <FaGithub className="absolute left-3.5 top-3 text-zinc-400 w-4 h-4" />
                <input
                  type="url"
                  name="githubUrl"
                  value={formData.githubUrl}
                  onChange={handleChange}
                  placeholder="https://github.com/username"
                  className={fieldClass()}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">LinkedIn</label>
              <div className="relative">
                <FaLinkedin className="absolute left-3.5 top-3 text-zinc-400 w-4 h-4" />
                <input
                  type="url"
                  name="linkedinUrl"
                  value={formData.linkedinUrl}
                  onChange={handleChange}
                  placeholder="https://linkedin.com/in/username"
                  className={fieldClass()}
                />
              </div>
            </div>
          </div>

          {/* Skills */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Skills (Comma separated) *</label>
            <div className="relative">
              <FaCode className="absolute left-3.5 top-3 text-zinc-400 w-4 h-4" />
              <input
                type="text"
                name="skills"
                required
                value={formData.skills}
                onChange={handleChange}
                placeholder="React, Next.js, Node.js, Tailwind CSS"
                className={fieldClass()}
              />
            </div>
            {formData.skills && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {formData.skills.split(',').map((s, i) => s.trim() && (
                  <span key={i} className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-100 dark:bg-indigo-950/30 dark:text-indigo-300 dark:border-indigo-800">
                    {s.trim()}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Bio */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Bio / About *</label>
            <textarea
              name="bio"
              rows={3}
              required
              value={formData.bio}
              onChange={handleChange}
              placeholder="Write a brief summary about your background, interests, and goals..."
              className="w-full px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none dark:text-white resize-none transition-all"
            />
          </div>

          {/* Submit */}
          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-8 py-3 rounded-xl transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <FaSpinner className="w-4 h-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <FaSave className="w-4 h-4" />
                  {isEdit ? 'Save Changes' : 'Publish Profile'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
