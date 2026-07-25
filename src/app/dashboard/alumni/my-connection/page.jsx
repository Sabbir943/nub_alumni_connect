'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSession } from '@/lib/auth-client';
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
  RefreshCw
} from 'lucide-react';

// Custom SVG for LinkedIn to avoid icon package version mismatches
const LinkedinIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.7a1.62 1.62 0 1 0 0 3.24 1.62 1.62 0 0 0 0-3.24z" />
  </svg>
);

export default function MyConnectionsPage() {
  const { data: session, isPending: sessionLoading } = useSession();
  const currentUserEmail = session?.user?.email;

  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Unfollow Modal States
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [unfollowing, setUnfollowing] = useState(false);

  // Fetch Following Alumni
  const fetchConnections = async () => {
    if (!currentUserEmail) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/follow/following/${encodeURIComponent(currentUserEmail)}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch connections');
      }
      const data = await response.json();
      setConnections(data.following || []);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error loading connections');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUserEmail) {
      fetchConnections();
    } else if (!sessionLoading && !currentUserEmail) {
      setLoading(false);
    }
  }, [currentUserEmail, sessionLoading]);

  // Filtered Connections List
  const filteredConnections = useMemo(() => {
    return connections.filter((alumni) => {
      const search = searchTerm.toLowerCase();
      const name = alumni.fullName?.toLowerCase() || '';
      const job = alumni.jobTitle?.toLowerCase() || '';
      const org = alumni.organization?.toLowerCase() || '';
      const year = alumni.graduationYear?.toString() || '';

      return (
        name.includes(search) ||
        job.includes(search) ||
        org.includes(search) ||
        year.includes(search)
      );
    });
  }, [connections, searchTerm]);

  const handleOpenUnfollowModal = (alumni) => {
    setSelectedUser(alumni);
    setIsModalOpen(true);
  };

  const handleConfirmUnfollow = async () => {
    if (!selectedUser || !currentUserEmail) return;

    setUnfollowing(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/follow`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          followerEmail: currentUserEmail,
          targetEmail: selectedUser.email,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to unfollow user');
      }

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
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
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
            Please log in to your alumni account to view and manage your connections.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header Card */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-800 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
                  <Users className="w-7 h-7 text-white" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">My Connections</h1>
              </div>
              <p className="text-blue-100 text-sm sm:text-base mt-2 max-w-xl">
                Manage your alumni network, stay in touch with your peers, and grow your professional relationships.
              </p>
            </div>

            <div className="self-start md:self-auto bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-5 py-3 text-center">
              <span className="text-xs uppercase font-semibold text-blue-200 tracking-wider block">Following</span>
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
              placeholder="Search by name, designation, or year..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
          </div>

          <button
            onClick={fetchConnections}
            disabled={loading}
            className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 px-3.5 py-2.5 rounded-xl border border-slate-200/80 transition w-full sm:w-auto justify-center"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Network
          </button>
        </div>

        {/* Connections Content */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-500">Fetching your connection list...</p>
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
                : 'Explore the alumni directory to discover and follow fellow graduates.'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[13px] font-semibold text-slate-600 uppercase tracking-wider">
                    <th className="py-4 px-6">Alumni Profile</th>
                    <th className="py-4 px-6">Graduation Batch</th>
                    <th className="py-4 px-6">Designation & Org</th>
                    <th className="py-4 px-6">LinkedIn</th>
                    <th className="py-4 px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredConnections.map((alumni) => (
                    <tr key={alumni._id || alumni.email} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              alumni.profilePictureUrl ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                alumni.fullName || 'Alumni'
                              )}&background=0D8ABC&color=fff`
                            }
                            alt={alumni.fullName}
                            className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-100"
                          />
                          <div>
                            <span className="font-semibold text-slate-900 block">
                              {alumni.fullName}
                            </span>
                            <span className="text-xs text-slate-400 block">
                              {alumni.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-semibold">
                          <GraduationCap className="w-3.5 h-3.5" />
                          {alumni.graduationYear ? `Batch of ${alumni.graduationYear}` : 'N/A'}
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <div className="flex items-start gap-1.5">
                          <Briefcase className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                          <div>
                            <p className="font-medium text-slate-800">
                              {alumni.jobTitle || 'Not specified'}
                            </p>
                            <p className="text-xs text-slate-500">
                              {alumni.organization || 'Independent'}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        {alumni.linkedinUrl ? (
                          <a
                            href={alumni.linkedinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-medium text-xs hover:underline"
                          >
                            <LinkedinIcon className="w-4 h-4" />
                            <span>LinkedIn</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-xs text-slate-400">Not provided</span>
                        )}
                      </td>

                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => handleOpenUnfollowModal(alumni)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-semibold border border-rose-200/80 transition"
                        >
                          <UserMinus className="w-3.5 h-3.5" />
                          Unfollow
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* Unfollow Confirmation Modal */}
      {isModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center mb-4 text-rose-600">
              <UserMinus className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-900">
              Unfollow {selectedUser.fullName}?
            </h3>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              Are you sure you want to remove <span className="font-semibold text-slate-700">{selectedUser.fullName}</span> from your connection list?
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