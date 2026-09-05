import React, { useState, useRef, useEffect } from "react";
import {
  Camera,
  Upload,
  Crosshair,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ChevronRight,
  RefreshCw,
  Zap,
  AlertCircle,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import { EvidenceType, AIAssessmentResult } from "../../types";
import confetti from "canvas-confetti";

interface GuidedStep {
  stepNumber: number;
  title: string;
  instruction: string;
  evidenceType: EvidenceType;
  recommendedAngle: string;
}

export const GuidedEvidenceCapture: React.FC<{ onComplete?: () => void }> = ({ onComplete }) => {
  const {
    t,
    fields,
    activeFieldId,
    crops,
    disasterReports,
    captureEvidence,
    assessImageAI,
  } = useApp();

  const guidedSteps: GuidedStep[] = [
    {
      stepNumber: 1,
      title: t["wideFieldOverview"] || "Wide Field Overview",
      instruction: t["wideFieldInstruction"] || "Capture a wide view of the whole field showing the overall perimeter and standing crop stand.",
      evidenceType: "Wide field view",
      recommendedAngle: t["wideFieldAngle"] || "Stand at boundary ridge, aim camera horizontally to capture field extent.",
    },
    {
      stepNumber: 2,
      title: t["secondaryQuadrantSection"] || "Secondary Quadrant Section",
      instruction: t["secondaryQuadrantInstruction"] || "Capture another section or cross-section of the field showing secondary plot condition.",
      evidenceType: "Post-disaster",
      recommendedAngle: t["secondaryQuadrantAngle"] || "Walk 50 meters into the side path, frame the middle section.",
    },
    {
      stepNumber: 3,
      title: t["severelyDamagedArea"] || "Severely Damaged Area",
      instruction: t["severelyDamagedInstruction"] || "Capture the severely damaged, submerged, lodged, or hail-impacted epicenter.",
      evidenceType: "Damaged area",
      recommendedAngle: t["damagedAreaAngle"] || "Focus directly on the most impacted soil/crop pocket.",
    },
    {
      stepNumber: 4,
      title: t["closeUpFoliage"] || "Close-Up Foliage & Stalks",
      instruction: t["closeUpInstruction"] || "Capture a macro close-up of the damaged crop stems, panicles, or waterlogged root base.",
      evidenceType: "Close-up",
      recommendedAngle: t["closeUpAngle"] || "Hold camera 20-30 cm from foliage to reveal leaf lacerations or rot.",
    },
  ];

  const { user } = useAuth();

  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentAIResult, setCurrentAIResult] = useState<AIAssessmentResult | null>(null);
  const [capturedCount, setCapturedCount] = useState<number>(0);
  const [isAllComplete, setIsAllComplete] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const currentStep = guidedSteps[currentStepIndex] || guidedSteps[0];
  const activeField = fields.find((f) => f.id === activeFieldId) || fields[0];
  const activeCrop = crops.find((c) => c.fieldId === activeFieldId) || crops[0];
  const activeDisaster = disasterReports.find((d) => d.fieldId === activeFieldId) || disasterReports[0];

  // Request GPS position at capture time
  const acquireGPSAndCapture = () => {
    setErrorMessage(null);
    if (!navigator.geolocation) {
      setErrorMessage(t["gpsPermissionRequired"] || "Location permission is required.");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsCoords({
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
          accuracy: Math.round(pos.coords.accuracy),
        });
        setIsLocating(false);
        cameraInputRef.current?.click();
      },
      (err) => {
        console.warn("GPS error:", err);
        setIsLocating(false);
        setErrorMessage(t["gpsPermissionRequired"] || "Location permission is required.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleCameraFileCaptured = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }
    setCapturedFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        handleImageCaptured(reader.result, file);
      }
    };
    reader.onerror = () => {
      setErrorMessage(t["cameraPermissionRequired"] || "Camera permission is required.");
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    const file = e.target.files?.[0];
    if (file) {
      if (!gpsCoords && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setGpsCoords({
              lat: Number(pos.coords.latitude.toFixed(6)),
              lng: Number(pos.coords.longitude.toFixed(6)),
              accuracy: Math.round(pos.coords.accuracy),
            });
          },
          () => {
            setErrorMessage(t["gpsPermissionRequired"] || "Location permission is required.");
          }
        );
      }

      setCapturedFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          handleImageCaptured(reader.result, file);
        }
      };
      reader.onerror = () => {
        setErrorMessage(t["cameraPermissionRequired"] || "Camera permission is required.");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageCaptured = async (imgData: string, file?: File) => {
    setCapturedImage(imgData);
    if (file) setCapturedFile(file);
    setIsAnalyzing(true);

    try {
      const ai = await assessImageAI(
        imgData,
        activeCrop?.cropType || "Rice",
        activeCrop?.currentStage || "Flowering",
        activeDisaster?.disasterType || "Heavy Rainfall",
        currentStep.evidenceType
      );
      setCurrentAIResult(ai);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveAndConfirm = async () => {
    if (!capturedImage || !gpsCoords) {
      if (!gpsCoords) {
        setErrorMessage(t["gpsPermissionRequired"] || "Location permission is required.");
      }
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);

    try {
      await captureEvidence({
        farmerId: user?.uid || activeField?.farmerId || "FMR-001",
        fieldId: activeField?.id || "FLD-001",
        cropId: activeCrop?.id || "CRP001",
        imageUrl: capturedImage,
        imageFileOrDataUrl: capturedFile || capturedImage,
        lat: gpsCoords.lat,
        lng: gpsCoords.lng,
        
        cropStage: activeCrop?.currentStage || "Flowering",
        evidenceType: currentStep.evidenceType,
        stepName: `Step ${currentStep.stepNumber}: ${currentStep.title}`,
        notes: notes || currentStep.instruction,
        damageClassification:
          currentAIResult?.finalStatus === "INVALID EVIDENCE" || currentAIResult?.damageSeverity === "NOT APPLICABLE"
            ? "NOT APPLICABLE"
            : currentAIResult?.damageSeverity && currentAIResult.damageSeverity !== "UNKNOWN"
            ? currentAIResult.damageSeverity
            : "UNKNOWN",
        aiAssessment: currentAIResult || undefined,
      });

      const nextIndex = currentStepIndex + 1;
      setCapturedCount((prev) => prev + 1);

      if (nextIndex < guidedSteps.length) {
        setCurrentStepIndex(nextIndex);
        setCapturedImage(null);
        setCapturedFile(null);
        setCurrentAIResult(null);
        setNotes("");
      } else {
        setIsAllComplete(true);
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
        if (onComplete) {
          setTimeout(onComplete, 2200);
        }
      }
    } catch (err) {
      console.error("Failed to upload evidence:", err);
      setErrorMessage("Unable to save evidence. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  if (isAllComplete) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-6 text-center shadow-2xs">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white shadow-md">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h3 className="mt-3 text-xl font-bold text-slate-900">{t.evidenceComplete}</h3>
        <p className="mt-1.5 text-xs text-slate-600 max-w-md mx-auto">
          {t["evidenceCompleteMessage"] || "All 4 post-disaster field sectors successfully geo-tagged and synchronized. Your Claim Dossier has been updated with real-time AI damage metrics."}
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => {
              setIsAllComplete(false);
              setCurrentStepIndex(0);
              setCapturedImage(null);
              setCurrentAIResult(null);
            }}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
          >
            Capture Additional Angles
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs">
      {/* Step Progress Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded">
            <Zap className="h-3 w-3 text-emerald-600" />
            {t.stepOf} {currentStep.stepNumber} of 4 &bull; Guided Inspection
          </span>
          <span className="text-xs font-medium text-slate-500">
            {activeField.name} ({activeField.id})
          </span>
        </div>

        {/* 4-Step Progress Bar */}
        <div className="grid grid-cols-4 gap-1.5 mt-2">
          {guidedSteps.map((step, idx) => (
            <div
              key={step.stepNumber}
              className={`h-1.5 rounded-full transition-all ${
                idx < currentStepIndex
                  ? "bg-emerald-600"
                  : idx === currentStepIndex
                  ? "bg-emerald-500 ring-2 ring-emerald-200"
                  : "bg-slate-200"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Error Message Banner */}
      {errorMessage && (
        <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          <span className="font-semibold">{errorMessage}</span>
        </div>
      )}

      {/* Step Directives */}
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 mb-4">
        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <span>{currentStep.title}</span>
        </h4>
        <p className="text-xs text-slate-700 mt-1 font-medium leading-relaxed">
          {currentStep.instruction}
        </p>
        <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
          <ChevronRight className="h-3 w-3 text-emerald-600 shrink-0" />
          <span className="font-semibold text-slate-700">Guide:</span> {currentStep.recommendedAngle}
        </p>
      </div>

      {/* Camera / Viewport Area */}
      <div className="relative rounded-lg border border-dashed border-slate-300 bg-slate-50/50 overflow-hidden min-h-56 sm:min-h-[260px] flex flex-col items-center justify-center p-3">
        {capturedImage ? (
          <div className="relative w-full max-w-md rounded-lg overflow-hidden shadow-2xs border border-slate-200">
            <img
              src={capturedImage}
              alt="Captured sector"
              referrerPolicy="no-referrer"
              className="w-full h-56 object-cover"
            />
            {(isAnalyzing || isUploading) && (
              <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex flex-col items-center justify-center text-white p-4">
                <RefreshCw className="h-6 w-6 animate-spin text-emerald-400 mb-1.5" />
                <span className="text-xs font-semibold">
                  {isUploading ? (t["uploadingCloud"] || "Uploading to Cloud & Saving Metadata...") : (t["analyzingAi"] || "Gemini AI analyzing crop damage...")}
                </span>
                <span className="text-[10px] text-slate-300 mt-0.5">{t["secureGeoTaggedLedger"] || "Secure Geo-tagged Ledger Sync"}</span>
              </div>
            )}
            <button
              type="button"
              onClick={() => {
                setCapturedImage(null);
                setCurrentAIResult(null);
              }}
              className="absolute top-2 right-2 rounded bg-slate-900/80 hover:bg-slate-900 text-white px-2.5 py-1 text-xs font-medium shadow-xs transition cursor-pointer"
            >
              Retake Photo
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center p-4 space-y-3">
            <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
              <Camera className="h-6 w-6" />
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-800">
                {t["livePhotoCapture"] || "Capture live geo-tagged photo using device camera"}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {t["livePhotoSubtext"] || "Rear camera (environment) & GPS coordinates will be captured at capture time."}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={acquireGPSAndCapture}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white px-3.5 py-2 text-xs font-bold shadow-2xs transition cursor-pointer"
              >
                <Camera className="h-4 w-4" />
                {t.takePhoto || "Take Evidence"}
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 px-3.5 py-2 text-xs font-semibold shadow-2xs transition cursor-pointer"
              >
                <Upload className="h-4 w-4" />
                {t.uploadPhoto || "Upload from Gallery"}
              </button>
            </div>

            {/* Native camera file input with capture="environment" */}
            <input
              type="file"
              ref={cameraInputRef}
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleCameraFileCaptured}
            />

            {/* Gallery upload file input */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>
        )}
      </div>

      {/* Embedded Metadata Banner: GPS & Timestamp */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
        <div className="flex items-center gap-1.5">
          <Crosshair className={`h-3.5 w-3.5 ${isLocating ? "animate-spin text-amber-600" : "text-emerald-700"}`} />
          <span className="font-semibold text-slate-800 text-xs">
            {gpsCoords
              ? `GPS: ${gpsCoords.lat.toFixed(5)}, ${gpsCoords.lng.toFixed(5)} (±${gpsCoords.accuracy}m)`
              : isLocating
              ? (t["acquiringGps"] || "Acquiring live GPS coordinates...")
              : (t["gpsPendingCapture"] || "GPS pending capture")}
          </span>
        </div>

        <div className="text-slate-500 font-mono text-[10px]">
          Timestamp: {new Date().toLocaleTimeString()} &bull; {new Date().toLocaleDateString("en-IN")}
        </div>
      </div>

      {/* Live AI Assessment Feedback Card */}
      {currentAIResult && (
        <div
          className={`mt-3 rounded-lg border p-3.5 transition-all ${
            currentAIResult.finalStatus === "INVALID EVIDENCE"
              ? "border-rose-300 bg-rose-50/90 text-rose-950"
              : currentAIResult.finalStatus === "NEEDS REVIEW"
              ? "border-amber-300 bg-amber-50/90 text-amber-950"
              : "border-emerald-200 bg-emerald-50/70 text-emerald-950"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div
              className={`flex items-center gap-1.5 text-xs font-bold ${
                currentAIResult.finalStatus === "INVALID EVIDENCE"
                  ? "text-rose-900"
                  : currentAIResult.finalStatus === "NEEDS REVIEW"
                  ? "text-amber-900"
                  : "text-emerald-900"
              }`}
            >
              {currentAIResult.finalStatus === "INVALID EVIDENCE" ? (
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              ) : (
                <Sparkles
                  className={`h-4 w-4 shrink-0 ${
                    currentAIResult.finalStatus === "NEEDS REVIEW"
                      ? "text-amber-600"
                      : "text-emerald-600"
                  }`}
                />
              )}
              <span>
                {currentAIResult.finalStatus === "INVALID EVIDENCE"
                  ? "Evidence Verification: Unrelated Image Detected"
                  : "Gemini AI Preliminary Assessment"}
              </span>
            </div>
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border shadow-2xs ${
                currentAIResult.finalStatus === "INVALID EVIDENCE"
                  ? "bg-rose-100 text-rose-800 border-rose-300"
                  : currentAIResult.finalStatus === "NEEDS REVIEW"
                  ? "bg-amber-100 text-amber-800 border-amber-300"
                  : currentAIResult.damageSeverity === "NONE"
                  ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                  : currentAIResult.damageSeverity === "MODERATE"
                  ? "bg-amber-100 text-amber-800 border-amber-300"
                  : "bg-rose-100 text-rose-800 border-rose-300"
              }`}
            >
              {currentAIResult.finalStatus === "INVALID EVIDENCE"
                ? "INVALID EVIDENCE"
                : currentAIResult.finalStatus === "NEEDS REVIEW"
                ? "NEEDS REVIEW"
                : `${currentAIResult.damageSeverity} Damage (${currentAIResult.estimatedAffectedArea || "0%"} impact)`}
            </span>
          </div>

          {currentAIResult.finalStatus === "INVALID EVIDENCE" ? (
            <div className="space-y-2 mt-1">
              <p className="text-xs text-rose-900 font-semibold leading-normal">
                This image cannot be accepted as agricultural damage evidence.
              </p>

              {currentAIResult.contentIdentified && (
                <div className="text-[11px] text-slate-800 bg-white/90 rounded border border-rose-200 px-2.5 py-1.5 flex items-center gap-1.5">
                  <span className="font-bold text-slate-900">Identified Content:</span>
                  <span className="font-medium text-rose-700">{currentAIResult.contentIdentified}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-[11px] bg-white/90 rounded border border-rose-200 p-2.5">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase tracking-wider font-semibold">Damage Severity</span>
                  <span className="font-bold text-slate-700">Not applicable</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase tracking-wider font-semibold">Impact / Affected Area</span>
                  <span className="font-bold text-slate-700">Not applicable</span>
                </div>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed">
                {currentAIResult.reason}
              </p>

              <div className="pt-1 flex items-center justify-between">
                <span className="text-[11px] text-rose-700 italic">
                  Please retake or select a valid photo of your field or crop.
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setCapturedImage(null);
                    setCapturedFile(null);
                    setCurrentAIResult(null);
                  }}
                  className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 hover:text-rose-900 underline cursor-pointer"
                >
                  <RefreshCw className="h-3 w-3" />
                  Retake Photo
                </button>
              </div>
            </div>
          ) : currentAIResult.finalStatus === "NEEDS REVIEW" ? (
            <div className="space-y-2 mt-1">
              <div className="grid grid-cols-2 gap-2 text-[11px] bg-white/90 rounded border border-amber-200 p-2.5">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase tracking-wider font-semibold">Damage Severity</span>
                  <span className="font-bold text-slate-700">Under Review</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase tracking-wider font-semibold">Impact / Affected Area</span>
                  <span className="font-bold text-slate-700">Not applicable</span>
                </div>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                {currentAIResult.reason}
              </p>
            </div>
          ) : (
            <>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                {currentAIResult.reason}
              </p>

              {currentAIResult.detectedDamage && currentAIResult.detectedDamage.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {currentAIResult.detectedDamage.map((feat, i) => (
                    <span
                      key={i}
                      className="text-[10px] font-medium bg-white border border-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded shadow-2xs"
                    >
                      ✓ {feat}
                    </span>
                  ))}
                </div>
              )}
            </>
          )}

          <p className="mt-2 text-[10px] text-slate-500 italic border-t border-slate-200/60 pt-1">
            {t.disclaimerAI}
          </p>
        </div>
      )}

      {/* Farmer Observations / Notes */}
      <div className="mt-3">
        <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
          Field Notes / Sector Details (Optional):
        </label>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={`e.g., Water standing at 35cm, submerged tillers on plot boundary...`}
          className="w-full rounded border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none"
        />
      </div>

      {/* Submission CTA */}
      <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-200">
        <button
          type="button"
          onClick={() => {
            if (currentStepIndex > 0) {
              setCurrentStepIndex((prev) => prev - 1);
              setCapturedImage(null);
              setCurrentAIResult(null);
            }
          }}
          disabled={currentStepIndex === 0 || isUploading}
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
        >
          &larr; Previous Step
        </button>

        <button
          type="button"
          disabled={
            !capturedImage ||
            isAnalyzing ||
            isUploading ||
            currentAIResult?.finalStatus === "INVALID EVIDENCE"
          }
          onClick={handleSaveAndConfirm}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 text-xs font-bold shadow-2xs transition disabled:opacity-40 active:scale-95 cursor-pointer"
        >
          <span>
            {isUploading
              ? (t["savingUploading"] || "Saving & Uploading...")
              : currentAIResult?.finalStatus === "INVALID EVIDENCE"
              ? "Invalid Evidence - Retake Required"
              : currentStepIndex === guidedSteps.length - 1
              ? (t["confirmSaveAllEvidence"] || "Confirm & Save All Sector Evidence")
              : (t["confirmUsePhotoNext"] || "Confirm / Use Photo & Next")}
          </span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};

