'use client';

import React, { useState, useEffect } from 'react';
import { authClient } from '@/lib/auth-client';
import { apiFetch } from '@/lib/api';
import {
  Briefcase,
  Search,
  Edit3,
  Trash2,
  MapPin,
  Building2,
  DollarSign,
  Loader2,
  AlertTriangle,
  X,
  CheckCircle2,
  Plus
} from 'lucide-react';
import Link from 'next/link';

export default function ManageJobsPage() {
  const { data: session, isPending: sessionLoading } = authClient.useSession();
  const currentUserName = session?.user?.name;

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [editingJob, setEditingJob] = useState(null);
  const [deletingJob, setDeletingJob] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Edit form state
  const [editFormData, setEditFormData] = useState({
    title: '',
    company: '',
    location: '',
    jobType: 'Full-time',
    salary: '',
    description: '',
  });

  useEffect(() => {
    if (!currentUserName) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await apiFetch(`/api/jobs?limit=100`);
        if (!cancelled && data.success) {
          const userJobs = (data.jobs || []).filter(
            (job) => job.postedBy === currentUserName
          );
          setJobs(userJobs);
        }
      } catch (err) {
        console.error('Error fetching jobs:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [currentUserName]);

  const refreshJobs = async () => {
    if (!currentUserName) return;
    try {
      const data = await apiFetch(`/api/jobs?limit=100`);
      if (data.success) {
        const userJobs = (data.jobs || []).filter(
          (job) => job.postedBy === currentUserName
        );
        setJobs(userJobs);
      }
    } catch (err) {
      console.error('Error refreshing jobs:', err);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (job) => {
    setEditingJob(job);
    setEditFormData({
      title: job.title || '',
      company: job.company || '',
      location: job.location || '',
      jobType: job.jobType || 'Full-time',
      salary: job.salary || '',
      description: job.description || '',
    });
  };

  // Submit Job Edit
  const handleUpdateJob = async (e) => {
    e.preventDefault();
    if (!editingJob?._id) return;

    setActionLoading(true);
    try {
      const data = await apiFetch(`/api/jobs/${editingJob._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      });

      if (data.success) {
        setEditingJob(null);
        refreshJobs();
      }
    } catch (err) {
      console.error('Error updating job:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Confirm and Execute Delete
  const handleDeleteJob = async () => {
    if (!deletingJob?._id) return;

    setActionLoading(true);
    try {
      const data = await apiFetch(`/api/jobs/${deletingJob._id}`, {
        method: 'DELETE',
      });

      if (data.success) {
        setDeletingJob(null);
        refreshJobs();
      }
    } catch (err) {
      console.error('Error deleting job:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Filter jobs by search search
  const filteredJobs = jobs.filter((job) => {
    const title = job.title?.toLowerCase() || '';
    const company = job.company?.toLowerCase() || '';
    const location = job.location?.toLowerCase() || '';
    return title.includes(searchTerm.toLowerCase()) || company.includes(searchTerm.toLowerCase()) || location.includes(searchTerm.toLowerCase());
  });

  if (sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-8 rounded-2xl border text-center max-w-md shadow-sm">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-800">Access Restricted</h2>
          <p className="text-sm text-slate-500 mt-1">Please log in to manage your posted jobs.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-blue-600" />
              Manage Jobs
            </h1>
            <p className="text-sm text-slate-500 mt-1">View, edit, or remove job opportunities you have posted.</p>
          </div>

          <Link
            href="/dashboard/alumni/jobPost"
            className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Post New Job
          </Link>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by job title, company, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
          </div>
          <p className="text-xs text-slate-500 font-medium sm:text-right">Total: {filteredJobs.length} Jobs</p>
        </div>

        {/* Jobs Tabular View */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 sm:p-12 text-center text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-blue-600" />
              <p className="text-sm">Loading your posted jobs...</p>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="p-8 sm:p-12 text-center">
              <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-700">No Jobs Found</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                {searchTerm ? "No job posts matched your search parameters." : "You haven't posted any job openings yet."}
              </p>
            </div>
          ) : (
            <>
              {/* Mobile card layout */}
              <div className="md:hidden space-y-3">
                {filteredJobs.map((job) => (
                  <div key={job._id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-slate-900 truncate">{job.title}</div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{job.company}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => handleOpenEdit(job)} className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Edit Job">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeletingJob(job)} className="p-2 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition" title="Delete Job">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                      <div className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-400" />{job.location || 'Remote'}</div>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">{job.jobType || 'Full-time'}</span>
                      <div className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5 text-slate-400" />{job.salary || 'Negotiable'}</div>
                      <div className="text-slate-400">{job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'N/A'}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop table layout */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3.5 px-6">Job Title & Company</th>
                      <th className="py-3.5 px-4">Location</th>
                      <th className="py-3.5 px-4">Job Type</th>
                      <th className="py-3.5 px-4">Salary</th>
                      <th className="py-3.5 px-4">Posted Date</th>
                      <th className="py-3.5 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                    {filteredJobs.map((job) => (
                      <tr key={job._id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="py-4 px-6">
                          <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{job.title}</div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            <span>{job.company}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-slate-600 whitespace-nowrap">
                          <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400" /><span>{job.location || 'Remote / Unspecified'}</span></div>
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">{job.jobType || 'Full-time'}</span>
                        </td>
                        <td className="py-4 px-4 text-slate-600 whitespace-nowrap">
                          <div className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5 text-slate-400" /><span>{job.salary || 'Negotiable'}</span></div>
                        </td>
                        <td className="py-4 px-4 text-slate-500 text-xs whitespace-nowrap">
                          {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="py-4 px-6 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => handleOpenEdit(job)} className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Edit Job"><Edit3 className="w-4 h-4" /></button>
                            <button onClick={() => setDeletingJob(job)} className="p-2 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition" title="Delete Job"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

      </div>

      {/* EDIT JOB MODAL */}
      {editingJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-blue-600" />
                Edit Job Details
              </h2>
              <button
                onClick={() => setEditingJob(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateJob} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Job Title</label>
                <input
                  type="text"
                  required
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Company</label>
                  <input
                    type="text"
                    required
                    value={editFormData.company}
                    onChange={(e) => setEditFormData({ ...editFormData, company: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Location</label>
                  <input
                    type="text"
                    required
                    value={editFormData.location}
                    onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Job Type</label>
                  <select
                    value={editFormData.jobType}
                    onChange={(e) => setEditFormData({ ...editFormData, jobType: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Remote">Remote</option>
                    <option value="Internship">Internship</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Salary Range</label>
                  <input
                    type="text"
                    value={editFormData.salary}
                    onChange={(e) => setEditFormData({ ...editFormData, salary: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={4}
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingJob(null)}
                  className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm px-5 py-2 rounded-xl transition disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 bg-rose-50 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Delete Job Posting</h3>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-slate-900">{deletingJob.title}</span>? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingJob(null)}
                className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteJob}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs sm:text-sm px-4 py-2 rounded-xl transition disabled:opacity-50"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Delete Job
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}