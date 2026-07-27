'use client';

import React from 'react';
import { FaStar, FaQuoteLeft, FaCheckCircle, FaBuilding, FaGraduationCap } from 'react-icons/fa';
import { MdVerifiedUser } from "react-icons/md";

export default function HighlightReviews() {
  const reviews = [
    {
      name: 'Tanvir Hossain',
      role: 'Software Engineer',
      company: 'Brain Station 23',
      type: 'Alumni',
      batch: 'Batch 42 (CSE)',
      image: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150&h=150&auto=format&fit=crop&q=80',
      comment:
        'Being able to mentor NUB juniors has been deeply rewarding. The direct resume review feature allowed me to shortlist two qualified interns in under a week!',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      name: 'Anika Rahman',
      role: 'Frontend Student',
      company: 'NUB Undergraduate',
      type: 'Student',
      batch: 'Batch 51 (CSE)',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&auto=format&fit=crop&q=80',
      comment:
        'I submitted my CV to the Resume Critiques workspace and got feedback from an alumnus in Canada. Fixed my tech stack formatting and landed my first remote internship!',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    {
      name: 'Mahmudul Hasan',
      role: 'Product Designer',
      company: 'Pathao',
      type: 'Alumni',
      batch: 'Batch 38 (EEE)',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&auto=format&fit=crop&q=80',
      comment:
        'The Alumni Directory search filters made finding my old batchmates effortless. The community feed keeps us genuinely connected to campus news.',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    },
  ];

  return (
    <section className="py-5 bg-slate-50/60 border-b border-slate-100 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100/80 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider mb-3">
            <MdVerifiedUser className="w-4 h-4 text-blue-600" />
            <span>Community Stories</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Loved by NUB Students & Alumni
          </h2>
          <p className="mt-2 mb-4 text-slate-600 text-sm sm:text-base">
            Discover real stories of career breakthroughs and mentorship formed on NUB Alumni Connect.
          </p>
        </div>

        {/* Compact & Animated Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {reviews.map((review, index) => (
            <div
              key={index}
              className="group relative flex flex-col justify-between rounded-2xl p-6 bg-white border border-slate-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 hover:border-blue-300"
            >
              <div>
                {/* Top User Info Bar */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="relative flex-shrink-0">
                    <img
                      src={review.image}
                      alt={review.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-blue-500/20 group-hover:border-blue-600 transition-colors"
                    />
                    <FaCheckCircle className="absolute -bottom-1 -right-1 w-4 h-4 text-emerald-500 bg-white rounded-full" />
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="text-sm font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                      {review.name}
                    </h4>
                    <p className="text-xs text-slate-500 truncate">{review.role}</p>
                  </div>
                </div>

                {/* Quote Text */}
                <div className="relative mb-6">
                  <FaQuoteLeft className="w-4 h-4 text-blue-200 mb-2 group-hover:text-blue-400 transition-colors" />
                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed italic">
                    "{review.comment}"
                  </p>
                </div>
              </div>

              {/* Card Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-auto">
                {/* Badge Tag */}
                <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-md border ${review.badgeColor}`}>
                  {review.type === 'Alumni' ? <FaBuilding className="w-3 h-3" /> : <FaGraduationCap className="w-3 h-3" />}
                  {review.company !== 'NUB Undergraduate' ? review.company : review.batch}
                </span>

                {/* Stars */}
                <div className="flex gap-0.5 text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <FaStar key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}