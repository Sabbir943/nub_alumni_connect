'use client';

import React from 'react';
import { FaGraduationCap, FaBriefcase, FaComments, FaAward, FaArrowRight, FaRocket } from 'react-icons/fa';

export default function ImpactSection() {
  const stats = [
    {
      id: 1,
      icon: <FaGraduationCap className="w-6 h-6 text-blue-600" />,
      value: '2,500+',
      label: 'Verified Alumni',
      description: 'Connected across 18 countries in top tech & corporate hubs.',
      badgeBg: 'bg-blue-50',
      borderColor: 'hover:border-blue-300',
    },
    {
      id: 2,
      icon: <FaBriefcase className="w-6 h-6 text-emerald-600" />,
      value: '450+',
      label: 'Jobs & Internships',
      description: 'Exclusive refer-driven opportunities posted by NUB graduates.',
      badgeBg: 'bg-emerald-50',
      borderColor: 'hover:border-emerald-300',
    },
    {
      id: 3,
      icon: <FaComments className="w-6 h-6 text-indigo-600" />,
      value: '1,200+',
      label: 'Mentorship Hours',
      description: 'One-on-one resume reviews, mock interviews, and career guidance.',
      badgeBg: 'bg-indigo-50',
      borderColor: 'hover:border-indigo-300',
    },
    {
      id: 4,
      icon: <FaAward className="w-6 h-6 text-amber-600" />,
      value: '94%',
      label: 'Placement Support',
      description: 'Of active students secured interviews within 3 months of joining.',
      badgeBg: 'bg-amber-50',
      borderColor: 'hover:border-amber-300',
    },
  ];

  return (
    <section className="relative py-20 bg-slate-50/50 text-slate-800 border-y border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Block */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100/80 border border-blue-200 text-blue-700 text-xs font-bold tracking-wide uppercase mb-4">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            Empowering NUB Community
          </div>
          
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 leading-tight">
            Bridging the Gap Between <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Classroom & Industry
            </span>
          </h2>
          
          <p className="mt-4 mb-4 text-slate-600 text-base sm:text-lg font-normal leading-relaxed">
            NUB Alumni Connect drives real outcomes for students through peer-to-peer mentoring, candidate referrals, and transparent career pathways.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <div
              key={stat.id}
              className={`group p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 ${stat.borderColor}`}
            >
              <div className="flex flex-col justify-between h-full">
                <div>
                  {/* Icon Box */}
                  <div className={`w-12 h-12 rounded-xl ${stat.badgeBg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    {stat.icon}
                  </div>
                  
                  {/* Metric Value */}
                  <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-1">
                    {stat.value}
                  </h3>
                  
                  {/* Metric Label */}
                  <p className="text-sm font-bold text-blue-600 mb-3">
                    {stat.label}
                  </p>
                </div>

                {/* Metric Description */}
                <p className="text-xs text-slate-500 leading-relaxed border-t border-slate-100 pt-3 mt-2">
                  {stat.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Action Callout Banner */}
        <div className="mt-12 p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-xl shadow-blue-600/20 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-white/10 rounded-xl backdrop-blur-md hidden sm:block">
              <FaRocket className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="text-lg font-bold">Ready to take the next step in your career?</h4>
              <p className="text-sm text-blue-100 mt-0.5">Join over 2,000+ active NUB students and alumni working at top tech firms.</p>
            </div>
          </div>
          
          <a
            href="/signin"
            className="whitespace-nowrap px-6 py-3 rounded-xl bg-white text-blue-700 font-bold text-sm flex items-center gap-2 hover:bg-slate-100 transition-all shadow-md hover:gap-3"
          >
            Create Your Account <FaArrowRight className="w-4 h-4" />
          </a>
        </div>

      </div>
    </section>
  );
}