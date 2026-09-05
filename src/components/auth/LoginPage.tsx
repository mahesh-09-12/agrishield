import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useApp } from "../../context/AppContext";
import {
  ShieldCheck,
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  Loader2,
  Sparkles,
  UserCheck,
  Building2,
} from "lucide-react";

interface LoginPageProps {
  onSwitchToRegister: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSwitchToRegister }) => {
  const { login, loginAsOfficer, loginAsDemoFarmer, error, clearError, loading } = useAuth();
  const { t } = useApp();

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (!email.trim() || !password) {
      setLocalError("Please enter both your registered email address and password.");
      return;
    }

    try {
      setIsSubmitting(true);
      await login(email, password);
    } catch (err: any) {
      setLocalError(err.message || "Failed to sign in. Please verify your credentials.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOfficerLogin = async () => {
    setLocalError(null);
    clearError();
    try {
      setIsSubmitting(true);
      await loginAsOfficer();
    } catch (err: any) {
      setLocalError(err.message || "Failed to login as insurance officer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeError = localError || error;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 font-sans selection:bg-emerald-200">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header */}
        <div className="flex justify-center">
          <div className="w-12 h-12 bg-emerald-700 rounded-xl flex items-center justify-center text-white shadow-md">
            <div className="w-6 h-6 border-2 border-white rotate-45" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-slate-900">
          AgriShield {t.roleFarmer}
        </h2>
        <p className="mt-1 text-center text-xs text-slate-600">
          PMFBY Smart Crop Insurance Evidence & Verification System
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-6 px-6 sm:px-8 shadow-sm border border-slate-200 rounded-xl space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
              {t.secureAuthentication || "Secure Authentication"}
            </span>
            <h3 className="text-base font-bold text-slate-900 mt-1.5">
              {t.signInFarmerAccount || "Sign In to Your Farmer Account"}
            </h3>
            <p className="text-xs text-slate-500">
              {t.accessFarmerRecords || "Access your field records, geo-tagged crop evidence, and insurance claims."}
            </p>
          </div>

          {/* Error Message Banner */}
          {activeError && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 flex items-start gap-2.5 text-xs text-rose-800 animate-in fade-in">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold block">{t.authenticationNotice || "Authentication Notice"}</span>
                <span>{activeError}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                {t.registeredEmail || "Registered Email"}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="farmer@domain.com"
                  className="block w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-600 transition bg-slate-50/50"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
                  {t.password || "Password"}
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-600 transition bg-slate-50/50"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-2xs text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 transition cursor-pointer"
            >
              {isSubmitting || loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>{t.signInFarmer || "Sign In as Farmer"}</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={async () => {
                  setLocalError(null);
                  clearError();
                  setIsSubmitting(true);
                  try {
                    await loginAsDemoFarmer();
                  } catch (err: any) {
                    setLocalError(err.message || "Failed demo farmer sign in");
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
                disabled={isSubmitting || loading}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 border border-emerald-300 rounded-lg shadow-2xs text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 transition cursor-pointer"
              >
                <UserCheck className="h-3.5 w-3.5 text-emerald-700" />
                <span>Demo Farmer (Ramesh)</span>
              </button>

              <button
                type="button"
                onClick={handleOfficerLogin}
                disabled={isSubmitting || loading}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 border border-blue-300 rounded-lg shadow-2xs text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 transition cursor-pointer"
              >
                <Building2 className="h-3.5 w-3.5 text-blue-600" />
                <span>{t.signInOfficer || "Insurance Officer"}</span>
              </button>
            </div>
          </form>

          {/* Switch to Register */}
          <div className="text-center pt-2 border-t border-slate-100">
            <p className="text-xs text-slate-600">
              {t.newFarmerPrompt || "New farmer to PMFBY?"}{" "}
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="font-bold text-emerald-700 hover:text-emerald-800 transition cursor-pointer"
              >
                {t.registerFarmerProfile || "Register new farmer profile →"}
              </button>
            </p>
          </div>
        </div>

        {/* Security badge */}
        <div className="mt-4 flex items-center justify-center gap-1.5 text-[10px] text-slate-500">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          <span>Government of India &bull; PMFBY Crop Loss Assessment Standard</span>
        </div>
      </div>
    </div>
  );
};
