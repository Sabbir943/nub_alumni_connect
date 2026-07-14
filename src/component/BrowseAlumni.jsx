'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';

const BrowseAlumni = ({ initialAlumniData }) => {
  // 1. Initialize state directly with Server-Side rendered data
  const [alumniList, setAlumniList] = useState(initialAlumniData?.data || []);
  const [totalPages, setTotalPages] = useState(initialAlumniData?.pagination?.totalPages || 1);
  const [totalCount, setTotalCount] = useState(initialAlumniData?.pagination?.total || 0);
  
  // 2. Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);

  // 3. Ref to track initial mount and prevent double-fetching
  const isInitialMount = useRef(true);

  const fetchAlumni = useCallback(async (search, cat, locVal, sort, page) => {
    setLoading(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      
      const queryParams = new URLSearchParams({
        search: search || '',
        category: cat || '',
        location: locVal || '',
        sort: sort || 'newest',
        page: page,
        limit: 6,
      });

      // FIXED: Added '/api/' to the route to match backend
      const res = await fetch(`${API_URL}/api/alumni-directory?${queryParams.toString()}`);
      const result = await res.json();

      if (result.success) {
        setAlumniList(result.data || []);
        setTotalPages(result.pagination?.totalPages || 1);
        setTotalCount(result.pagination?.total || 0);
      }
    } catch (error) {
      console.error('Error fetching alumni:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 4. Debounced Effect for Search & Filters
  useEffect(() => {
    // Skip the very first render since we already have server data
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const timer = setTimeout(() => {
      fetchAlumni(searchQuery, category, location, sortBy, currentPage);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery, category, location, sortBy, currentPage, fetchAlumni]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to page 1 on new search
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Title Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Alumni Directory
        </h1>
        <p className="text-xs text-slate-500">
          Showing <strong className="text-slate-800">{totalCount}</strong> active alumni profiles
        </p>
      </div>

      {/* SEARCH & FILTER BAR */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 md:p-5 shadow-xs transition-all">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-500 tracking-wider uppercase">
              Search Keywords
            </label>
            <input
              type="text"
              placeholder="Type name or keyword..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full px-3.5 py-2.5 text-sm text-slate-700 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-500 tracking-wider uppercase">
              Degree
            </label>
            <select
              value={category}
              onChange={(e) => { setCategory(e.target.value); setCurrentPage(1); }}
              className="w-full px-3.5 py-2.5 text-sm text-slate-700 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer"
            >
              <option value="">All Degrees</option>
              <option value="B.Sc. in CSE">B.Sc. in CSE</option>
              <option value="Bachelor of BBA">Bachelor of BBA</option>
              <option value="B.Sc. in EEE">B.Sc. in EEE</option>
              <option value="Master of Computer Application (MCA)">MCA</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-500 tracking-wider uppercase">
              Location
            </label>
            <select
              value={location}
              onChange={(e) => { setLocation(e.target.value); setCurrentPage(1); }}
              className="w-full px-3.5 py-2.5 text-sm text-slate-700 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer"
            >
              <option value="">All Locations</option>
              <option value="Dhaka">Dhaka</option>
              <option value="Chittagong">Chittagong</option>
              <option value="Sylhet">Sylhet</option>
              <option value="International">International</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-500 tracking-wider uppercase">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
              className="w-full px-3.5 py-2.5 text-sm text-slate-700 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer"
            >
              <option value="newest">Newest Added</option>
              <option value="oldest">Oldest First</option>
              <option value="name_asc">Name (A-Z)</option>
            </select>
          </div>

        </div>
      </div>

      {/* Grid Container */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div key={idx} className="bg-white rounded-2xl p-6 border border-slate-100 animate-pulse space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-slate-200 rounded-full"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : alumniList.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {alumniList.map((alumnus) => {
            // FIXED: Using profilePictureUrl based on your POST request logic
            const avatarUrl = alumnus.profilePictureUrl || 
              `https://ui-avatars.com/api/?name=${encodeURIComponent(alumnus.fullName || 'Alumni')}&background=4f46e5&color=fff`;

            return (
              <div
                key={alumnus._id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between overflow-hidden"
              >
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={avatarUrl}
                      alt={alumnus.fullName}
                      loading="lazy"
                      className="w-14 h-14 rounded-full object-cover border border-slate-100 shrink-0"
                    />

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
            No alumni profiles found matching your search criteria.
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