"use client";
import React, { useState, useEffect } from 'react';
import { 
  FiUser, FiMail, FiCalendar, FiBookOpen, FiHash, 
  FiMapPin, FiBriefcase, FiLinkedin, FiFileText, FiPhone, 
  FiGlobe, FiCpu, FiCamera, FiCheckCircle, FiAlertTriangle, FiEdit3
} from 'react-icons/fi';
import toast, { Toaster } from 'react-hot-toast';
import { authClient } from '@/lib/auth-client';

const CreateProfile = () => {
  const { data: session, isPending } = authClient.useSession();
  const user = session?.user;

  // Track if user already created a profile
  const [hasProfile, setHasProfile] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);

  // State Management for all form fields
  const [formData, setFormData] = useState({
    graduationYear: '',
    degree: 'B.Sc. in CSE',
    studentId: '',
    currentLocation: '',
    organization: '',
    jobTitle: '',
    linkedinUrl: '',
    bio: '',
    contactNumber: '',
    skills: '',
    facebookUrl: '',
    twitterUrl: ''
  });

  const [profileImage, setProfileImage] = useState(null);
  const [loading, setLoading] = useState(false);

  // Check if profile already exists when user session is available
  useEffect(() => {
    const checkExistingProfile = async () => {
      if (!user?.email) return;
      try {
        const response = await fetch(`http://localhost:8000/api/alumni-directory/check/${user.email}`);
        const result = await response.json();
        if (result.exists) {
          setHasProfile(true);
        }
      } catch (error) {
        console.error("Error checking profile status:", error);
      } finally {
        setCheckingProfile(false);
      }
    };

    if (!isPending && user) {
      checkExistingProfile();
    } else if (!isPending && !user) {
      setCheckingProfile(false); // No user session found
    }
  }, [user, isPending]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      toast.success("Image selected successfully!");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error("You must be logged in to save a profile.");
      return;
    }
    setLoading(true);

    const dataToSend = new FormData();
    
    // Explicitly add auto-filled session details for backend processing
    dataToSend.append('fullName', user.name || '');
    dataToSend.append('email', user.email || '');

    Object.keys(formData).forEach(key => {
      dataToSend.append(key, formData[key]);
    });
    
    if (profileImage) {
      dataToSend.append('profilePicture', profileImage);
    }

    try {
      const response = await fetch('http://localhost:8000/api/alumni-directory', {
        method: 'POST',
        body: dataToSend
      });
  
      const result = await response.json();

      if (response.ok) {
        toast.success('Alumni Profile saved successfully!');
        setHasProfile(true); // Switch to "Already Created" layout right away
      } else {
        toast.error(result.message || 'Something went wrong while saving.');
      }
    } catch (error) {
      console.error("Submission Error:", error);
      toast.error('Could not connect to the backend server.');
    } finally {
      setLoading(false);
    }
  };

  // Loading spinner while verifying auth states and profile availability
  if (isPending || checkingProfile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // SHOW REDIRECT/EDIT UI IF PROFILE ALREADY EXISTS
  if (hasProfile) {
    return (
      <div className="max-w-2xl mx-auto bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl p-8 text-center transition-colors duration-300">
        <Toaster position="top-center" />
        <div className="w-16 h-16 bg-amber-50 dark:bg-amber-950/30 text-amber-500 dark:text-amber-400 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl border border-amber-200 dark:border-amber-900/50">
          <FiAlertTriangle />
        </div>
        <h2 className="text-xl md:text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
          Profile Already Created!
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-3 max-w-md mx-auto leading-relaxed">
          Hi, <span className="font-semibold text-zinc-700 dark:text-zinc-300">{user?.name}</span>. You have already completed your profile structure. To make updates or fix errors, please head directly to the edit page.
        </p>
        
        <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row gap-3 justify-center">
          <button 
            onClick={() => toast('Edit feature coming soon!', { icon: '⚙️' })}
            className="inline-flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 text-xs font-bold px-6 py-3.5 rounded-xl transition-all shadow-md"
          >
            <FiEdit3 className="text-sm" /> Edit Your Profile
          </button>
        </div>
      </div>
    );
  }

  // RENDER ORIGINAL REGISTRATION FORM IF NO PROFILE EXISTS
  return (
    <div className="max-w-4xl mx-auto bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden p-6 md:p-10 transition-colors duration-300">
      <Toaster position="top-center" />
      
      {/* Header Section */}
      <div className="border-b border-zinc-100 dark:border-zinc-800 pb-6 mb-8">
        <h1 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
          Complete Your Alumni Profile
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Provide your professional background to network with current NUB students.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* 1. PROFILE PICTURE UPLOAD AREA */}
        <div className="flex flex-col sm:flex-row items-center gap-5 bg-zinc-50 dark:bg-zinc-950 p-5 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60">
          <div className="relative w-24 h-24 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center overflow-hidden border-2 border-blue-500">
            {profileImage ? (
              <img src={URL.createObjectURL(profileImage)} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <FiUser className="w-10 h-10 text-zinc-400" />
            )}
          </div>
          <div className="space-y-2 text-center sm:text-left">
            <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Profile Display Image</h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">JPG, PNG, or WebP formats are accepted (Optional).</p>
            <label className="inline-flex items-center gap-2 cursor-pointer bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-4 py-2 rounded-xl text-xs font-bold border border-zinc-200 dark:border-zinc-700 transition-colors">
              <FiCamera /> Choose Photo
              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </label>
          </div>
        </div>

        {/* 2. INSTITUTIONAL & ACADEMIC INPUTS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Full Name</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-400"><FiUser /></span>
              <input type="text" disabled value={user?.name || ''} className="w-full pl-10 pr-4 py-3 bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-500 cursor-not-allowed outline-none" />
            </div>
          </div>

          {/* Email Address */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-400"><FiMail /></span>
              <input type="email" disabled value={user?.email || ''} className="w-full pl-10 pr-4 py-3 bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-500 cursor-not-allowed outline-none" />
            </div>
          </div>

          {/* Student ID */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Student ID / Reg No. <span className="text-red-500">*</span></label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-400"><FiHash /></span>
              <input type="text" name="studentId" required value={formData.studentId} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white transition-all" placeholder="e.g., 04210300..." />
            </div>
          </div>

          {/* Degree Track */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Degree / Program <span className="text-red-500">*</span></label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-400"><FiBookOpen /></span>
              <select name="degree" value={formData.degree} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white transition-all appearance-none">
                <option value="B.Sc. in CSE">B.Sc. in CSE</option>
                <option value="Bachelor of BBA">Bachelor of BBA</option>
                <option value="B.Sc. in EEE">B.Sc. in EEE</option>
                <option value="Master of Computer Application (MCA)">MCA</option>
              </select>
            </div>
          </div>

          {/* Graduation Year */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Graduation Year <span className="text-red-500">*</span></label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-400"><FiCalendar /></span>
              <input type="number" name="graduationYear" required min="2000" max="2035" value={formData.graduationYear} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white transition-all" placeholder="e.g., 2024" />
            </div>
          </div>

          {/* Contact Number */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Contact Number <span className="text-red-500">*</span></label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-400"><FiPhone /></span>
              <input type="tel" name="contactNumber" required value={formData.contactNumber} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white transition-all" placeholder="e.g., +88017XXXXXXXX" />
            </div>
          </div>
        </div>

        {/* 3. PROFESSIONAL TRACK INPUTS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Current Employment */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Current Employment / Company <span className="text-red-500">*</span></label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-400"><FiBriefcase /></span>
              <input type="text" name="organization" required value={formData.organization} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white transition-all" placeholder="e.g., Brain Station 23 / Google" />
            </div>
          </div>

          {/* Job Designation */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Job Title / Designation <span className="text-red-500">*</span></label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-400"><FiUser /></span>
              <input type="text" name="jobTitle" required value={formData.jobTitle} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white transition-all" placeholder="e.g., Software Engineer" />
            </div>
          </div>

          {/* Current Location */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Current Location (City, Country) <span className="text-red-500">*</span></label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-400"><FiMapPin /></span>
              <input type="text" name="currentLocation" required value={formData.currentLocation} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white transition-all" placeholder="e.g., Dhaka, Bangladesh" />
            </div>
          </div>

          {/* Skills Area */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Skills / Areas of Expertise <span className="text-red-500">*</span></label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-400"><FiCpu /></span>
              <input type="text" name="skills" required value={formData.skills} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white transition-all" placeholder="e.g., React, Next.js, Node.js, MongoDB" />
            </div>
          </div>
        </div>

        {/* 4. SOCIAL CONNECTIONS & LINKS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {/* LinkedIn Profile */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">LinkedIn URL <span className="text-red-500">*</span></label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-blue-500"><FiLinkedin /></span>
              <input type="url" name="linkedinUrl" required value={formData.linkedinUrl} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white transition-all" placeholder="https://linkedin.com/in/..." />
            </div>
          </div>

          {/* Facebook URL */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Facebook URL <span className="text-zinc-400 text-[10px]">(Optional)</span></label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-400"><FiGlobe /></span>
              <input type="url" name="facebookUrl" value={formData.facebookUrl} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white transition-all" placeholder="https://facebook.com/..." />
            </div>
          </div>

          {/* Twitter URL */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Twitter URL <span className="text-zinc-400 text-[10px]">(Optional)</span></label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-400"><FiGlobe /></span>
              <input type="url" name="twitterUrl" value={formData.twitterUrl} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white transition-all" placeholder="https://twitter.com/..." />
            </div>
          </div>
        </div>

        {/* 5. BIO PARAGRAPH AREA */}
        <div className="space-y-1.5 pt-2">
          <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Personal Bio / Short Intro <span className="text-red-500">*</span></label>
          <div className="relative">
            <span className="absolute top-3.5 left-3.5 text-zinc-400"><FiFileText /></span>
            <textarea name="bio" required rows="4" value={formData.bio} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white transition-all resize-none" placeholder="Tell the community about your journey..." />
          </div>
        </div>

        {/* Submit Button Trigger */}
        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
          <button type="submit" disabled={loading} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold px-8 py-3.5 rounded-xl transition-all hover:shadow-lg hover:shadow-blue-600/10 disabled:opacity-50">
            {loading ? 'Saving Data...' : (
              <>
                <FiCheckCircle className="text-lg" /> Save Profile Details
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
};

export default CreateProfile;