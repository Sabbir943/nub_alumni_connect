'use client';

import React, { useState } from 'react';
import { 
  FiBriefcase, 
  FiHome, 
  FiMapPin, 
  FiDollarSign, 
  FiClock, 
  FiGlobe, 
  FiPlus, 
  FiX, 
  FiSend, 
  FiCheckCircle, 
  FiAlertCircle 
} from 'react-icons/fi';

const JobPost = () => {
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    location: '',
    jobType: 'Full-time',
    workplaceType: 'On-site',
    salaryRange: '',
    applicationDeadline: '',
    applicationUrlOrEmail: '',
    description: '',
    requirements: '',
  });

  const [skills, setSkills] = useState(['React', 'Node.js', 'Tailwind CSS']);
  const [skillInput, setSkillInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // Handle Input Changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Add Skill Tag
  const handleAddSkill = (e) => {
    e.preventDefault();
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  // Remove Skill Tag
  const handleRemoveSkill = (skillToRemove) => {
    setSkills(skills.filter((skill) => skill !== skillToRemove));
  };

  // Form Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMessage(null);

    const jobPayload = {
      ...formData,
      skills,
      postedBy: 'Alumni Network',
      createdAt: new Date().toISOString(),
    };

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_URL}/api/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobPayload),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setStatusMessage({ type: 'success', text: 'Job circular published successfully! 🎉' });
        // Reset form
        setFormData({
          title: '',
          company: '',
          location: '',
          jobType: 'Full-time',
          workplaceType: 'On-site',
          salaryRange: '',
          applicationDeadline: '',
          applicationUrlOrEmail: '',
          description: '',
          requirements: '',
        });
        setSkills([]);
      } else {
        setStatusMessage({ type: 'error', text: result.message || 'Failed to post job. Please try again.' });
      }
    } catch (error) {
      console.error('Error submitting job post:', error);
      setStatusMessage({ type: 'error', text: 'Server connection failed. Please check your backend.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="mt-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Decorative Card Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-t-3xl p-8 sm:p-10 text-white relative overflow-hidden shadow-xl">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/20 border border-indigo-400/30 rounded-full text-indigo-300 text-xs font-semibold uppercase tracking-widest">
            <FiBriefcase className="w-3.5 h-3.5" /> Alumni Career Portal
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Post a Job / Internship Opportunity
          </h2>
          <p className="text-slate-300 text-sm max-w-xl">
            Empower your university network by sharing career opportunities, internships, and corporate openings with fellow alumni.
          </p>
        </div>
      </div>

      {/* Main Form Body */}
      <div className="bg-white border-x border-b border-slate-200/80 rounded-b-3xl shadow-lg p-6 sm:p-10">
        
        {/* Status Alert Banner */}
        {statusMessage && (
          <div
            className={`mb-8 p-4 rounded-2xl flex items-center gap-3 text-sm font-medium ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <FiCheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <FiAlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Row 1: Job Title & Company */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                Job Title <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <FiBriefcase />
                </span>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="e.g. Frontend Engineer (Next.js)"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                Company Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <FiHome />
                </span>
                <input
                  type="text"
                  name="company"
                  required
                  placeholder="e.g. Tech Solutions Ltd."
                  value={formData.company}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
                />
              </div>
            </div>
          </div>

          {/* Row 2: Workplace Type & Job Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                Workplace Setup <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select
                  name="workplaceType"
                  value={formData.workplaceType}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all cursor-pointer"
                >
                  <option value="On-site">🏢 On-site</option>
                  <option value="Hybrid">🏠 Hybrid</option>
                  <option value="Remote">🌐 Remote</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                Job Type <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select
                  name="jobType"
                  value={formData.jobType}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all cursor-pointer"
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                </select>
              </div>
            </div>
          </div>

          {/* Row 3: Location & Salary Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                Location <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <FiMapPin />
                </span>
                <input
                  type="text"
                  name="location"
                  required
                  placeholder="e.g. Uttara, Dhaka or Remote"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                Salary Range (BDT)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <FiDollarSign />
                </span>
                <input
                  type="text"
                  name="salaryRange"
                  placeholder="e.g. 50,000 - 80,000 / Negotiable"
                  value={formData.salaryRange}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
                />
              </div>
            </div>
          </div>

          {/* Row 4: Deadline & Application Link/Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                Application Deadline
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <FiClock />
                </span>
                <input
                  type="date"
                  name="applicationDeadline"
                  value={formData.applicationDeadline}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                Apply Link or Email <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <FiGlobe />
                </span>
                <input
                  type="text"
                  name="applicationUrlOrEmail"
                  required
                  placeholder="e.g. hr@company.com or https://careers.link"
                  value={formData.applicationUrlOrEmail}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
                />
              </div>
            </div>
          </div>

          {/* Row 5: Required Skills Tags */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
              Required Skills / Key Keywords
            </label>
            
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Type a skill (e.g. JavaScript, Marketing) and click Add"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs rounded-xl flex items-center gap-1 transition-colors"
              >
                <FiPlus className="w-4 h-4" /> Add
              </button>
            </div>

            {/* Tags Pills Container */}
            {skills.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {skills.map((skill, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-lg border border-indigo-100"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="text-indigo-400 hover:text-indigo-900 transition-colors"
                    >
                      <FiX className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Row 6: Job Description */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
              Job Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              name="description"
              rows={4}
              required
              placeholder="Provide a detailed description of responsibilities, company overview, and role expectations..."
              value={formData.description}
              onChange={handleChange}
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 resize-y"
            />
          </div>

          {/* Row 7: Requirements / Qualifications */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
              Qualifications & Requirements
            </label>
            <textarea
              name="requirements"
              rows={3}
              placeholder="List educational degree preferences, years of experience, or specific tools needed..."
              value={formData.requirements}
              onChange={handleChange}
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 resize-y"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-slate-900 hover:bg-indigo-600 text-white font-semibold text-sm rounded-xl shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Publishing Circular...</span>
                </>
              ) : (
                <>
                  <FiSend className="w-4 h-4" />
                  <span>Publish Job Post</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </section>
  );
};

export default JobPost;