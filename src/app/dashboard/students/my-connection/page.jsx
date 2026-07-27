'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { authClient } from '@/lib/auth-client';
import {
  Users,
  Search,
  UserMinus,
  UserX,
  ExternalLink,
  Briefcase,
  GraduationCap,
  Loader2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';

const Linkedin = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

const Github = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
  </svg>
);

export default function StudentMyConnectionsPage() {
  const { data: session, isPending: sessionLoading } = authClient.useSession();
  const currentUserEmail = session?.user?.email;

  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [unfollowing, setUnfollowing] = useState(false);

  const fetchConnections = useCallback(async () => {
    if (!currentUserEmail) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch(`/api/follow/following/${encodeURIComponent(currentUserEmail)}`);
      setConnections(data.following || []);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error loading connections');
    } finally {
      setLoading(false);
    }
  }, [currentUserEmail]);

  useEffect(() => {
    if (!currentUserEmail || sessionLoading) return undefined;
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await apiFetch(`/api/follow/following/${encodeURIComponent(currentUserEmail)}`);
        if (!cancelled) setConnections(data.following || []);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Error loading connections');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [currentUserEmail, sessionLoading]);

  const filteredConnections = useMemo(() => {
    return connections.filter((profile) => {
      const search = searchTerm.toLowerCase();
      const name = profile.fullName?.toLowerCase() || '';
      const dept = profile.department?.toLowerCase() || '';
      const skills = profile.skills?.toLowerCase() || '';
      const id = profile.studentId?.toLowerCase() || '';

      return name.includes(search) || dept.includes(search) || skills.includes(search) || id.includes(search);
    });
  }, [connections, searchTerm]);

  const handleOpenUnfollowModal = (profile) => {
    setSelectedUser(profile);
    setIsModalOpen(true);
  };

  const handleConfirmUnfollow = async () => {
    if (!selectedUser || !currentUserEmail) return;
    setUnfollowing(true);
    try {
      await apiFetch(`/api/follow`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followerEmail: currentUserEmail, targetEmail: selectedUser.email }),
      });
      setConnections((prev) => prev.filter((item) => item.email !== selectedUser.email));
      setIsModalOpen(false);
      setSelectedUser(null);
    } catch (err) {
      console.error('Error unfollowing:', err);
      alert('Could not unfollow at this time. Please try again.');
    } finally {
      setUnfollowing(false);
    }
  };

  if (sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-2" />
          <p className="text-sm font-medium text-slate-500">Authenticating session...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center max-w-md">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-900">Access Restricted</h2>
          <p className="text-sm text-slate-500 mt-1">
            Please sign in to your student account to view and manage your connections.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
                  <Users className="w-7 h-7 text-white" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">My Connections</h1>
              </div>
              <p className="text-emerald-100 text-sm sm:text-base mt-2 max-w-xl">
                Your network of followed students and alumni. Stay connected and grow together.
              </p>
            </div>

            <div className="self-start md:self-auto bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-5 py-3 text-center">
              <span className="text-xs uppercase font-semibold text-emerald-200 tracking-wider block">Following</span>
              <span className="text-2xl font-bold">{connections.length}</span>
            </div>
          </div>
        </div>

        {/* Search & Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by name, department, or skills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
            />
          </div>

          <button
            onClick={fetchConnections}
            disabled={loading}
            className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-emerald-600 bg-slate-100 hover:bg-emerald-50 px-3.5 py-2.5 rounded-xl border border-slate-200/80 transition w-full sm:w-auto justify-center"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-500">Fetching your connections...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-700">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-red-500" />
            <p className="font-semibold">{error}</p>
            <button
              onClick={fetchConnections}
              className="mt-3 px-4 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 transition"
            >
              Retry
            </button>
          </div>
        ) : filteredConnections.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center shadow-sm">
            <UserX className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800">
              {searchTerm ? 'No matching connections found' : 'No connections yet'}
            </h3>
            <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">
              {searchTerm
                ? 'Try adjusting your search criteria.'
                : 'Explore the student or alumni directory to discover and follow people.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredConnections.map((profile) => (
              <div
                key={profile._id || profile.email}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow duration-300"
              >
                {/* Card Header */}
                <div className="h-20 bg-gradient-to-r from-emerald-500 to-teal-500 relative">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent)]" />
                  {profile._source && (
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 backdrop-blur-sm text-white uppercase">
                      {profile._source}
                    </span>
                  )}
                </div>

                {/* Avatar */}
                <div className="px-5 pb-5 -mt-10 relative">
                  <div className="relative w-20 h-20 mx-auto">
                    {profile.profilePictureUrl ? (
                      <img
                        src={profile.profilePictureUrl}
                        alt={profile.fullName}
                        className="w-20 h-20 rounded-full border-4 border-white object-cover shadow-md"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full border-4 border-white bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
                        <span className="text-2xl font-bold text-white">
                          {profile.fullName?.charAt(0) || '?'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="mt-3 text-center">
                    <h3 className="text-base font-bold text-slate-900 truncate">{profile.fullName}</h3>
                    {profile.studentId && (
                      <p className="text-xs text-emerald-600 font-medium mt-0.5">#{profile.studentId}</p>
                    )}
                    {profile.department && (
                      <p className="text-xs text-slate-500 mt-0.5 flex items-center justify-center gap-1">
                        <GraduationCap className="w-3 h-3" />
                        {profile.department}
                      </p>
                    )}
                  </div>

                  {/* Skills */}
                  {profile.skills && (
                    <div className="mt-3 flex flex-wrap justify-center gap-1">
                      {(Array.isArray(profile.skills)
                        ? profile.skills
                        : profile.skills.split(',').map((s) => s.trim())
                      ).slice(0, 3).map((skill, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-medium border border-emerald-100">
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Social Links */}
                  <div className="mt-3 flex items-center justify-center gap-2">
                    {profile.linkedinUrl && (
                      <a
                        href={profile.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                      >
                        <Linkedin className="w-4 h-4" />
                      </a>
                    )}
                    {profile.githubUrl && (
                      <a
                        href={profile.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                      >
                        <Github className="w-4 h-4" />
                      </a>
                    )}
                    {profile.phone && (
                      <a
                        href={`tel:${profile.phone}`}
                        className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                      >
                        <span className="text-xs font-bold">{profile.phone}</span>
                      </a>
                    )}
                  </div>

                  {/* Unfollow */}
                  <button
                    onClick={() => handleOpenUnfollowModal(profile)}
                    className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-semibold border border-rose-200 transition-colors"
                  >
                    <UserMinus className="w-3.5 h-3.5" />
                    Unfollow
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Unfollow Confirmation Modal */}
      {isModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative">
            <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center mb-4 text-rose-600">
              <UserMinus className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-900">
              Unfollow {selectedUser.fullName}?
            </h3>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              Are you sure you want to remove <span className="font-semibold text-slate-700">{selectedUser.fullName}</span> from your connections?
            </p>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                disabled={unfollowing}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmUnfollow}
                disabled={unfollowing}
                className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-md transition"
              >
                {unfollowing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Confirm Unfollow
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
