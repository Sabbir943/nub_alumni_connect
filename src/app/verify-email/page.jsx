"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { FiMail, FiCheckCircle, FiAlertCircle, FiArrowRight, FiLoader } from "react-icons/fi";
import { authClient } from "@/lib/auth-client";

const ERROR_MESSAGES = {
  EMAIL_ALREADY_VERIFIED: "This email is already verified. You can sign in now.",
  TOKEN_EXPIRED: "This verification link has expired. Request a new one below.",
  INVALID_TOKEN: "This verification link is invalid or has already been used.",
  USER_NOT_FOUND: "We couldn't find an account for this email.",
  INVALID_USER: "This link doesn't match the signed-in account.",
};

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const ran = useRef(false);

  const error = searchParams.get("error");

  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (ran.current) return;
    if (error || isPending) return;
    ran.current = true;
    if (session) {
      setTimeout(() => router.replace("/dashboard"), 1200);
    }
  }, [session, isPending, error, router]);

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    try {
      const { error: sendError } = await authClient.sendVerificationEmail({
        email,
        callbackURL: "/verify-email",
      });
      if (sendError) throw sendError;
      setResent(true);
    } catch (err) {
      console.error("Resend failed:", err);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 text-center shadow-xl">
        {isPending && (
          <div className="flex flex-col items-center gap-3">
            <FiLoader className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-sm text-zinc-500">Verifying your email…</p>
          </div>
        )}

        {!isPending && !error && session && (
          <>
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mx-auto mb-4">
              <FiCheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h1 className="text-xl font-black text-zinc-900 dark:text-zinc-100">Email verified!</h1>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Your email has been confirmed. Taking you to your dashboard…
            </p>
            <Link
              href="/dashboard"
              className="mt-6 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-6 rounded-xl transition-all"
            >
              Go to dashboard <FiArrowRight />
            </Link>
          </>
        )}

        {!isPending && !error && !session && (
          <>
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mx-auto mb-4">
              <FiCheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h1 className="text-xl font-black text-zinc-900 dark:text-zinc-100">Email verified!</h1>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Your email has been confirmed. You can now sign in.
            </p>
            <Link
              href="/signin"
              className="mt-6 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-6 rounded-xl transition-all"
            >
              Sign in <FiArrowRight />
            </Link>
          </>
        )}

        {!isPending && error && (
          <>
            <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center mx-auto mb-4">
              <FiAlertCircle className="w-8 h-8 text-amber-600 dark:text-amber-400" />
            </div>
            <h1 className="text-xl font-black text-zinc-900 dark:text-zinc-100">Verification failed</h1>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              {ERROR_MESSAGES[error] || "Something went wrong while verifying your email."}
            </p>

            <div className="mt-6 text-left">
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@nub.ac.bd"
                className="w-full mt-1 px-4 py-2.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-zinc-100"
              />
              <button
                onClick={handleResend}
                disabled={resending || !email}
                className="w-full mt-3 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-all"
              >
                <FiMail />
                {resending ? "Sending…" : resent ? "Verification email sent!" : "Resend verification email"}
              </button>
            </div>

            <Link
              href="/signin"
              className="mt-4 inline-block text-sm text-blue-600 dark:text-blue-400 font-semibold hover:underline"
            >
              Back to sign in
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[75vh] flex items-center justify-center">
          <FiLoader className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}