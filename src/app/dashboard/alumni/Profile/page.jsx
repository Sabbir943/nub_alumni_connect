"use client";
import React, { useState, useEffect } from "react";
import {
  FiUser,
  FiMail,
  FiCalendar,
  FiBookOpen,
  FiHash,
  FiMapPin,
  FiBriefcase,
  FiLinkedin,
  FiFileText,
  FiPhone,
  FiGlobe,
  FiCheckCircle,
  FiEdit3,
  FiLink,
  FiLoader,
  FiAlertCircle,
} from "react-icons/fi";
import toast, { Toaster } from "react-hot-toast";
import { authClient } from "@/lib/auth-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const INITIAL_FORM = {
  profilePictureUrl: "",
  graduationYear: "",
  degree: "CSE",
  studentId: "",
  currentLocation: "",
  organization: "",
  jobTitle: "",
  linkedinUrl: "",
  bio: "",
  contactNumber: "",
  skills: "",
  facebookUrl: "",
  twitterUrl: "",
};

const DEGREE_OPTIONS = [
  { value: "CSE", label: "B.Sc. in CSE" },
  { value: "BBA", label: "Bachelor of BBA" },
  { value: "EEE", label: "B.Sc. in EEE" },
  { value: "MCA", label: "MCA (Master of Computer Application)" },
];

function FieldIcon({ icon: Icon, className = "" }) {
  return <Icon className={`w-4 h-4 shrink-0 ${className}`} />;
}

function InputField({ label, icon, required, children }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-400">
          <FieldIcon icon={icon} />
        </span>
        {children}
      </div>
    </div>
  );
}

function fieldClass(extra = "") {
  return `w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none dark:text-white transition-all ${extra}`;
}

