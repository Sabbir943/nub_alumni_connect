"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiMail, FiLock, FiArrowRight } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import toast, { Toaster } from 'react-hot-toast';
import { authClient } from '@/lib/auth-client';

const SignIn = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    fetch('/api/admin/seed').catch(() => {});
  }, []);

  const handleResend = async () => {
    setResending(true);
    try {
      const { error } = await authClient.sendVerificationEmail({
        email: formData.email,
        callbackURL: "/verify-email",
      });
      if (error) throw error;
      setResent(true);
    } catch (err) {
      toast.error(err.message || 'Failed to resend verification email');
    } finally {
      setResending(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === 'email' || name === 'password') {
      setNeedsVerification(false);
      setResent(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await authClient.signIn.email({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        console.error('Sign in error:', JSON.stringify(error));
        if (error.code === 'EMAIL_NOT_VERIFIED' || error.message === 'Email not verified') {
          setNeedsVerification(true);
          return;
        }
        const msg = error.message || error.statusText || 'Invalid email or password.';
        toast.error(msg);
        return;
      }

      toast.success('Successfully logged in!');

      try {
        await fetch('/api/admin/init', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formData.email, password: formData.password }),
        });
      } catch {}

      setTimeout(() => router.push('/dashboard'), 1500);
    } catch (err) {
      toast.error(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      toast.loading('Connecting to Google...');
      await authClient.signIn.social({ provider: "google" });
      toast.success('Successfully logged in with Google!');
      setTimeout(() => router.push('/dashboard'), 1500);
    } catch (err) {
      toast.error('Google authentication failed.');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center bg-white dark:bg-zinc-950 px-4">
      <Toaster position="top-center" reverseOrder={false} />
      
      <div className="w-full max-w-md space-y-6 bg-zinc-50 dark:bg-zinc-900/40 p-8 rounded-2xl border border-zinc-200/60 dark:border-zinc-800 shadow-xl shadow-zinc-100/10 dark:shadow-none">
        
        {/* Header Text */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">Welcome Back</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Enter your credentials to access NUB Nexus</p>
        </div>

        {/* Input Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400"><FiMail /></span>
              <input 
                type="email" name="email" required value={formData.email} onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-zinc-100 transition-all"
                placeholder="student@nub.ac.bd"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400"><FiLock /></span>
              <input 
                type="password" name="password" required value={formData.password} onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-zinc-100 transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit" disabled={loading}
            className="w-full mt-2 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition-all shadow-md shadow-blue-600/10 disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In'} <FiArrowRight />
          </button>

          {needsVerification && (
            <div className="mt-2 p-4 rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/40 text-xs text-amber-800 dark:text-amber-300 space-y-3">
              <p className="font-semibold">Your email hasn&apos;t been verified yet.</p>
              <p>Please check your inbox for the verification link we sent you{resent ? '' : ' (or request a new one below)'}.</p>
              <button
                type="button"
                onClick={handleResend}
                disabled={resending || resent}
                className="w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white font-semibold py-2 rounded-lg transition-all"
              >
                <FiMail />
                {resending ? 'Sending…' : resent ? 'Verification email sent!' : 'Resend verification email'}
              </button>
            </div>
          )}
        </form>

        {/* Separator Divider Line */}
        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800"></div>
          <span className="flex-shrink mx-4 text-zinc-400 text-xs tracking-wider uppercase font-medium">Or continue with</span>
          <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800"></div>
        </div>

        {/* OAuth Buttons */}
        <button 
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 bg-white hover:bg-zinc-50 dark:bg-zinc-950 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 font-semibold py-2.5 rounded-xl transition-all"
        >
          <FcGoogle className="w-5 h-5" /> Google Account
        </button>

        
        <p className="text-center text-xs text-zinc-500 dark:text-zinc-400 pt-2">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
            Register here
          </Link>
        </p>

      </div>
    </div>
  );
};

export default SignIn;