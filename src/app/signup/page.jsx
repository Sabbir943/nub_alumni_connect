"use client";
import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiUser, FiMail, FiLock, FiImage, FiBriefcase, FiArrowRight, FiCamera, FiX } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import toast, { Toaster } from 'react-hot-toast';
import { authClient } from '@/lib/auth-client';
import { uploadImage } from '@/lib/upload';

const SignUpPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState('');
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    photoUrl: '',
    role: 'Student',
    password: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB.');
      return;
    }
    setUploading(true);
    try {
      const url = await uploadImage(file);
      setFormData((prev) => ({ ...prev, photoUrl: url }));
      setPreview(url);
      toast.success('Image uploaded!');
    } catch (err) {
      toast.error(err.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setFormData((prev) => ({ ...prev, photoUrl: '' }));
    setPreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Explicit Client-Side Password Rules Testing Engine
  const validatePasswordRules = (pass) => {
    const hasUpper = /[A-Z]/.test(pass);
    const hasLower = /[a-z]/.test(pass);
    const hasLength = pass.length >= 8;

    if (!hasLength) return 'Password must be at least 8 characters long.';
    if (!hasUpper) return 'Password must contain at least one uppercase letter.';
    if (!hasLower) return 'Password must contain at least one lowercase letter.';
    return null;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    // Evaluate Validation Requirements
    const passwordError = validatePasswordRules(formData.password);
    if (passwordError) {
      toast.error(passwordError, { duration: 4000 });
      return;
    }

    if (!formData.photoUrl) {
      toast.error('Profile photo is required.');
      return;
    }

    setLoading(true);
    try {
      const signUpData = {
        email: formData.email,
        password: formData.password,
        name: formData.name,
      };

      if (formData.photoUrl) {
        signUpData.image = formData.photoUrl;
      }

      const { data, error } = await authClient.signUp.email(signUpData);

      if (error) {
        console.error('Sign up error:', error);
        toast.error(error.message || 'Registration failed. Try again.');
        return;
      }

      // Set role on server side after successful signup
      try {
        await fetch('/api/auth/set-role', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formData.email, role: formData.role }),
        });
      } catch {}

      toast.success('Account registered successfully! Please sign in.');
      setTimeout(() => router.push('/signin'), 1500);
    } catch (err) {
      toast.error(err.message || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };
    const handleGoogleLogin = async () => {
    try {
      toast.loading('Connecting to Google...');
      await authClient.signIn.social({ provider: "google" });
      toast.success('Successfully signed in with Google!');
      setTimeout(() => router.push('/dashboard'), 1500);
    } catch (err) {
      toast.error('Google authentication failed.');
    }
  }; 
  return (
    <div className="min-h-[90vh] flex items-center justify-center bg-white dark:bg-zinc-950 px-4 py-8">
      <Toaster position="top-center" reverseOrder={false} />

      <div className="w-full max-w-md space-y-5 bg-zinc-50 dark:bg-zinc-900/40 p-8 rounded-2xl border border-zinc-200/60 dark:border-zinc-800 shadow-xl shadow-zinc-100/10 dark:shadow-none">
        
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">Create Account</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Join Northern University Bangladesh web network</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-3.5">
          {/* Full Name field */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Full Name</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400"><FiUser /></span>
              <input 
                type="text" name="name" required value={formData.name} onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-zinc-100 transition-all"
                placeholder="Md Sabbir Ahmad"
              />
            </div>
          </div>

          {/* Email Address field */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400"><FiMail /></span>
              <input 
                type="email" name="email" required value={formData.email} onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-zinc-100 transition-all"
                placeholder="sabbir@nub.edu"
              />
            </div>
          </div>

          {/* Photo Upload field */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Profile Photo <span className="text-red-500">*</span></label>
            <div className="relative">
              {preview || formData.photoUrl ? (
                <div className="flex items-center gap-3 p-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl">
                  <img src={preview || formData.photoUrl} alt="Preview" className="w-12 h-12 rounded-lg object-cover" />
                  <span className="flex-1 text-xs text-zinc-500 truncate">Photo selected</span>
                  <button type="button" onClick={handleRemoveImage} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                    <FiX className="w-4 h-4 text-zinc-400" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full flex items-center gap-3 px-4 py-2.5 bg-white dark:bg-zinc-950 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl text-sm hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
                >
                  <FiCamera className="w-5 h-5 text-zinc-400" />
                  <span className="text-zinc-500 dark:text-zinc-400">
                    {uploading ? 'Uploading...' : 'Choose a photo from your computer'}
                  </span>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Role Selection Dropdown Menu option list */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Account Type</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400"><FiBriefcase /></span>
              <select 
                name="role" value={formData.role} onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-zinc-100 transition-all appearance-none cursor-pointer"
              >
                <option value="Student">Student</option>
                <option value="Alumni">Alumni</option>
              </select>
            </div>
          </div>

          {/* Password field */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400"><FiLock /></span>
              <input 
                type="password" name="password" required value={formData.password} onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-zinc-100 transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit" disabled={loading}
            className="w-full mt-2 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition-all shadow-md shadow-blue-600/10 disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Register'} <FiArrowRight />
          </button>
        </form>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800"></div>
          <span className="flex-shrink mx-4 text-zinc-400 text-xs uppercase tracking-wider font-medium">Or</span>
          <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800"></div>
        </div>

        <button 
         onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 bg-white hover:bg-zinc-50 dark:bg-zinc-950 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 font-semibold py-2.5 rounded-xl transition-all"
        >
          <FcGoogle className="w-5 h-5" /> Join with Google
        </button>

        <p className="text-center text-xs text-zinc-500 dark:text-zinc-400 pt-1">
          Already have an account?{' '}
          <Link href="/signin" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
            Login here
          </Link>
        </p>

      </div>
    </div>
  );
};

export default SignUpPage;