import React, { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import {
  Camera,
  Plus,
  CloudLightning,
  FileText,
  Layers,
  MapPin,
  Calendar,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  WifiOff,
  CloudRain,
  Sprout,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { MultiPointDamageMap } from "../maps/MultiPointDamageMap";
import { GuidedEvidenceCapture } from "./GuidedEvidenceCapture";
import { EvidenceTimeline } from "./EvidenceTimeline";
import { BeforeAfterComparison } from "./BeforeAfterComparison";
import { WeatherCorrelationPanel } from "../weather/WeatherCorrelationPanel";
import { EvidenceDossier } from "../dossier/EvidenceDossier";
import { FieldRegistrationModal } from "./FieldRegistrationModal";
import { DisasterReportModal } from "./DisasterReportModal";
import { CropRegistrationModal } from "./CropRegistrationModal";

interface FarmerDashboardProps {
  voiceAction?: string | null;
}

export const FarmerDashboard: React.FC<FarmerDashboardProps> = ({ voiceAction }) => {
  const {
    farmer,
    fields,
    activeFieldId,
    setActiveFieldId,
    crops,
    activeCropId,
    setActiveCropId,
    evidenceList,
    claims,
    isOnline,
    pendingSyncCount,
    syncStatus,
    triggerSync,
    isLoadingFirestore,
    firestoreError,
    clearFirestoreError,
    t,
  } = useApp();

  const [activeTab, setActiveTab] = useState<
    "timeline" | "map" | "guidedCapture" | "comparison" | "weather" | "dossier"
  >("timeline");

  const [isFieldModalOpen, setIsFieldModalOpen] = useState<boolean>(false);
  const [isDisasterModalOpen, setIsDisasterModalOpen] = useState<boolean>(false);
  const [isCropModalOpen, setIsCropModalOpen] = useState<boolean>(false);

  // Handle voice-triggered actions from the VoiceAssistantWidget
  useEffect(() => {
    if (!voiceAction) return;
    switch (voiceAction) {
      case "OPEN_DISASTER_MODAL":
        setIsDisasterModalOpen(true);
        break;
      case "OPEN_FIELD_MODAL":
        setIsFieldModalOpen(true);
        break;
      case "OPEN_CROP_MODAL":
        setIsCropModalOpen(true);
        break;
      case "NAVIGATE_DOSSIER":
        setActiveTab("dossier");
        break;
      default:
        break;
    }
  }, [voiceAction]);

  const activeField = fields.find((f) => f.id === activeFieldId) || fields[0];
  const fieldCrops = fields.length > 0 && activeField ? crops.filter((c) => c.fieldId === activeField.id) : [];
  const activeCrop = fieldCrops.find((c) => c.id === activeCropId) || fieldCrops[0];
  const activeClaim = fields.length > 0 && activeField ? claims.find((c) => c.fieldId === activeField.id) : undefined;

  const fieldEvidence = fields.length > 0 && activeField ? evidenceList.filter((e) => e.fieldId === activeField.id) : [];
  const preEvidence = fieldEvidence.filter(
    (e) => e.evidenceType === "Growth" || e.evidenceType === "Pre-disaster"
  );
  const postEvidence = fieldEvidence.filter(
    (e) =>
      e.evidenceType === "Post-disaster" ||
      e.evidenceType === "Damaged area" ||
      e.evidenceType === "Wide field view" ||
      e.evidenceType === "Close-up"
  );

  // 1. Loading State
  if (isLoadingFirestore) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center space-y-3 shadow-xs">
        <div className="inline-flex h-10 w-10 animate-spin items-center justify-center rounded-full border-3 border-slate-200 border-t-emerald-700 text-emerald-700" />
        <h3 className="text-base font-bold text-slate-800">{t.loadingFarmRecords || "Loading your farm records..."}</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          {t.loadingFarmRecordsSubtext || "Synchronizing your active crop profiles and field records..."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Firestore Error Banner */}
      {firestoreError && (
        <div className="rounded-lg border border-rose-300 bg-rose-50 p-3 text-xs flex items-center justify-between text-rose-900">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>{firestoreError}</span>
          </div>
          <button
            type="button"
            onClick={clearFirestoreError}
            className="text-rose-700 font-semibold underline hover:text-rose-900 ml-3"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Offline Status & Sync Queue Bar */}
      {(!isOnline || pendingSyncCount > 0) && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-amber-900">
            <WifiOff className="h-4 w-4 text-amber-700 shrink-0" />
            <span className="font-semibold text-xs">
              {!isOnline
                ? (t.offlineStatus || "Offline Mode Active (Evidence stored in local IndexedDB)")
                : `${pendingSyncCount} pending offline photo records queued`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={triggerSync}
              disabled={syncStatus === "syncing"}
              className="inline-flex items-center gap-1 rounded bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-2.5 py-1 text-xs transition cursor-pointer"
            >
              <RefreshCw className={`h-3 w-3 ${syncStatus === "syncing" ? "animate-spin" : ""}`} />
              {syncStatus === "syncing" ? "Syncing..." : (t.syncNow || "Sync Now")}
            </button>
          </div>
        </div>
      )}

      {/* Top Banner: Farmer Profile & Active PMFBY Policy */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                {t.roleFarmer || "PMFBY Registered Farmer"}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                Farmer ID: <strong>{farmer.farmerId || farmer.id}</strong>
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1">
              {t["namaste"] || "Namaste"}, {farmer.name || "Farmer"}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {farmer.village ? `${farmer.village}` : ""}
              {farmer.district ? `, ${farmer.district}` : ""}
              {farmer.state ? `, ${farmer.state}` : ""}
              {farmer.insuranceInfo?.policyNumber ? ` • Policy: ${farmer.insuranceInfo.policyNumber}` : ""}
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsFieldModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold px-3 py-2 shadow-2xs transition cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5 text-emerald-700" />
              {t.registerField}
            </button>

            {fields.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={() => setIsDisasterModalOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-3 py-2 shadow-2xs transition cursor-pointer"
                >
                  <CloudLightning className="h-3.5 w-3.5" />
                  {t.reportDisaster}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("guidedCapture")}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 shadow-xs transition cursor-pointer"
                >
                  <Camera className="h-3.5 w-3.5" />
                  {t.captureEvidence}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Multi-Field Selector Chips (if fields exist) */}
        {fields.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-1">
              {t["selectField"] || "Select Field:"}
            </span>
            {fields.map((f) => {
              const isSelected = f.id === activeFieldId;
              const fCrops = crops.filter((c) => c.fieldId === f.id);
              const cropLabel = fCrops.length > 0 ? fCrops[0].cropType : (t["noCropRegistered"] || "No crop");

              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => {
                    setActiveFieldId(f.id);
                    const matchingCrops = crops.filter((c) => c.fieldId === f.id);
                    if (matchingCrops.length > 0) {
                      setActiveCropId(matchingCrops[0].id);
                    } else {
                      setActiveCropId("");
                    }
                  }}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-emerald-700 text-white shadow-2xs"
                      : "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <MapPin className={`h-3 w-3 ${isSelected ? "text-white" : "text-emerald-700"}`} />
                  <span>{f.name}</span>
                  <span
                    className={`text-[10px] px-1 rounded font-mono ${
                      isSelected ? "bg-emerald-800 text-white" : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {f.approxAreaAcres || f.areaAcres || 0} Ac &bull; {cropLabel}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Empty State for Newly Registered Farmer with No Fields */}
      {fields.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center space-y-4 shadow-xs">
          <div className="mx-auto h-12 w-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
            <MapPin className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">{t.noFieldsYet || "No fields registered yet"}</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              {t.firstFieldPrompt || "Register your first agricultural plot with cadastral survey numbers to enable continuous crop monitoring, automated weather audits, and rapid PMFBY claim settlement."}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsFieldModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-4 py-2.5 shadow-2xs transition cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              {t.registerField || "Register Your First Field"}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Active Field Overview Bar (Real Firestore Data) */}
          {activeField && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  {t["surveyNumberLabel"] || "Survey Number"}
                </span>
                <span className="font-mono text-sm font-bold text-slate-900 mt-0.5 block">
                  {activeField.surveyNumber || "N/A"}
                </span>
                <span className="text-[10px] text-slate-500">{activeField.soilType || "Standard Soil"}</span>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  {t["cropVariety"] || "Crop & Variety"}
                </span>
                {activeCrop ? (
                  <>
                    <span className="text-sm font-bold text-slate-900 mt-0.5 block">
                      {activeCrop.cropType}
                    </span>
                    <span className="text-[10px] text-slate-500 truncate block">
                      {activeCrop.variety || (t["standardVariety"] || "Standard Variety")}
                    </span>
                  </>
                ) : (
                  <div className="mt-1">
                    <span className="text-xs text-slate-400 block font-semibold">{t["noCropRegistered"] || "No crop registered"}</span>
                    <button
                      type="button"
                      onClick={() => setIsCropModalOpen(true)}
                      className="text-[10px] text-emerald-700 hover:text-emerald-800 font-bold underline mt-0.5 inline-block"
                    >
                      + {t["registerCrop"] || "Register Crop"}
                    </button>
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  {t["cropStage"] || "Growth Stage"}
                </span>
                {activeCrop ? (
                  <>
                    <span className="text-sm font-bold text-amber-700 mt-0.5 block">
                      {activeCrop.currentStage || "Vegetative"}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Sown: {activeCrop.sowingDate || "N/A"}
                    </span>
                  </>
                ) : (
                  <span className="text-xs text-slate-400 mt-1 block">N/A</span>
                )}
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  {t["claimStatusLabel"] || "Claim Status"}
                </span>
                <span
                  className={`text-xs font-bold mt-0.5 inline-block px-2 py-0.5 rounded ${
                    activeClaim?.status === "Approved"
                      ? "bg-emerald-100 text-emerald-800"
                      : activeClaim?.status === "Under Review"
                      ? "bg-amber-100 text-amber-800"
                      : activeClaim?.status === "Evidence Collection"
                      ? "bg-sky-100 text-sky-800"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {activeClaim?.status || (t["noActiveClaims"] || "No active claims")}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {activeClaim ? `Claim ID: ${activeClaim.id}` : (t["healthyBaseline"] || "Healthy Baseline")}
                </span>
              </div>
            </div>
          )}

          {/* Navigation Tabs for Farmer Sub-Views */}
          <div className="border-b border-slate-200 bg-white rounded-lg p-1 shadow-2xs flex flex-wrap items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTab("timeline")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition cursor-pointer ${
                activeTab === "timeline"
                  ? "bg-emerald-700 text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              {t["evidenceTimeline"] || "Evidence Timeline"}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("map")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition cursor-pointer ${
                activeTab === "map"
                  ? "bg-emerald-700 text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <MapPin className="h-3.5 w-3.5" />
              {t["fieldDamageMap"] || "Field Damage Map"}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("guidedCapture")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition cursor-pointer ${
                activeTab === "guidedCapture"
                  ? "bg-emerald-700 text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Camera className="h-3.5 w-3.5" />
              {t["guidedCapture"] || "Guided 4-Step Photo Capture"}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("comparison")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition cursor-pointer ${
                activeTab === "comparison"
                  ? "bg-emerald-700 text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              {t["beforeAfter"] || "Before vs. After"}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("weather")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition cursor-pointer ${
                activeTab === "weather"
                  ? "bg-emerald-700 text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <CloudRain className="h-3.5 w-3.5" />
              {t["weatherTelemetry"] || "Weather Telemetry"}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("dossier")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition cursor-pointer ${
                activeTab === "dossier"
                  ? "bg-emerald-700 text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              {t["claimDossier"] || "Claim Dossier"}
            </button>
          </div>

          {/* Render Active Sub-View */}
          {activeTab === "timeline" && (
            <EvidenceTimeline
              onOpenCaptureModal={() => setActiveTab("guidedCapture")}
              onOpenCropModal={() => setIsCropModalOpen(true)}
            />
          )}

          {activeTab === "map" && activeField && (
            <div className="space-y-3">
              <MultiPointDamageMap field={activeField} evidenceList={fieldEvidence} />
            </div>
          )}

          {activeTab === "guidedCapture" && (
            <GuidedEvidenceCapture onComplete={() => setActiveTab("timeline")} />
          )}

          {activeTab === "comparison" && (
            <BeforeAfterComparison preDisasterEvidence={preEvidence} postDisasterEvidence={postEvidence} />
          )}

          {activeTab === "weather" && <WeatherCorrelationPanel />}

          {activeTab === "dossier" && (
            <EvidenceDossier claimId={activeClaim?.id || (claims[0]?.id ?? "NO_CLAIMS")} />
          )}
        </>
      )}

      {/* Modals */}
      <FieldRegistrationModal
        isOpen={isFieldModalOpen}
        onClose={() => setIsFieldModalOpen(false)}
      />

      <DisasterReportModal
        isOpen={isDisasterModalOpen}
        onClose={() => setIsDisasterModalOpen(false)}
        onProceedToEvidenceCapture={() => setActiveTab("guidedCapture")}
      />

      <CropRegistrationModal
        isOpen={isCropModalOpen}
        onClose={() => setIsCropModalOpen(false)}
        targetFieldId={activeFieldId}
      />
    </div>
  );
};
