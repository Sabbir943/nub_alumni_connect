"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiChevronLeft, FiChevronRight, FiArrowRight } from 'react-icons/fi';

const HeroSlider = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      id: 1,
      tagline: "Welcome to NUB Nexus",
      title: "Bridging the Gap Between Students & Alumni",
      description: "Unlock professional growth, direct mentorship opportunities, and a powerful network built exclusively for the Northern University Bangladesh community.",
      ctaText: "Explore Platform",
      ctaLink: "/directory",
      imageUrl: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80",
      bgGradient: "from-blue-600 via-indigo-900 to-zinc-950",
    },
    {
      id: 2,
      tagline: "Career Development",
      title: "Land Internships & Verified Tech Jobs",
      description: "Browse curated job postings, entry-level roles, and freelancing tracks submitted straight from established NUB graduates working across major tech firms.",
      ctaText: "Browse Listings",
      ctaLink: "/jobs",
      imageUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80",
      bgGradient: "from-indigo-800 via-purple-950 to-zinc-950",
    },
    {
      id: 3,
      tagline: "Knowledge Sharing",
      title: "1-on-1 Strategic Mentorship Network",
      description: "Accelerate your software engineering or technical track. Book review sessions with seniors who navigated your exact courses and cracked industry interviews.",
      ctaText: "Get Mentored",
      ctaLink: "/directory",
      imageUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80",
      bgGradient: "from-slate-900 via-blue-950 to-zinc-950",
    },
  ];

  // Auto-play timing set to 8000ms (8 seconds) for a relaxed layout pace
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 8000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <div className="relative w-full h-[540px] md:h-[500px] bg-zinc-950 overflow-hidden">
      
      {/* Slides Viewport */}
      <div className="relative w-full h-full">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 w-full h-full flex items-center transition-all duration-1000 ease-in-out ${
              index === currentSlide 
                ? "opacity-100 translate-x-0 pointer-events-auto z-20" 
                : "opacity-0 translate-x-4 pointer-events-none z-10"
            }`}
          >
            {/* Dynamic Glass Gradient Background Layer */}
            <div className={`absolute inset-0 bg-gradient-to-r ${slide.bgGradient} opacity-95`} />
            
            {/* Layout Grid Wrapper */}
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center text-white">
              
              {/* Left Side: Typography Information */}
              <div className="space-y-4 max-w-xl">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold bg-white/10 backdrop-blur-md text-blue-300 border border-white/10 tracking-wider uppercase">
                  {slide.tagline}
                </span>

                <h1 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
                  {slide.title}
                </h1>

                <p className="text-zinc-300 text-sm md:text-base font-normal leading-relaxed">
                  {slide.description}
                </p>

                <div className="pt-2">
                  <Link 
                    href={slide.ctaLink} 
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-5 py-3 rounded-xl transition-all duration-300 shadow-lg shadow-blue-600/10 hover:-translate-y-0.5"
                  >
                    {slide.ctaText}
                    <FiArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Right Side: Showcase Image Block */}
              <div className="hidden md:block relative h-[320px] lg:h-[360px] w-full rounded-2xl overflow-hidden shadow-2xl border border-white/10 group">
                <img 
                  src={slide.imageUrl} 
                  alt={slide.title} 
                  className="w-full h-full object-cover transform scale-100 transition-transform duration-1000 ease-in-out group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-zinc-950/20" />
              </div>

            </div>
          </div>
        ))}
      </div>

      {/* Manual Controller Navigation Arrows */}
      <button
        onClick={() => setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1))}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-2.5 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-md text-white border border-white/5 transition-colors hidden lg:block"
        aria-label="Previous Slide"
      >
        <FiChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={() => setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1))}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-2.5 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-md text-white border border-white/5 transition-colors hidden lg:block"
        aria-label="Next Slide"
      >
        <FiChevronRight className="w-5 h-5" />
      </button>

      {/* Bottom Progress Bars */}
      <div className="absolute bottom-6 left-0 right-0 z-30 flex justify-center space-x-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              index === currentSlide ? "w-6 bg-blue-500" : "w-1.5 bg-white/30"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

    </div>
  );
};

export default HeroSlider;