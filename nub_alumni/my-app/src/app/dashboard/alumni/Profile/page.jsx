"use client";
import React, { useState, useEffect, useRef } from "react";
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
  FiShield,
  FiRefreshCw,
  FiCamera,
  FiX,
} from "react-icons/fi";
import toast, { Toaster } from "react-hot-toast";
import { authClient } from "@/lib/auth-client";
import { apiFetch } from "@/lib/api";
import { uploadImage } from "@/lib/upload";

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
  isMentor: false,
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

function VerificationBadgeInline({ verification }) {
  if (!verification) {
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-zinc-100 text-zinc-500 text-xs font-semibold border border-zinc-200">
        <FiShield className="w-3.5 h-3.5" />
        Not Verified
      </span>
    );
  }
  const { badge, trustScore, breakdown, analysis, flags, linkValidation } = verification;
  const colors = {
    Verified: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", bar: "bg-emerald-500" },
    Unverified: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", bar: "bg-amber-500" },
    Suspicious: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", bar: "bg-red-500" },
  };
  const c = colors[badge] || colors.Unverified;

  return (
    <div className={`p-4 rounded-xl border ${c.border} ${c.bg}`}>
      <div className="flex items-center gap-2 mb-2">
        <FiShield className={`w-4 h-4 ${c.text}`} />
        <span className={`text-sm font-bold ${c.text}`}>{badge} ({trustScore}%)</span>
      </div>
      <div className="w-full h-2 bg-white/60 rounded-full overflow-hidden mb-2">
        <div className={`h-full ${c.bar} rounded-full`} style={{ width: `${trustScore}%` }} />
      </div>

      {linkValidation && linkValidation.length > 0 && (
        <div className="mb-3 p-3 bg-white rounded-lg border border-slate-100">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Link Status</p>
          <div className="space-y-1.5">
            {linkValidation.map((link, i) => (
              <div key={i} className="flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-1.5">
                  {link.valid ? (
                    <span className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center">
                      <FiCheckCircle className="w-2.5 h-2.5 text-emerald-600" />
                    </span>
                  ) : link.url ? (
                    <span className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center">
                      <FiAlertCircle className="w-2.5 h-2.5 text-red-600" />
                    </span>
                  ) : (
                    <span className="w-4 h-4 rounded-full bg-zinc-100 flex items-center justify-center">
                      <FiAlertCircle className="w-2.5 h-2.5 text-zinc-400" />
                    </span>
                  )}
                  <span className="font-semibold text-slate-600">{link.label}</span>
                </div>
                <span className={`font-medium ${link.valid ? 'text-emerald-600' : link.url ? 'text-red-600' : 'text-zinc-400'}`}>
                  {link.valid ? 'Valid' : link.url ? `Error ${link.status || ''}` : 'Not provided'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {breakdown && (
        <div className="grid grid-cols-2 gap-1 mb-2">
          {Object.entries(breakdown).map(([key, val]) => (
            <div key={key} className="flex justify-between text-[10px] text-slate-600">
              <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
              <span className="font-semibold">{val}/25</span>
            </div>
          ))}
        </div>
      )}
      {analysis && <p className="text-xs text-slate-600 mt-1">{analysis}</p>}
      {flags && flags.length > 0 && (
        <div className="mt-2">
          {flags.map((f, i) => (
            <p key={i} className="text-[10px] text-amber-600 flex items-center gap-1">
              <FiAlertCircle className="w-2.5 h-2.5" /> {f}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProfilePage() {
  const { data: session, isPending } = authClient.useSession();
  const user = session?.user;

  const [view, setView] = useState("loading");
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [reverifyLoading, setReverifyLoading] = useState(false);

  const fetchProfile = async () => {
    if (!user?.email) return;
    try {
      const res = await apiFetch(`/api/alumni-directory/check/${user.email}`);
      if (res.exists && res.profile) {
        setFormData((prev) => ({ ...prev, ...res.profile }));
        setView("view");
      } else {
        setView("create");
      }
    } catch {
      setView("create");
    }
  };

  useEffect(() => {
    if (!user?.email || isPending) return;
    fetchProfile();
  }, [user, isPending]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB.");
      return;
    }
    setUploading(true);
    try {
      const url = await uploadImage(file);
      setFormData((prev) => ({ ...prev, profilePictureUrl: url }));
      toast.success("Image uploaded!");
    } catch (err) {
      toast.error(err.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setFormData((prev) => ({ ...prev, profilePictureUrl: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return toast.error("You must be logged in.");
    setSaving(true);

    const payload = { ...formData, fullName: user.name, email: user.email };
    const isEdit = view === "edit";
    const endpoint = isEdit
      ? `/api/alumni-directory/${user.email}`
      : `/api/alumni-directory`;

    try {
      const data = await apiFetch(endpoint, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (data.profile) {
        setFormData((prev) => ({ ...prev, ...data.profile }));
      }

      toast.success(isEdit ? "Profile updated!" : "Profile created!");
      setView("view");
    } catch (err) {
      toast.error(err.message || "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleReverify = async () => {
    if (!user) return;
    setReverifyLoading(true);
    try {
      const data = await apiFetch("/api/verify-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: { ...formData, email: user.email, fullName: user.name }, type: "alumni" }),
      });
      if (data.verification) {
        setFormData((prev) => ({ ...prev, verification: data.verification }));
      }
      toast.success("Profile re-verified!");
    } catch {
      toast.error("Verification failed.");
    } finally {
      setReverifyLoading(false);
    }
  };

  if (view === "loading" || isPending) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <FiLoader className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (view === "view") {
    return (
      <div className="max-w-2xl mx-auto">
        <Toaster position="top-center" />
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-5 sm:p-8 text-center">
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

            {formData.isMentor && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300 border border-violet-200 dark:border-violet-800 mt-3">
                <FiBookOpen className="w-3.5 h-3.5" />
                Available as Mentor
              </span>
            )}

            <div className="mt-4">
              <VerificationBadgeInline verification={formData.verification} />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => setView("edit")}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors"
            >
              <FiEdit3 className="w-4 h-4" /> Edit Profile
            </button>
            <button
              onClick={handleReverify}
              disabled={reverifyLoading}
              className="inline-flex items-center gap-2 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-sm font-semibold px-6 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 transition-colors disabled:opacity-50"
            >
              {reverifyLoading ? (
                <FiLoader className="w-4 h-4 animate-spin" />
              ) : (
                <FiRefreshCw className="w-4 h-4" />
              )}
              Re-verify
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isEdit = view === "edit";

  return (
    <div className="max-w-3xl mx-auto">
      <Toaster position="top-center" />

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
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

        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
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
                Profile Photo
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Choose a photo from your computer
              </p>
              {formData.profilePictureUrl ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-500 truncate max-w-[200px]">Photo selected</span>
                  <button type="button" onClick={handleRemoveImage} className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors">
                    <FiX className="w-3.5 h-3.5 text-zinc-400" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl text-sm hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
                >
                  <FiCamera className="w-4 h-4 text-zinc-400" />
                  <span className="text-zinc-500 dark:text-zinc-400">
                    {uploading ? "Uploading..." : "Browse Photo"}
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

          <div className="flex items-center gap-3 p-4 bg-violet-50 dark:bg-violet-950/20 rounded-xl border border-violet-200 dark:border-violet-800">
            <button
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, isMentor: !prev.isMentor }))}
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                formData.isMentor ? "bg-violet-600" : "bg-zinc-300 dark:bg-zinc-700"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ${
                  formData.isMentor ? "translate-x-5" : ""
                }`}
              />
            </button>
            <div>
              <label className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                <FiBookOpen className="w-4 h-4 text-violet-500" />
                Available as a Mentor
              </label>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                Students can find and request mentorship from you
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <button
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
