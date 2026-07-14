'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

const BrowseAlumni = () => {
  const [alumniList, setAlumniList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Backend API Call Handler
  const fetchAlumni = useCallback(async (search, page) => {
    setLoading(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const res = await fetch(
        `${API_URL}/api/alumni-directory?search=${encodeURIComponent(search)}&page=${page}&limit=6`
      );
      const result = await res.json();

      if (result.success) {
        setAlumniList(result.data);
        setTotalPages(result.pagination.totalPages);
        setTotalCount(result.pagination.total);
      }
    } catch (error) {
      console.error('Error fetching alumni:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce technique for search performance
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAlumni(searchQuery, currentPage);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery, currentPage, fetchAlumni]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to page 1 on new search
  };

  return (
    <div className="space-y-8">
      {/* Search Bar Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Alumni Directory
        </h1>
        
        <div className="relative mt-4">
          <input
            type="text"
            placeholder="Search by name, department, or company..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full px-5 py-3.5 pl-11 text-slate-800 bg-white border border-slate-200 rounded-xl shadow-xs focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
            🔍
          </span>
        </div>

        <p className="text-xs text-slate-500">
          Total Found: <strong className="text-slate-800">{totalCount}</strong> alumni
        </p>
      </div>

      {/* Loading Skeleton / Grid Container */}
      {loading ? (
        <div className="text-center py-12 text-slate-500 font-medium">
          Loading alumni...
        </div>
      ) : alumniList.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {alumniList.map((alumnus) => {
            const hasCustomImage = alumnus.profilePicture?.data;
            const imgSrc = hasCustomImage
              ? `data:${alumnus.profilePicture.contentType};base64,${alumnus.profilePicture.data}`
              : null;

            return (
              <div
                key={alumnus._id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between overflow-hidden"
              >
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-4">
                    {imgSrc ? (
                      <img
                        src={imgSrc}
                        alt={alumnus.fullName}
                        className="w-14 h-14 rounded-full object-cover border border-slate-100 shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 font-bold text-xl flex items-center justify-center shrink-0">
                        {alumnus.fullName ? alumnus.fullName.charAt(0).toUpperCase() : 'A'}
                      </div>
                    )}

                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-slate-900 truncate">
                        {alumnus.fullName || 'Anonymous Alumni'}
                      </h3>
                      <p className="text-xs font-semibold text-indigo-600 truncate">
                        {alumnus.degree || 'Department N/A'}
                      </p>
                      {alumnus.graduationYear && (
                        <p className="text-xs text-slate-400">
                          Batch of {alumnus.graduationYear}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 text-xs text-slate-600 space-y-2">
                    <div className="flex items-center gap-2">
                      <span>💼</span>
                      <span className="font-medium text-slate-800 truncate">
                        {alumnus.jobTitle || 'Role Not Specified'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>🏢</span>
                      <span className="truncate">
                        {alumnus.organization || 'Company Not Specified'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="px-6 pb-6 pt-2">
                  <Link
                    href={`/alumni/${alumnus._id}`}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-indigo-600 text-white font-medium text-xs rounded-xl transition-colors"
                  >
                    View Details
                    <span>→</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300">
          <p className="text-slate-500 text-sm">
            No alumni found matching <strong className="text-slate-800">"{searchQuery}"</strong>
          </p>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 pt-4">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            ← Previous
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 text-xs font-semibold rounded-lg transition-all ${
                  currentPage === page
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-600 bg-white border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
};

export default BrowseAlumni;