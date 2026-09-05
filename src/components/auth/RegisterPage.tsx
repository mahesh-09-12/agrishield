import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useApp } from "../../context/AppContext";
import { LanguageCode } from "../../types";
import {
  ShieldCheck,
  User,
  Mail,
  Lock,
  Phone,
  MapPin,
  Globe,
  ArrowRight,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from "lucide-react";

interface RegisterPageProps {
  onSwitchToLogin: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onSwitchToLogin }) => {
  const { register, error, clearError, loading } = useAuth();
  const { t } = useApp();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    village: "",
    district: "",
    state: "Andhra Pradesh",
    preferredLanguage: "en" as LanguageCode,
    aadharLastFour: "",
  });

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setLocalError(null);
    clearError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (
      !formData.name.trim() ||
      !formData.email.trim() ||
      !formData.password ||
      !formData.phone.trim() ||
      !formData.village.trim() ||
      !formData.district.trim()
    ) {
      setLocalError(t["registrationRequiredFields"] || "Please fill in all mandatory farmer registration fields.");
      return;
    }

    if (formData.password.length < 6) {
      setLocalError(t["passwordLengthError"] || "Password must be at least 6 characters long.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setLocalError(t["passwordMismatch"] || "Passwords do not match. Please verify.");
      return;
    }

    try {
      setIsSubmitting(true);
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        village: formData.village,
        district: formData.district,
        state: formData.state,
        preferredLanguage: formData.preferredLanguage,
        aadharLastFour: formData.aadharLastFour || "9124",
      });
    } catch (err: any) {
      setLocalError(err.message || "Registration failed. Please check your inputs.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeError = localError || error;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8 font-sans selection:bg-emerald-200">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="flex justify-center">
          <div className="w-10 h-10 bg-emerald-700 rounded-xl flex items-center justify-center text-white shadow-md">
            <div className="w-5 h-5 border-2 border-white rotate-45" />
          </div>
        </div>
        <h2 className="mt-3 text-center text-2xl font-bold tracking-tight text-slate-900">
          {t["newFarmerRegistrationTitle"] || "New Farmer Registration"}
        </h2>
        <p className="mt-1 text-center text-xs text-slate-600">
          {t["newFarmerRegistrationSubtitle"] || "Enroll in PMFBY Digital Crop Insurance Evidence & Verification System"}
        </p>
      </div>

      <div className="mt-5 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-6 px-6 sm:px-8 shadow-sm border border-slate-200 rounded-xl space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
              {t["stepOneOfOne"] || "Step 1 of 1: Identity & Location"}
            </span>
            <h3 className="text-base font-bold text-slate-900 mt-1">
              {t["farmerProfileEnrollment"] || "Farmer Profile & Insurance Enrollment"}
            </h3>
            <p className="text-xs text-slate-500">
              {t["farmerProfileHint"] || "A unique Farmer ID (e.g. FMR001) will be generated and securely saved with your profile."}
            </p>
          </div>

          {/* Error Message Banner */}
          {activeError && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 flex items-start gap-2.5 text-xs text-rose-800 animate-in fade-in">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold block">{t["registrationNotice"] || "Registration Notice"}</span>
                <span>{activeError}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  {t["fullNameLabel"] || "Full Name (As on Aadhar/Pattadar) *"}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                    <User className="h-3.5 w-3.5" />
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="block w-full pl-8 pr-2.5 py-1.5 text-xs border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-emerald-600 bg-slate-50/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  {t["mobilePhoneLabel"] || "Mobile Phone Number *"}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                    <Phone className="h-3.5 w-3.5" />
                  </div>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    placeholder="e.g. 9848022338"
                    className="block w-full pl-8 pr-2.5 py-1.5 text-xs border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-emerald-600 bg-slate-50/50"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  {t["emailLabel"] || "Email Address *"}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="h-3.5 w-3.5" />
                  </div>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="farmer@domain.com"
                    className="block w-full pl-8 pr-2.5 py-1.5 text-xs border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-emerald-600 bg-slate-50/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  {t["aadharLabel"] || "Aadhar (Last 4 Digits)"}
                </label>
                <input
                  type="text"
                  maxLength={4}
                  value={formData.aadharLastFour}
                  onChange={(e) => handleChange("aadharLastFour", e.target.value.replace(/\D/g, ""))}
                  placeholder="e.g. 8821"
                  className="block w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-emerald-600 bg-slate-50/50 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  {t["villageLabel"] || "Village/Gram Panchayat *"}
                </label>
                <input
                  type="text"
                  required
                  value={formData.village}
                  onChange={(e) => handleChange("village", e.target.value)}
                  placeholder="e.g. Kankipadu"
                  className="block w-full h-9 px-2.5 py-1.5 text-xs border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-emerald-600 bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  {t["districtLabel"] || "District/Mandal *"}
                </label>
                <input
                  type="text"
                  required
                  value={formData.district}
                  onChange={(e) => handleChange("district", e.target.value)}
                  placeholder="e.g. Krishna"
                  className="block w-full h-9 px-2.5 py-1.5 text-xs border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-emerald-600 bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  {t["stateLabel"] || "State *"}
                </label>
                <select
                  value={["Andhra Pradesh", "Telangana", "Maharashtra", "Tamil Nadu", "Karnataka", "Gujarat", "Punjab", "Uttar Pradesh", "Madhya Pradesh"].includes(formData.state) ? formData.state : "Other"}
                  onChange={(e) => {
                    if (e.target.value === "Other") handleChange("state", "Other");
                    else handleChange("state", e.target.value);
                  }}
                  className="block w-full h-9 px-2.5 py-1.5 text-xs border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-emerald-600 bg-slate-50/50"
                >
                  <option value="Andhra Pradesh">Andhra Pradesh</option>
                  <option value="Telangana">Telangana</option>
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Tamil Nadu">Tamil Nadu</option>
                  <option value="Karnataka">Karnataka</option>
                  <option value="Gujarat">Gujarat</option>
                  <option value="Punjab">Punjab</option>
                  <option value="Uttar Pradesh">Uttar Pradesh</option>
                  <option value="Madhya Pradesh">Madhya Pradesh</option>
                  <option value="Other">Other State</option>
                </select>
                {(formData.state === "Other" || !["Andhra Pradesh", "Telangana", "Maharashtra", "Tamil Nadu", "Karnataka", "Gujarat", "Punjab", "Uttar Pradesh", "Madhya Pradesh"].includes(formData.state)) && (
                  <input
                    type="text"
                    required
                    placeholder="Specify state..."
                    value={formData.state === "Other" ? "" : formData.state}
                    onChange={(e) => handleChange("state", e.target.value)}
                    className="mt-1.5 block w-full px-2.5 py-1.5 text-xs border border-amber-300 rounded text-slate-900 focus:outline-none focus:border-emerald-600 bg-amber-50/50 animate-in fade-in"
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  {t["preferredLanguage"] || "Preferred Language"}
                </label>
                <select
                  value={formData.preferredLanguage}
                  onChange={(e) => handleChange("preferredLanguage", e.target.value as LanguageCode)}
                  className="block w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-emerald-600 bg-slate-50/50"
                >
                  <option value="en">English</option>
                  <option value="hi">हिंदी (Hindi)</option>
                  <option value="te">తెలుగు (Telugu)</option>
                  <option value="ta">தமிழ் (Tamil)</option>
                  <option value="mr">मराठी (Marathi)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  {t["passwordMinLength"] || "Password (min 6 chars) *"}
                </label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  placeholder="••••••••"
                  className="block w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-emerald-600 bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  {t["confirmPassword"] || "Confirm Password *"}
                </label>
                <input
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange("confirmPassword", e.target.value)}
                  placeholder="••••••••"
                  className="block w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-emerald-600 bg-slate-50/50"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting || loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-2xs text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 transition cursor-pointer"
              >
                {isSubmitting || loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{t["creatingAccount"] || "Creating your account & profile..."}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{t["completeRegistration"] || "Complete Farmer Registration & Proceed"}</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Switch to Login */}
          <div className="text-center pt-2 border-t border-slate-100">
            <p className="text-xs text-slate-600">
              {t["alreadyRegistered"] || "Already registered as a PMFBY farmer?"}{" "}
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="font-bold text-emerald-700 hover:text-emerald-800 transition cursor-pointer"
              >
                {t["signInWithEmail"] || "Sign in with email →"}
              </button>
            </p>
          </div>
        </div>

        {/* Security notice */}
        <div className="mt-4 flex items-center justify-center gap-1.5 text-[10px] text-slate-500">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          <span>{t["secureProfileNotice"] || "Your profile information is securely protected."}</span>
        </div>
      </div>
    </div>
  );
};
