import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useApp } from "../../context/AppContext";
import { LanguageCode } from "../../types";
import {
  X,
  User,
  MapPin,
  Phone,
  Mail,
  Shield,
  CheckCircle2,
  Edit2,
  Save,
  Loader2,
  Calendar,
  Building,
} from "lucide-react";

interface FarmerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FarmerProfileModal: React.FC<FarmerProfileModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { farmerProfile, updateFarmerProfile, user } = useAuth();
  const { setFarmer, setLanguage } = useApp();

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    village: "",
    district: "",
    state: "",
    preferredLanguage: "en" as LanguageCode,
    aadharLastFour: "",
  });

  useEffect(() => {
    if (farmerProfile) {
      setFormData({
        name: farmerProfile.name || "",
        phone: farmerProfile.phone || "",
        village: farmerProfile.village || "",
        district: farmerProfile.district || "",
        state: farmerProfile.state || "",
        preferredLanguage: farmerProfile.preferredLanguage || "en",
        aadharLastFour: farmerProfile.aadharLastFour || "",
      });
    }
  }, [farmerProfile]);

  if (!isOpen || !farmerProfile) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg(null);

    try {
      await updateFarmerProfile({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        village: formData.village.trim(),
        district: formData.district.trim(),
        state: formData.state.trim(),
        preferredLanguage: formData.preferredLanguage,
        aadharLastFour: formData.aadharLastFour.trim(),
      });

      // Update AppContext farmer
      setFarmer({
        ...farmerProfile,
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        village: formData.village.trim(),
        district: formData.district.trim(),
        state: formData.state.trim(),
        preferredLanguage: formData.preferredLanguage,
        aadharLastFour: formData.aadharLastFour.trim(),
      });

      setLanguage(formData.preferredLanguage);
      setIsEditing(false);
      setSuccessMsg("Farmer profile successfully updated in Firestore.");
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err) {
      console.error("Save profile error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl w-full max-w-md sm:max-w-2xl p-4 sm:p-6 shadow-xl border border-slate-200 space-y-4 my-6 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold text-sm shadow-2xs">
              <User className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                  Authenticated Firestore Profile
                </span>
                <span className="text-xs font-mono font-bold text-slate-500">
                  {farmerProfile.farmerId || farmerProfile.id}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">
                {farmerProfile.name}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 flex items-center gap-2 text-xs text-emerald-800">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{successMsg}</span>
          </div>
        )}

        {isEditing ? (
          <form onSubmit={handleSave} className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Full Legal Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full rounded border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 bg-slate-50/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Village
                </label>
                <input
                  type="text"
                  required
                  value={formData.village}
                  onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                  className="w-full rounded border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  District
                </label>
                <select
                  value={["Krishna", "Guntur", "Nalgonda", "Khammam", "Coimbatore"].includes(formData.district) ? formData.district : "Other"}
                  onChange={(e) => {
                    if (e.target.value === "Other") setFormData({ ...formData, district: "Other" });
                    else setFormData({ ...formData, district: e.target.value });
                  }}
                  className="w-full rounded border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 bg-slate-50/50 mb-1.5"
                >
                  <option value="Krishna">Krishna</option>
                  <option value="Guntur">Guntur</option>
                  <option value="Nalgonda">Nalgonda</option>
                  <option value="Khammam">Khammam</option>
                  <option value="Coimbatore">Coimbatore</option>
                  <option value="Other">Other District</option>
                </select>
                {(formData.district === "Other" || !["Krishna", "Guntur", "Nalgonda", "Khammam", "Coimbatore"].includes(formData.district)) && (
                  <input
                    type="text"
                    required
                    placeholder="Specify district..."
                    value={formData.district === "Other" ? "" : formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    className="w-full rounded border border-amber-300 bg-amber-50/50 px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 animate-in fade-in"
                  />
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  State
                </label>
                <select
                  value={["Andhra Pradesh", "Telangana", "Tamil Nadu", "Maharashtra", "Karnataka"].includes(formData.state) ? formData.state : "Other"}
                  onChange={(e) => {
                    if (e.target.value === "Other") setFormData({ ...formData, state: "Other" });
                    else setFormData({ ...formData, state: e.target.value });
                  }}
                  className="w-full rounded border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 bg-slate-50/50 mb-1.5"
                >
                  <option value="Andhra Pradesh">Andhra Pradesh</option>
                  <option value="Telangana">Telangana</option>
                  <option value="Tamil Nadu">Tamil Nadu</option>
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Karnataka">Karnataka</option>
                  <option value="Other">Other State</option>
                </select>
                {(formData.state === "Other" || !["Andhra Pradesh", "Telangana", "Tamil Nadu", "Maharashtra", "Karnataka"].includes(formData.state)) && (
                  <input
                    type="text"
                    required
                    placeholder="Specify state..."
                    value={formData.state === "Other" ? "" : formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full rounded border border-amber-300 bg-amber-50/50 px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 animate-in fade-in"
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Preferred Language
                </label>
                <select
                  value={formData.preferredLanguage}
                  onChange={(e) =>
                    setFormData({ ...formData, preferredLanguage: e.target.value as LanguageCode })
                  }
                  className="w-full rounded border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 bg-slate-50/50"
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
                  Aadhar (Last 4 Digits)
                </label>
                <input
                  type="text"
                  maxLength={4}
                  value={formData.aadharLastFour}
                  onChange={(e) =>
                    setFormData({ ...formData, aadharLastFour: e.target.value.replace(/\D/g, "") })
                  }
                  className="w-full rounded border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-emerald-600 bg-slate-50/50"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-4 py-2 shadow-2xs transition cursor-pointer"
              >
                {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Save Changes to Firestore
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            {/* Identity Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-2.5">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Farmer ID
                </span>
                <span className="text-xs font-bold font-mono text-emerald-800 mt-0.5 block">
                  {farmerProfile.farmerId || farmerProfile.id}
                </span>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-2.5">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Phone
                </span>
                <span className="text-xs font-bold text-slate-900 mt-0.5 block">
                  {farmerProfile.phone}
                </span>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-2.5">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Language
                </span>
                <span className="text-xs font-bold uppercase text-slate-900 mt-0.5 block">
                  {farmerProfile.preferredLanguage}
                </span>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-2.5">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Aadhar (Last 4)
                </span>
                <span className="text-xs font-bold font-mono text-slate-900 mt-0.5 block">
                  •••• {farmerProfile.aadharLastFour || "8821"}
                </span>
              </div>
            </div>

            {/* Location & Email Details */}
            <div className="rounded-lg border border-slate-200 bg-white p-3 space-y-2">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  Account Email
                </span>
                <span className="font-semibold text-slate-900">{farmerProfile.email || user?.email}</span>
              </div>

              <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  Village / District / State
                </span>
                <span className="font-semibold text-slate-900">
                  {farmerProfile.village}, {farmerProfile.district}, {farmerProfile.state}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-slate-400" />
                  Account ID
                </span>
                <span className="font-mono text-[11px] text-slate-500">{farmerProfile.uid || user?.uid}</span>
              </div>
            </div>

            {/* PMFBY Insurance Policy Card */}
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                  Active PMFBY Coverage
                </span>
                <span className="text-[11px] font-mono font-bold text-emerald-900">
                  {farmerProfile.insuranceInfo.policyNumber}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-500 text-[10px] block">Insurer:</span>
                  <span className="font-semibold text-slate-900">{farmerProfile.insuranceInfo.insurerName}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Sum Insured per Acre:</span>
                  <span className="font-bold text-emerald-800">
                    ₹{farmerProfile.insuranceInfo.sumInsuredPerAcre.toLocaleString("en-IN")} / Acre
                  </span>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold px-3.5 py-2 shadow-2xs transition cursor-pointer"
              >
                <Edit2 className="h-3.5 w-3.5 text-emerald-700" />
                Edit Profile Details
              </button>

              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 shadow-2xs transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
