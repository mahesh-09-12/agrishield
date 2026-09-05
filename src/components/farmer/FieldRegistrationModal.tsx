import React, { useState, useCallback } from "react";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import { auth } from "../../lib/firebase";
import { FieldRegistrationMap } from "../maps/FieldRegistrationMap";
import { X, CheckCircle2, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { SoilType, CropStage } from "../../types";

export const FieldRegistrationModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { registerFieldAndCrop, registerField, registerCrop, farmer, reloadFarmerData, t } = useApp();
  const { user } = useAuth();

  const [step, setStep] = useState<1 | 2>(1);
  const [fieldName, setFieldName] = useState<string>("North Canal Plot B");
  const [surveyNumber, setSurveyNumber] = useState<string>("Sy.No 148/2A");
  const [soilType, setSoilType] = useState<SoilType | "Other">("Alluvial Clay Loam");
  const [customSoilType, setCustomSoilType] = useState<string>("");

  const [polygonCoords, setPolygonCoords] = useState<[number, number][]>([]);
  const [calculatedArea, setCalculatedArea] = useState<number>(2.4);
  const [centerCoord, setCenterCoord] = useState<[number, number]>([16.5124, 80.6982]);
  const [cropType, setCropType] = useState<string>("Rice");
  const [customCropType, setCustomCropType] = useState<string>("");
  const [variety, setVariety] = useState<string>("BPT 5204 (Samba Mahsuri)");
  const [customVariety, setCustomVariety] = useState<string>("");
  const [sowingDate, setSowingDate] = useState<string>("2026-06-15");
  const [harvestDate, setHarvestDate] = useState<string>("2026-11-20");
  const [currentStage, setCurrentStage] = useState<CropStage | "Other">("Vegetative Growth");
  const [customStage, setCustomStage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handlePolygonComplete = useCallback((coords: [number, number][], area: number, center: [number, number]) => {
    setPolygonCoords(coords);
    if (area > 0) setCalculatedArea(Number(area.toFixed(2)));
    if (center && center.length === 2) setCenterCoord(center);
  }, []);

  if (!isOpen) return null;

  const handleFinalSubmit = async () => {
    setFormError(null);
    const currentUid = user?.uid || auth.currentUser?.uid;
    if (!currentUid) {
      setFormError(t["loginRequired"] || "Please log in to continue.");
      return;
    }
    if (!fieldName.trim()) {
      setFormError(t["fieldIdentifierRequired"] || "Please provide a Field / Plot identifier.");
      return;
    }
    if (!surveyNumber.trim()) {
      setFormError(t["surveyNumberRequired"] || "Please provide a Survey Number / Khatiyan.");
      return;
    }
    if (!cropType.trim()) {
      setFormError(t["cropTypeRequired"] || "Please select a crop type.");
      return;
    }

    const finalSoilType = (soilType === "Other" ? (customSoilType || "Loamy Soil") : soilType) as SoilType;
    const finalCropType = cropType === "Other" ? (customCropType || "Custom Crop") : cropType;
    const finalVariety = variety === "Other" ? (customVariety || "Custom Variety") : variety;
    const finalStage = (currentStage === "Other" ? (customStage || "Vegetative Growth") : currentStage) as CropStage;

    setIsSubmitting(true);
    try {
      const boundaryCoords = polygonCoords.length >= 3 ? polygonCoords : [
        [16.5124, 80.6982] as [number, number],
        [16.5138, 80.7015] as [number, number],
        [16.5109, 80.7028] as [number, number],
        [16.5095, 80.6995] as [number, number],
      ];

      if (registerFieldAndCrop) {
        await registerFieldAndCrop(
          {
            name: fieldName.trim(),
            surveyNumber: surveyNumber.trim(),
            soilType: finalSoilType,
            coordinates: boundaryCoords,
            centerLat: centerCoord[0] || 16.5116,
            centerLng: centerCoord[1] || 80.7005,
            approxAreaAcres: calculatedArea || 2.4,
          },
          {
            cropType: finalCropType.trim(),
            variety: finalVariety.trim(),
            sowingDate,
            expectedHarvestDate: harvestDate,
            currentStage: finalStage,
            season: "Kharif 2026",
            cultivatedAreaAcres: calculatedArea || 2.4,
          }
        );
      } else {
        const createdField = await registerField({
          farmerId: farmer?.id || farmer?.farmerId || "FMR-001",
          name: fieldName.trim(),
          surveyNumber: surveyNumber.trim(),
          soilType: finalSoilType,
          coordinates: boundaryCoords,
          centerLat: centerCoord[0] || 16.5116,
          centerLng: centerCoord[1] || 80.7005,
          approxAreaAcres: calculatedArea || 2.4,
        });

        await registerCrop({
          fieldId: createdField.id,
          farmerId: farmer?.id || farmer?.farmerId || "FMR-001",
          cropType: finalCropType.trim(),
          variety: finalVariety.trim(),
          sowingDate,
          expectedHarvestDate: harvestDate,
          currentStage: finalStage,
          season: "Kharif 2026",
          cultivatedAreaAcres: calculatedArea || 2.4,
        });

        if (reloadFarmerData) await reloadFarmerData();
      }

      setSuccessMessage(t.saveField || "Field and Crop registered successfully!");
      setTimeout(() => onClose(), 400);
    } catch (err: any) {
      console.error("Firestore field registration error:", err);
      setFormError(t["registrationFailure"] || "Unable to complete registration. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl w-full max-w-md sm:max-w-3xl p-4 sm:p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 my-6 border border-slate-200 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
              {t["fieldRegistrationWizard"] || "Field Registration Wizard"}
            </span>
            <h3 className="text-base font-bold text-slate-900 mt-1">
              {step === 1 ? (t["fieldBoundaryTitle"] || "1. Map Agricultural Boundary & Survey Details") : (t["cropSeasonProfile"] || "2. Crop & Seasonal Sowing Profile")}
            </h3>
          </div>
          <button type="button" onClick={onClose} disabled={isSubmitting} className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-100 transition disabled:opacity-50">
            <X className="h-4 w-4" />
          </button>
        </div>

        {formError && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700 flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{formError}</span>
          </div>
        )}

        {successMessage && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {step === 1 ? (
          <div className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1 uppercase tracking-wider">
                  {t["fieldIdentifier"] || "Field / Plot Identifier"}
                </label>
                <input type="text" value={fieldName} onChange={(e) => { setFieldName(e.target.value); if (formError) setFormError(null); }} className="w-full rounded border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600" />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1 uppercase tracking-wider">
                  {t["surveyNumber"] || "Survey Number / Khatiyan"}
                </label>
                <input type="text" value={surveyNumber} onChange={(e) => { setSurveyNumber(e.target.value); if (formError) setFormError(null); }} className="w-full rounded border border-slate-300 px-2.5 py-1.5 text-xs font-mono text-slate-900 focus:outline-none focus:border-emerald-600" />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1 uppercase tracking-wider">
                  {t["soilClassification"] || "Soil Classification"}
                </label>
                <select value={soilType} onChange={(e) => setSoilType(e.target.value as any)} className="w-full rounded border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600">
                  <option value="Alluvial Clay Loam">Alluvial Clay Loam</option>
                  <option value="Black Cotton Soil">Black Cotton Soil</option>
                  <option value="Red Sandy Soil">Red Sandy Soil</option>
                  <option value="Loamy Soil">Loamy Soil</option>
                  <option value="Sandy Loam">Sandy Loam</option>
                  <option value="Other">Other Soil Type</option>
                </select>
                {soilType === "Other" && (
                  <input
                    type="text"
                    value={customSoilType}
                    onChange={(e) => setCustomSoilType(e.target.value)}
                    placeholder="Please specify soil classification..."
                    required
                    className="mt-1.5 w-full rounded border border-amber-300 bg-amber-50/50 px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 animate-in fade-in"
                  />
                )}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center justify-between">
                <span>{t["drawBoundaryPrompt"] || "Draw Boundary Polygon (Click points on map to enclose field):"}</span>
                <span className="text-emerald-700 font-bold">
                  {calculatedArea > 0 ? `Calculated Area: ${calculatedArea} Acres` : (t["areaPending"] || "Area Pending Closure")}
                </span>
              </label>
              <FieldRegistrationMap onPolygonComplete={handlePolygonComplete} />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2.5 border-t border-slate-200">
              <button type="button" onClick={onClose} className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900">{t.cancel || "Cancel"}</button>
              <button type="button" onClick={() => { if (!fieldName.trim()) { setFormError("Please enter a field identifier."); return; } if (!surveyNumber.trim()) { setFormError("Please enter a survey number."); return; } setFormError(null); setStep(2); }} className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-4 py-2 shadow-2xs transition cursor-pointer">
                <span>{t["continueCropProfile"] || "Continue to Crop Profile"}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3.5">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-2.5 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-500 block text-[10px]">{t["fieldRegistered"] || "Field Registered:"}</span>
                <span className="font-bold text-slate-900">{fieldName} &bull; {surveyNumber}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block text-[10px]">{t["enclosedAcreage"] || "Enclosed Acreage:"}</span>
                <span className="font-bold text-emerald-800">{calculatedArea} Acres</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1 uppercase tracking-wider">{t["cropType"] || "Crop Type"}</label>
                <select value={cropType} onChange={(e) => { setCropType(e.target.value); if (formError) setFormError(null); }} className="w-full rounded border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600">
                  <option value="Rice">Rice (Paddy)</option>
                  <option value="Cotton">Cotton</option>
                  <option value="Maize">Maize (Corn)</option>
                  <option value="Black Gram">Black Gram (Urad)</option>
                  <option value="Sugarcane">Sugarcane</option>
                  <option value="Wheat">Wheat</option>
                  <option value="Other">Other Crop Species</option>
                </select>
                {cropType === "Other" && (
                  <input
                    type="text"
                    value={customCropType}
                    onChange={(e) => setCustomCropType(e.target.value)}
                    placeholder="Please specify crop type..."
                    required
                    className="mt-1.5 w-full rounded border border-amber-300 bg-amber-50/50 px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 animate-in fade-in"
                  />
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1 uppercase tracking-wider">{t["cultivar"] || "Seed Variety / Hybrid"}</label>
                <select
                  value={variety.startsWith("Other") || variety === "Other" ? "Other" : variety}
                  onChange={(e) => {
                    if (e.target.value === "Other") setVariety("Other");
                    else setVariety(e.target.value);
                  }}
                  className="w-full rounded border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                >
                  <option value="BPT 5204 (Samba Mahsuri)">BPT 5204 (Samba Mahsuri)</option>
                  <option value="MTU 1010">MTU 1010</option>
                  <option value="RNR 15048 (Telangana Sona)">RNR 15048 (Telangana Sona)</option>
                  <option value="Hybrid H6 Cotton">Hybrid H6 Cotton</option>
                  <option value="Other">Other Variety</option>
                </select>
                {(variety === "Other" || !["BPT 5204 (Samba Mahsuri)", "MTU 1010", "RNR 15048 (Telangana Sona)", "Hybrid H6 Cotton"].includes(variety)) && (
                  <input
                    type="text"
                    value={customVariety || (variety !== "Other" ? variety : "")}
                    onChange={(e) => { setCustomVariety(e.target.value); setVariety("Other"); }}
                    placeholder="Please specify variety..."
                    required
                    className="mt-1.5 w-full rounded border border-amber-300 bg-amber-50/50 px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 animate-in fade-in"
                  />
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1 uppercase tracking-wider">{t["sowingDate"] || "Sowing / Transplanting Date"}</label>
                <input type="date" value={sowingDate} onChange={(e) => { setSowingDate(e.target.value); if (formError) setFormError(null); }} className="w-full rounded border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600" />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1 uppercase tracking-wider">{t["harvestDate"] || "Expected Harvest Date"}</label>
                <input type="date" value={harvestDate} onChange={(e) => { setHarvestDate(e.target.value); if (formError) setFormError(null); }} className="w-full rounded border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600" />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1 uppercase tracking-wider">{t["growthStage"] || "Current Crop Stage"}</label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                  {(["Sowing", "Vegetative Growth", "Flowering", "Maturity / Harvest", "Other"] as (CropStage | "Other")[]).map((stg) => (
                    <button key={stg} type="button" onClick={() => { setCurrentStage(stg); if (formError) setFormError(null); }} className={`rounded border p-1.5 text-center text-xs font-semibold transition cursor-pointer ${ currentStage === stg ? "border-emerald-600 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-500" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50" }`}>
                      {stg}
                    </button>
                  ))}
                </div>
                {currentStage === "Other" && (
                  <input
                    type="text"
                    value={customStage}
                    onChange={(e) => setCustomStage(e.target.value)}
                    placeholder="Please specify growth stage..."
                    required
                    className="mt-1.5 w-full rounded border border-amber-300 bg-amber-50/50 px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 animate-in fade-in"
                  />
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <button type="button" onClick={() => { setFormError(null); setStep(1); }} disabled={isSubmitting} className="text-xs font-semibold text-slate-600 hover:text-slate-900 disabled:opacity-50">&larr; {t["backToMapBoundary"] || "Back to Map Boundary"}</button>
              <button type="button" onClick={handleFinalSubmit} disabled={isSubmitting} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-4 py-2 shadow-2xs transition cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed">
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>{t["saving"] || "Saving..."}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>{t["completeRegistration"] || "Complete Registration"}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
