'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { authClient } from '@/lib/auth-client';
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
  FaCamera
} from 'react-icons/fa';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.4, ease: 'easeOut' },
  }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 25 } },
};

export default function StudentProfileForm() {
  const { data: session, isPending: sessionLoading } = authClient.useSession();
  const userEmail = session?.user?.email;

  const [formData, setFormData] = useState({
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
    location: ''
  });

  const [isExisting, setIsExisting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasLoadedProfile, setHasLoadedProfile] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  useEffect(() => {
    if (sessionLoading || !userEmail) return undefined;
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/students/check/${encodeURIComponent(userEmail)}`);
        const data = await res.json();
        if (cancelled) return;
        if (data.exists && data.profile) {
          setIsExisting(true);
          setFormData({
            fullName: data.profile.fullName || '',
            email: userEmail,
            studentId: data.profile.studentId || '',
            department: data.profile.department || '',
            semester: data.profile.semester || '',
            batch: data.profile.batch || '',
            phone: data.profile.phone || '',
            profilePictureUrl: data.profile.profilePictureUrl || '',
            githubUrl: data.profile.githubUrl || '',
            linkedinUrl: data.profile.linkedinUrl || '',
            skills: data.profile.skills || '',
            bio: data.profile.bio || '',
            location: data.profile.location || ''
          });
        } else {
          setFormData((prev) => ({ ...prev, email: userEmail }));
        }
      } catch (err) {
        console.error('Failed to fetch student data:', err);
      } finally {
        if (!cancelled) setHasLoadedProfile(true);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [userEmail, sessionLoading]);

  const isLoading = sessionLoading || (!hasLoadedProfile && !!userEmail);
  const isNotSignedIn = !sessionLoading && !userEmail;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', message: '' });

    const endpoint = isExisting
      ? `${API_BASE_URL}/api/students/${encodeURIComponent(formData.email)}`
      : `${API_BASE_URL}/api/students`;

    const method = isExisting ? 'PATCH' : 'POST';

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (res.ok) {
        setIsExisting(true);
        setStatus({
          type: 'success',
          message: isExisting ? 'Profile updated successfully!' : 'Profile created successfully!'
        });
      } else {
        setStatus({
          type: 'error',
          message: data.message || 'Error processing request.'
        });
      }
    } catch (err) {
      setStatus({
        type: 'error',
        message: 'Server connection failed. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
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

  if (isNotSignedIn) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto my-8 p-12 text-center bg-white rounded-3xl shadow-xl border border-gray-100"
      >
        <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-6">
          <FaUser className="w-10 h-10 text-indigo-400" />
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Sign In Required</h3>
        <p className="text-gray-500 text-sm">Please sign in to create your student profile.</p>
      </motion.div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto my-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold tracking-wide uppercase mb-4">
          <FaGraduationCap className="w-3.5 h-3.5" />
          Student Profile
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          {isExisting ? 'Update Your' : 'Create Your'}{' '}
          <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Profile
          </span>
        </h1>
        <p className="mt-2 text-gray-500 text-sm max-w-lg mx-auto">
          {isExisting
            ? 'Modify your academic information and keep your profile up to date.'
            : 'Fill out your profile details to appear in the student directory.'}
        </p>
      </motion.div>

      {/* Status Alert */}
      <AnimatePresence>
        {status.message && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className={`p-4 mb-6 rounded-2xl flex items-center gap-3 text-sm font-medium shadow-sm ${
              status.type === 'success'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}
          >
            {status.type === 'success' ? <FaCheckCircle size={18} /> : <FaExclamationCircle size={18} />}
            {status.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form Card */}
      <motion.form
        variants={scaleIn}
        initial="hidden"
        animate="visible"
        onSubmit={handleSubmit}
        className="bg-white border border-gray-100 rounded-3xl shadow-xl shadow-gray-200/50 overflow-hidden"
      >
        {/* Profile Picture Preview */}
        <div className="relative h-32 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.15),transparent)]" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-white/10" />
          <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/5" />
        </div>

        <div className="px-8 pb-8 -mt-14">
          <div className="relative w-28 h-28 mx-auto mb-6">
            {formData.profilePictureUrl ? (
              <img
                src={formData.profilePictureUrl}
                alt="Profile"
                className="w-28 h-28 rounded-full border-4 border-white object-cover shadow-xl"
              />
            ) : (
              <div className="w-28 h-28 rounded-full border-4 border-white bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl">
                <span className="text-4xl font-bold text-white">
                  {formData.fullName?.charAt(0) || '?'}
                </span>
              </div>
            )}
            <div className="absolute bottom-1 right-1 p-2 bg-white rounded-full shadow-lg border border-gray-100">
              <FaCamera className="w-4 h-4 text-gray-400" />
            </div>
          </div>

          <div className="space-y-6">
            {/* Row 1: Name + Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Full Name *</label>
                <div className="relative group">
                  <FaUser className="absolute left-3.5 top-3.5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                  <input
                    type="text"
                    name="fullName"
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="John Doe"
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 focus:bg-white outline-none text-sm transition-all"
                  />
                </div>
              </motion.div>

              <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Email Address *</label>
                <div className="relative group">
                  <FaEnvelope className="absolute left-3.5 top-3.5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                  <input
                    type="email"
                    name="email"
                    required
                    disabled={isExisting}
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full pl-11 pr-4 py-3 border rounded-2xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 outline-none text-sm transition-all ${
                      isExisting
                        ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200'
                        : 'bg-gray-50 border-gray-200 focus:bg-white'
                    }`}
                  />
                </div>
              </motion.div>
            </div>

            {/* Row 2: Student ID + Department */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Student ID *</label>
                <div className="relative group">
                  <FaIdCard className="absolute left-3.5 top-3.5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                  <input
                    type="text"
                    name="studentId"
                    required
                    value={formData.studentId}
                    onChange={handleChange}
                    placeholder="e.g. 011201001"
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 focus:bg-white outline-none text-sm transition-all"
                  />
                </div>
              </motion.div>

              <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Department</label>
                <div className="relative group">
                  <FaGraduationCap className="absolute left-3.5 top-3.5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 focus:bg-white outline-none text-sm transition-all appearance-none cursor-pointer"
                  >
                    <option value="">Select Department</option>
                    <option value="CSE">Computer Science & Engineering</option>
                    <option value="EEE">Electrical & Electronic Engineering</option>
                    <option value="BBA">Business Administration</option>
                    <option value="English">English</option>
                    <option value="MBA">MBA</option>
                  </select>
                </div>
              </motion.div>
            </div>

            {/* Row 3: Semester + Batch */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Semester / Year</label>
                <input
                  type="text"
                  name="semester"
                  value={formData.semester}
                  onChange={handleChange}
                  placeholder="e.g. 8th Semester"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 focus:bg-white outline-none text-sm transition-all"
                />
              </motion.div>

              <motion.div custom={5} variants={fadeUp} initial="hidden" animate="visible">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Batch</label>
                <input
                  type="text"
                  name="batch"
                  value={formData.batch}
                  onChange={handleChange}
                  placeholder="e.g. 211"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 focus:bg-white outline-none text-sm transition-all"
                />
              </motion.div>
            </div>

            {/* Row 4: Phone + Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <motion.div custom={6} variants={fadeUp} initial="hidden" animate="visible">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Phone Number</label>
                <div className="relative group">
                  <FaPhone className="absolute left-3.5 top-3.5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+8801700000000"
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 focus:bg-white outline-none text-sm transition-all"
                  />
                </div>
              </motion.div>

              <motion.div custom={7} variants={fadeUp} initial="hidden" animate="visible">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Location</label>
                <div className="relative group">
                  <FaMapMarkerAlt className="absolute left-3.5 top-3.5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="e.g. Dhaka, Bangladesh"
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 focus:bg-white outline-none text-sm transition-all"
                  />
                </div>
              </motion.div>
            </div>

            {/* Row 5: GitHub + LinkedIn */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <motion.div custom={8} variants={fadeUp} initial="hidden" animate="visible">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">GitHub Profile</label>
                <div className="relative group">
                  <FaGithub className="absolute left-3.5 top-3.5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                  <input
                    type="url"
                    name="githubUrl"
                    value={formData.githubUrl}
                    onChange={handleChange}
                    placeholder="https://github.com/username"
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 focus:bg-white outline-none text-sm transition-all"
                  />
                </div>
              </motion.div>

              <motion.div custom={9} variants={fadeUp} initial="hidden" animate="visible">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">LinkedIn Profile</label>
                <div className="relative group">
                  <FaLinkedin className="absolute left-3.5 top-3.5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                  <input
                    type="url"
                    name="linkedinUrl"
                    value={formData.linkedinUrl}
                    onChange={handleChange}
                    placeholder="https://linkedin.com/in/username"
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 focus:bg-white outline-none text-sm transition-all"
                  />
                </div>
              </motion.div>
            </div>

            {/* Profile Image URL */}
            <motion.div custom={10} variants={fadeUp} initial="hidden" animate="visible">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Profile Image URL</label>
              <div className="relative group">
                <FaImage className="absolute left-3.5 top-3.5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  type="url"
                  name="profilePictureUrl"
                  value={formData.profilePictureUrl}
                  onChange={handleChange}
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 focus:bg-white outline-none text-sm transition-all"
                />
              </div>
            </motion.div>

            {/* Skills */}
            <motion.div custom={11} variants={fadeUp} initial="hidden" animate="visible">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Skills (Comma separated)</label>
              <div className="relative group">
                <FaCode className="absolute left-3.5 top-3.5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  type="text"
                  name="skills"
                  value={formData.skills}
                  onChange={handleChange}
                  placeholder="React, Next.js, Node.js, Tailwind CSS"
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 focus:bg-white outline-none text-sm transition-all"
                />
              </div>
              {formData.skills && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {formData.skills.split(',').map((s, i) => s.trim() && (
                    <span key={i} className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-100">
                      {s.trim()}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Bio */}
            <motion.div custom={12} variants={fadeUp} initial="hidden" animate="visible">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Bio / About</label>
              <textarea
                name="bio"
                rows={4}
                value={formData.bio}
                onChange={handleChange}
                placeholder="Write a brief summary about your background, interests, and goals..."
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 focus:bg-white outline-none text-sm transition-all resize-none"
              />
            </motion.div>

            {/* Submit Button */}
            <motion.div custom={13} variants={fadeUp} initial="hidden" animate="visible">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-2xl disabled:opacity-50 transition-all duration-300 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 flex items-center justify-center gap-2 text-sm"
              >
                {loading ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    Processing...
                  </>
                ) : isExisting ? (
                  <>
                    <FaSave />
                    Update Profile
                  </>
                ) : (
                  <>
                    <FaSave />
                    Save Profile
                  </>
                )}
              </button>
            </motion.div>
          </div>
        </div>
      </motion.form>
    </div>
  );
}