export default function ProfilePage() {
  const { data: session, isPending } = authClient.useSession();
  const user = session?.user;

  const [view, setView] = useState("loading"); // loading | create | view | edit
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);

  // Fetch existing profile on mount
  useEffect(() => {
    if (!user?.email || isPending) return;

    fetch(`${API_URL}/api/alumni-directory/check/${user.email}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.exists && res.profile) {
          setFormData((prev) => ({ ...prev, ...res.profile }));
          setView("view");
        } else {
          setView("create");
        }
      })
      .catch(() => setView("create"));
  }, [user, isPending]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return toast.error("You must be logged in.");
    setSaving(true);

    const payload = { ...formData, fullName: user.name, email: user.email };
    const isEdit = view === "edit";
    const endpoint = isEdit
      ? `${API_URL}/api/alumni-directory/${user.email}`
      : `${API_URL}/api/alumni-directory`;

    try {
      const res = await fetch(endpoint, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok) {
        toast.success(isEdit ? "Profile updated!" : "Profile created!");
        setView("view");
      } else {
        toast.error(data.message || "Something went wrong.");
      }
    } catch {
      toast.error("Could not connect to server.");
    } finally {
      setSaving(false);
    }
  };

  // --- Loading spinner ---
  if (view === "loading" || isPending) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <FiLoader className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  // --- Profile created / view screen ---
  if (view === "view") {
    return (
      <div className="max-w-2xl mx-auto">
        <Toaster position="top-center" />
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-8 text-center">
          {/* Success Icon */}
          <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-5">
            <FiCheckCircle className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
            Profile is Live
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 max-w-sm mx-auto">
            Your alumni profile has been saved successfully. You can update it
            anytime.
          </p>

          {/* Profile Preview */}
          <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800">
            {formData.profilePictureUrl && (
              <img
                src={formData.profilePictureUrl}
                alt={user?.name}
                className="w-20 h-20 rounded-full object-cover mx-auto mb-4 border-2 border-blue-500"
                onError={(e) => (e.target.style.display = "none")}
              />
            )}

            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
              {user?.name}
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {formData.jobTitle || "Alumni"}
              {formData.organization && ` at ${formData.organization}`}
            </p>

            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {formData.degree && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  <FiBookOpen className="w-3 h-3" />
                  {DEGREE_OPTIONS.find((d) => d.value === formData.degree)
                    ?.label || formData.degree}
                </span>
              )}
              {formData.graduationYear && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  <FiCalendar className="w-3 h-3" />
                  {formData.graduationYear}
                </span>
              )}
              {formData.currentLocation && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  <FiMapPin className="w-3 h-3" />
                  {formData.currentLocation}
                </span>
              )}
            </div>

            {formData.skills && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-3">
                {formData.skills}
              </p>
            )}
          </div>

          {/* Edit Button */}
          <div className="mt-6">
            <button
              onClick={() => setView("edit")}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors"
            >
              <FiEdit3 className="w-4 h-4" /> Edit Profile
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Create / Edit Form ---
  const isEdit = view === "edit";

  return (
    <div className="max-w-3xl mx-auto">
      <Toaster position="top-center" />

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-6 md:px-8 py-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-white">
              {isEdit ? "Edit Alumni Profile" : "Create Alumni Profile"}
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
              {isEdit
                ? "Update your professional details."
                : "Fill in your details to join the alumni network."}
            </p>
          </div>
          {isEdit && (
            <button
              onClick={() => setView("view")}
              className="text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-white underline"
            >
              Cancel
            </button>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
          {/* Profile Picture URL */}
          <div className="flex flex-col sm:flex-row items-center gap-4 bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60">
            <div className="w-20 h-20 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center overflow-hidden border-2 border-blue-500 shrink-0">
              {formData.profilePictureUrl ? (
                <img
                  src={formData.profilePictureUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = "";
                    e.target.style.display = "none";
                  }}
                />
              ) : (
                <FiUser className="w-8 h-8 text-zinc-400" />
              )}
            </div>
            <div className="space-y-1.5 w-full text-center sm:text-left">
              <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                Profile Photo URL
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Paste a direct link to your photo
              </p>
              <input
                type="url"
                name="profilePictureUrl"
                value={formData.profilePictureUrl}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none dark:text-white"
                placeholder="https://example.com/photo.jpg"
              />
            </div>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <InputField label="Full Name" icon={FiUser}>
              <input
                type="text"
                disabled
                value={user?.name || ""}
                className={fieldClass(
                  "bg-zinc-100 dark:bg-zinc-800/50 text-zinc-500 cursor-not-allowed"
                )}
              />
            </InputField>

            <InputField label="Email" icon={FiMail}>
              <input
                type="email"
                disabled
                value={user?.email || ""}
                className={fieldClass(
                  "bg-zinc-100 dark:bg-zinc-800/50 text-zinc-500 cursor-not-allowed"
                )}
              />
            </InputField>

            <InputField label="Student ID" icon={FiHash} required>
              <input
                type="text"
                name="studentId"
                required
                value={formData.studentId}
                onChange={handleChange}
                className={fieldClass()}
                placeholder="e.g., 04210300"
              />
            </InputField>

            <InputField label="Degree / Program" icon={FiBookOpen} required>
              <select
                name="degree"
                value={formData.degree}
                onChange={handleChange}
                className={`${fieldClass()} appearance-none cursor-pointer`}
              >
                {DEGREE_OPTIONS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </InputField>

            <InputField label="Graduation Year" icon={FiCalendar} required>
              <input
                type="number"
                name="graduationYear"
                required
                min="2000"
                max="2035"
                value={formData.graduationYear}
                onChange={handleChange}
                className={fieldClass()}
                placeholder="e.g., 2024"
              />
            </InputField>

            <InputField label="Contact Number" icon={FiPhone} required>
              <input
                type="tel"
                name="contactNumber"
                required
                value={formData.contactNumber}
                onChange={handleChange}
                className={fieldClass()}
                placeholder="+8801XXXXXXXX"
              />
            </InputField>
          </div>

          {/* Professional Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <InputField label="Company / Organization" icon={FiBriefcase} required>
              <input
                type="text"
                name="organization"
                required
                value={formData.organization}
                onChange={handleChange}
                className={fieldClass()}
                placeholder="e.g., Brain Station 23"
              />
            </InputField>

            <InputField label="Job Title" icon={FiUser} required>
              <input
                type="text"
                name="jobTitle"
                required
                value={formData.jobTitle}
                onChange={handleChange}
                className={fieldClass()}
                placeholder="e.g., Software Engineer"
              />
            </InputField>

            <InputField label="Location" icon={FiMapPin} required>
              <input
                type="text"
                name="currentLocation"
                required
                value={formData.currentLocation}
                onChange={handleChange}
                className={fieldClass()}
                placeholder="e.g., Dhaka, Bangladesh"
              />
            </InputField>

            <InputField label="Skills" icon={FiFileText} required>
              <input
                type="text"
                name="skills"
                required
                value={formData.skills}
                onChange={handleChange}
                className={fieldClass()}
                placeholder="React, Node.js, MongoDB"
              />
            </InputField>
          </div>

          {/* Social Links */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <InputField label="LinkedIn" icon={FiLinkedin} required>
              <input
                type="url"
                name="linkedinUrl"
                required
                value={formData.linkedinUrl}
                onChange={handleChange}
                className={fieldClass()}
                placeholder="https://linkedin.com/in/..."
              />
            </InputField>

            <InputField label="Facebook" icon={FiGlobe}>
              <input
                type="url"
                name="facebookUrl"
                value={formData.facebookUrl}
                onChange={handleChange}
                className={fieldClass()}
                placeholder="https://facebook.com/..."
              />
            </InputField>

            <InputField label="Twitter / X" icon={FiGlobe}>
              <input
                type="url"
                name="twitterUrl"
                value={formData.twitterUrl}
                onChange={handleChange}
                className={fieldClass()}
                placeholder="https://x.com/..."
              />
            </InputField>
          </div>

          {/* Bio */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1">
              Short Bio <span className="text-red-500">*</span>
            </label>
            <textarea
              name="bio"
              required
              rows="3"
              value={formData.bio}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none dark:text-white resize-none"
              placeholder="Tell the community about your journey..."
            />
          </div>

          {/* Submit */}
          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-8 py-3 rounded-xl transition-colors disabled:opacity-50"
            >
              {saving ? (
                <>
                  <FiLoader className="w-4 h-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <FiCheckCircle className="w-4 h-4" />
                  {isEdit ? "Save Changes" : "Publish Profile"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
