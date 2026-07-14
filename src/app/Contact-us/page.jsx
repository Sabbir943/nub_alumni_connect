'use client';

import React, { useState } from 'react';

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [status, setStatus] = useState({ loading: false, success: false, error: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, success: false, error: '' });

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      
      const res = await fetch(`${API_URL}/api/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        setStatus({ loading: false, success: true, error: '' });
        setFormData({ name: '', email: '', message: '' }); // Reset form
        
        // Hide success message after 5 seconds
        setTimeout(() => setStatus((prev) => ({ ...prev, success: false })), 5000);
      } else {
        setStatus({ loading: false, success: false, error: data.message || 'Something went wrong.' });
      }
    } catch (error) {
      console.error("Submission error:", error);
      setStatus({ loading: false, success: false, error: 'Failed to connect to the server.' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* Left Side: Contact Information */}
        <div className="bg-slate-900 p-8 md:p-12 lg:p-16 text-white flex flex-col justify-center">
          <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight mb-4">
            Get in touch
          </h2>
          <p className="text-slate-300 mb-10 text-sm lg:text-base leading-relaxed">
            Have questions about the alumni directory, networking events, or just want to connect? Fill out the form and we will get back to you shortly.
          </p>

          <div className="space-y-8">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center shrink-0">
                <span className="text-xl">📍</span>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Campus Location</h4>
                <p className="text-sm text-slate-400 mt-1">
                  Northern University Bangladesh<br />
                  Sher-e-Bangla Nagar, Dhaka
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center shrink-0">
                <span className="text-xl">📞</span>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Phone</h4>
                <p className="text-sm text-slate-400 mt-1">
                  +880 1234 567890
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center shrink-0">
                <span className="text-xl">✉️</span>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Email</h4>
                <p className="text-sm text-slate-400 mt-1">
                  alumni@nub.ac.bd
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Contact Form */}
        <div className="p-8 md:p-12 lg:p-16 flex flex-col justify-center bg-white">
          <h3 className="text-2xl font-bold text-slate-900 mb-6">Send a Message</h3>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name Field */}
            <div className="space-y-1.5">
              <label htmlFor="name" className="block text-sm font-semibold text-slate-700">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Enter your name"
                className="w-full px-4 py-3 text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Email Field */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="Enter your email"
                className="w-full px-4 py-3 text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Message Field */}
            <div className="space-y-1.5">
              <label htmlFor="message" className="block text-sm font-semibold text-slate-700">
                Your Message
              </label>
              <textarea
                id="message"
                name="message"
                rows="4"
                value={formData.message}
                onChange={handleChange}
                required
                placeholder="How can we help you?"
                className="w-full px-4 py-3 text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition-all resize-none placeholder:text-slate-400"
              ></textarea>
            </div>

            {/* Status Feedback */}
            {status.error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600">
                {status.error}
              </div>
            )}
            {status.success && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-sm text-emerald-700 font-medium">
                ✅ Thank you! Your message has been sent.
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={status.loading}
              className="w-full px-6 py-3.5 text-sm font-bold text-white bg-slate-900 rounded-xl hover:bg-indigo-600 focus:ring-4 focus:ring-indigo-600/20 active:bg-indigo-700 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2 mt-2"
            >
              {status.loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </span>
              ) : 'Send Message'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default ContactUs;