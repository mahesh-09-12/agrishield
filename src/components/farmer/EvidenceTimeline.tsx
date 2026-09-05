import React from "react";
import { useApp } from "../../context/AppContext";
import {
  Calendar,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  Camera,
  Plus,
} from "lucide-react";
import { EvidenceRecord } from "../../types";

export const EvidenceTimeline: React.FC<{
  onSelectEvidence?: (evidence: EvidenceRecord) => void;
  onOpenCaptureModal?: () => void;
  onOpenCropModal?: () => void;
}> = ({ onSelectEvidence, onOpenCaptureModal, onOpenCropModal }) => {
  const {
    t,
    evidenceList,
    activeFieldId,
    fields,
    crops,
    disasterReports,
    evidenceCompletenessPercent,
    isEvidenceOutdated,
  } = useApp();

  const activeField = fields.find((f) => f.id === activeFieldId) || fields[0];
  const fieldCrops = activeField ? crops.filter((c) => c.fieldId === activeField.id) : [];
  const activeCrop = fieldCrops[0];
  const fieldDisasters = activeField ? disasterReports.filter((d) => d.fieldId === activeField.id) : [];

  // Filter evidence for current field & sort chronologically
  const fieldEvidence = activeField
    ? evidenceList
        .filter((e) => e.fieldId === activeField.id)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    : [];

  if (!activeField) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
        {t["noFieldSelected"] || "No field selected."}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Evidence Completeness & Inactivity Warning Banner */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded inline-block mb-1">
              {t["continuousMonitoring"] || "Continuous Monitoring"}
            </span>
            <h3 className="text-base font-bold text-slate-900">
              {t["cropEvidenceTimeline"] || "Crop Evidence Timeline"} &bull; {activeCrop ? activeCrop.cropType : (t["cropProfile"] || "Crop Profile")} ({activeField.name})
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {t["timelineDescription"] || "Geo-tagged visual ledger tracking crop stages from sowing through disaster assessment."}
            </p>
          </div>

          {/* Completeness Badge */}
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-lg p-2.5">
            <div>
              <span className="text-[10px] font-semibold uppercase text-slate-500 block">
                {t.evidenceCompleteness}
              </span>
              <span className="text-xl font-black text-emerald-700">
                {evidenceCompletenessPercent}%
              </span>
            </div>
            <div className="w-14 h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                style={{ width: `${evidenceCompletenessPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* 20-Day Inactivity Warning */}
        {isEvidenceOutdated && (
          <div className="mt-3 flex items-center justify-between gap-2.5 rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-900">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
              <span className="font-semibold text-[11px]">{t.warningNoEvidence}</span>
            </div>
            {onOpenCaptureModal && (
              <button
                type="button"
                onClick={onOpenCaptureModal}
                className="rounded bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] px-2.5 py-1 shadow-2xs transition shrink-0 cursor-pointer"
              >
                {t["capturePhotoNow"] || "Capture Photo Now"}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Visual Timeline Spine */}
      <div className="relative pl-6 sm:pl-8 before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-300">
        {/* 1. Sowing Marker */}
        <div className="relative mb-5">
          <div className="absolute -left-6 sm:-left-8 top-1 h-5 w-5 rounded-full bg-emerald-700 border-2 border-white shadow flex items-center justify-center text-white text-[10px] font-bold">
            🌱
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50/90 p-3 shadow-2xs">
            <div className="flex items-center justify-between text-xs mb-0.5">
              <span className="font-bold text-slate-900 uppercase tracking-wide text-[11px]">
                Season Sowing Date & Baseline Registration
              </span>
              <span className="text-slate-500 font-medium text-[11px]">
                {activeCrop?.sowingDate
                  ? new Date(activeCrop.sowingDate).toLocaleDateString("en-IN")
                  : "Baseline Established"}
              </span>
            </div>
            <p className="text-[11px] text-slate-600">
              Cadastral Survey: {activeField.surveyNumber || "Registered"} &bull; Variety:{" "}
              {activeCrop?.variety || "Standard Variety"} &bull; Soil: {activeField.soilType || "Alluvial"}
            </p>
          </div>
        </div>

        {/* 2. Chronological Evidence Records */}
        {fieldEvidence.map((ev, idx) => {
          const isPost =
            ev.evidenceType === "Post-disaster" ||
            ev.evidenceType === "Damaged area" ||
            ev.evidenceType === "Wide field view" ||
            ev.evidenceType === "Close-up";

          return (
            <div key={`evidence-${ev.id}`} className="relative mb-5 group">
              {/* Timeline Pin */}
              <div
                className={`absolute -left-6 sm:-left-8 top-1.5 h-5 w-5 rounded-full border-2 border-white shadow flex items-center justify-center text-white text-[10px] font-bold ${
                  isPost
                    ? ev.damageClassification === "SEVERE"
                      ? "bg-rose-600"
                      : "bg-amber-500"
                    : "bg-emerald-600"
                }`}
              >
                {idx + 1}
              </div>

              {/* Evidence Card */}
              <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4 shadow-2xs hover:border-emerald-300 transition">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  {/* Image Preview */}
                  <div className="sm:w-36 shrink-0">
                    <img
                      src={ev.imageUrl}
                      alt="Timeline evidence"
                      referrerPolicy="no-referrer"
                      className="w-full h-24 object-cover rounded-lg border border-slate-200"
                    />
                  </div>

                  {/* Metadata & Details */}
                  <div className="flex-1 space-y-1.5 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`font-bold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded ${
                            isPost
                              ? "bg-rose-100 text-rose-900 border border-rose-200"
                              : "bg-emerald-100 text-emerald-900 border border-emerald-200"
                          }`}
                        >
                          {ev.stepName || ev.evidenceType}
                        </span>
                        <span className="font-semibold text-slate-700 text-[11px]">
                          Stage: {ev.cropStage}
                        </span>
                      </div>

                      <span className="text-slate-500 font-mono text-[10px] flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(ev.timestamp).toLocaleString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <p className="text-slate-700 font-medium text-[11px] leading-relaxed">
                      {ev.notes || "Geo-tagged photo recorded for field timeline history."}
                    </p>

                    {/* AI Assessment Callout */}
                    {ev.aiAssessment && (
                      <div
                        className={`rounded-md p-2 space-y-0.5 border ${
                          ev.aiAssessment.finalStatus === "INVALID EVIDENCE"
                            ? "bg-rose-50/80 border-rose-200"
                            : ev.aiAssessment.finalStatus === "NEEDS REVIEW"
                            ? "bg-amber-50/80 border-amber-200"
                            : "bg-emerald-50/70 border-emerald-200/80"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`font-bold text-[10px] flex items-center gap-1 ${
                              ev.aiAssessment.finalStatus === "INVALID EVIDENCE"
                                ? "text-rose-900"
                                : ev.aiAssessment.finalStatus === "NEEDS REVIEW"
                                ? "text-amber-900"
                                : "text-emerald-900"
                            }`}
                          >
                            <Sparkles className="h-3 w-3" />
                            {ev.aiAssessment.finalStatus === "INVALID EVIDENCE"
                              ? "Evidence Verification: Invalid Image"
                              : `AI Visual Diagnosis (${ev.aiAssessment.confidence}% confidence)`}
                          </span>
                          <span
                            className={`font-bold text-[9px] px-1.5 py-0.5 rounded ${
                              ev.aiAssessment.finalStatus === "INVALID EVIDENCE"
                                ? "bg-rose-100 text-rose-800 border border-rose-200"
                                : ev.aiAssessment.finalStatus === "NEEDS REVIEW"
                                ? "bg-amber-100 text-amber-800 border border-amber-200"
                                : ev.aiAssessment.damageSeverity === "NONE"
                                ? "bg-emerald-200 text-emerald-900"
                                : ev.aiAssessment.damageSeverity === "MODERATE"
                                ? "bg-amber-200 text-amber-900"
                                : "bg-rose-200 text-rose-900"
                            }`}
                          >
                            {ev.aiAssessment.finalStatus === "INVALID EVIDENCE"
                              ? "INVALID EVIDENCE"
                              : ev.aiAssessment.finalStatus === "NEEDS REVIEW"
                              ? "NEEDS REVIEW"
                              : ev.aiAssessment.damageSeverity}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-600 leading-normal">
                          {ev.aiAssessment.reason}
                        </p>
                      </div>
                    )}

                    {/* Geo & Rule Verification Badges */}
                    <div className="flex flex-wrap items-center justify-between pt-1.5 border-t border-slate-100 gap-1.5 text-[10px]">
                      <div className="flex items-center gap-1 text-slate-500 font-mono">
                        <MapPin className="h-3 w-3 text-emerald-700" />
                        Lat: {ev.lat.toFixed(4)}, Lng: {ev.lng.toFixed(4)}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-emerald-700 font-semibold inline-flex items-center gap-0.5">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          {t["gpsVerified"] || "GPS Verified"}
                        </span>
                        <span className="text-emerald-700 font-semibold inline-flex items-center gap-0.5">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          {t["weatherCorrelated"] || "Weather Correlated"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* 3. Reported Disaster Event Node */}
        {fieldDisasters.map((disaster) => (
          <div key={`disaster-${disaster.id}`} className="relative mb-5">
            <div className="absolute -left-6 sm:-left-8 top-1 h-5 w-5 rounded-full bg-rose-600 border-2 border-white shadow flex items-center justify-center text-white text-[10px] font-bold animate-pulse">
              ⚡
            </div>
            <div className="rounded-lg border border-rose-300 bg-rose-50/80 p-3 shadow-2xs">
              <div className="flex items-center justify-between text-xs mb-0.5">
                <span className="font-bold text-rose-900 uppercase tracking-wide flex items-center gap-1 text-[11px]">
                  <AlertCircle className="h-3.5 w-3.5 text-rose-600" />
                  Disaster Reported: {disaster.disasterType} ({disaster.id})
                </span>
                <span className="text-rose-700 font-semibold font-mono text-[10px]">
                  {disaster.date} &bull; {disaster.time}
                </span>
              </div>
              <p className="text-[11px] text-slate-700 mt-0.5">{disaster.description}</p>
              <div className="mt-1.5 text-[10px] font-semibold text-rose-800 bg-rose-100/90 rounded px-2 py-0.5 inline-block">
                Status: {disaster.status} &bull; Open-Meteo telemetry logged for this event.
              </div>
            </div>
          </div>
        ))}

        {/* Empty state if no evidence captured yet */}
        {fieldEvidence.length === 0 && (
          <div className="relative mb-5">
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/60 p-5 text-center space-y-2">
              <Camera className="h-5 w-5 text-slate-400 mx-auto" />
              <span className="text-xs font-bold text-slate-700 block">
                {t["noVisualEvidence"] || "No visual evidence recorded for this field yet"}
              </span>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                Capture growth baseline photos or post-disaster damage photos to build your verifiable indemnity dossier.
              </p>
              {onOpenCaptureModal && (
                <button
                  type="button"
                  onClick={onOpenCaptureModal}
                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-3 py-1.5 shadow-2xs transition cursor-pointer"
                >
                  <Camera className="h-3.5 w-3.5" />
                  Capture Photo Evidence
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
