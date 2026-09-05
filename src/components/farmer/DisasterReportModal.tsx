import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { DisasterType } from "../../types";
import { X, CloudLightning, CheckCircle2, ArrowRight } from "lucide-react";
import { sampleCropImages } from "../../lib/demoData";

const DISASTER_TYPES: (DisasterType | "Other")[] = [
  "Heavy Rainfall",
  "Flood",
  "Hailstorm",
  "Drought",
  "Cyclone",
  "Pest Attack",
  "Unseasonal Frost",
  "Other",
];

export const DisasterReportModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onProceedToEvidenceCapture?: () => void;
}> = ({ isOpen, onClose, onProceedToEvidenceCapture }) => {
  const { fields, activeFieldId, crops, reportDisaster, t } = useApp();

  const [selectedFieldId, setSelectedFieldId] = useState<string>(activeFieldId || "FL001");
  const [customFieldName, setCustomFieldName] = useState<string>("");
  const [disasterType, setDisasterType] = useState<DisasterType | "Other">("Heavy Rainfall");
  const [customDisasterType, setCustomDisasterType] = useState<string>("");
  const [eventDate, setEventDate] = useState<string>("2026-08-22");
  const [eventTime, setEventTime] = useState<string>("14:30");
  const [description, setDescription] = useState<string>("Continuous unseasonal cloudburst and flash rainfall causing canal overflow and waterlogging across the northern plot.");
  const [isSuccess, setIsSuccess] = useState<boolean>(false);


  const currentField = fields.find((f) => f.id === selectedFieldId) || fields[0] || { id: "FLD001", farmerId: "FMR-001" };
  const currentCrop = crops.find((c) => c.fieldId === selectedFieldId) || crops[0];

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setIsSubmitting(true);

    const finalDisasterType = (disasterType === "Other" ? (customDisasterType || "Other Calamity") : disasterType) as DisasterType;

    try {
      await reportDisaster({
        fieldId: selectedFieldId === "Other" ? (customFieldName || "Custom Field") : selectedFieldId,
        cropId: currentCrop?.id || "CRP001",
        farmerId: currentField?.farmerId || "FMR-001",
        disasterType: finalDisasterType,
        date: eventDate,
        time: eventTime,
        description: description,
        photoUrl: sampleCropImages.postDisasterWide,
      });
      setIsSuccess(true);
    } catch (err: any) {
      console.error("Failed to submit disaster/claim:", err);
      setSubmitError(err?.message || String(err) || "Failed to submit disaster report. Please try again.");
      setIsSuccess(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-xl max-w-lg w-full p-4 sm:p-5 shadow-xl space-y-3.5 animate-in fade-in zoom-in-95 border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded bg-rose-100 flex items-center justify-center text-rose-700"><CloudLightning className="h-3.5 w-3.5" /></div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">{t.reportDisaster || "Report Crop Disaster"}</h3>
              <span className="text-[11px] text-slate-500">{t["weatherAuditHint"] || "Initiates claim creation & weather audit"}</span>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-100 transition"><X className="h-4 w-4" /></button>
        </div>

        {isSuccess ? (
          <div className="py-4 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"><CheckCircle2 className="h-6 w-6" /></div>
            <div>
              <h4 className="text-base font-bold text-slate-900">{t["disasterRecorded"] || "Disaster Recorded Successfully"}</h4>
              <p className="text-xs text-slate-600 max-w-sm mx-auto mt-1">
                Open-Meteo telemetry has been queried for <strong>{eventDate}</strong>. Next, capture the 4-step guided geo-tagged photographs to complete your claim evidence dossier.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-1">
              <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">{t.close || "Close"}</button>
              <button type="button" onClick={() => { onClose(); if (onProceedToEvidenceCapture) onProceedToEvidenceCapture(); }} className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-1.5 text-xs font-bold shadow-2xs transition cursor-pointer">
                <span>{t["beginFourStepCapture"] || "Begin 4-Step Photo Capture"}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            {submitError && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-2 text-xs text-rose-800">
                <strong className="block font-semibold">Submission Error</strong>
                <div>{submitError}</div>
              </div>
            )}
            <div>
              <label className="block font-semibold text-slate-700 mb-1 text-[11px] uppercase tracking-wider">{t["selectImpactedField"] || "Select Impacted Field"}</label>
              <select value={selectedFieldId} onChange={(e) => setSelectedFieldId(e.target.value)} className="w-full rounded border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-900 font-semibold focus:outline-none focus:border-emerald-600">
                {fields.map((f) => (<option key={f.id} value={f.id}>{f.name} ({f.id}) &bull; {f.approxAreaAcres} Acres</option>))}
                <option value="Other">Other Field / Unregistered Plot</option>
              </select>
              {selectedFieldId === "Other" && (
                <input
                  type="text"
                  value={customFieldName}
                  onChange={(e) => setCustomFieldName(e.target.value)}
                  placeholder="Please specify plot name / survey number..."
                  required
                  className="mt-1.5 w-full rounded border border-amber-300 bg-amber-50/50 px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 animate-in fade-in"
                />
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1 text-[11px] uppercase tracking-wider">{t["disasterEventClassification"] || "Disaster Event Classification"}</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {DISASTER_TYPES.map((type) => (
                  <button key={type} type="button" onClick={() => setDisasterType(type)} className={`rounded border px-2 py-1.5 text-center text-xs font-semibold transition cursor-pointer ${ disasterType === type ? "border-rose-600 bg-rose-50 text-rose-800 ring-1 ring-rose-500" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50" }`}>
                    {type}
                  </button>
                ))}
              </div>
              {disasterType === "Other" && (
                <input
                  type="text"
                  value={customDisasterType}
                  onChange={(e) => setCustomDisasterType(e.target.value)}
                  placeholder="Please specify custom disaster event..."
                  required
                  className="mt-1.5 w-full rounded border border-amber-300 bg-amber-50/50 px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 animate-in fade-in"
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-slate-700 mb-1 text-[11px] uppercase tracking-wider">{t["eventDate"] || "Event Date"}</label>
                <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="w-full rounded border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600" />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 text-[11px] uppercase tracking-wider">{t["time"] || "Time"}</label>
                <input type="time" value={eventTime} onChange={(e) => setEventTime(e.target.value)} className="w-full rounded border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600" />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1 text-[11px] uppercase tracking-wider">{t["description"] || "Description of Crop Loss & Damage Symptoms"}</label>
              <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe weather event, water depth, crop lodging..." className="w-full rounded border border-slate-300 p-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600" />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2.5 border-t border-slate-200">
              <button type="button" onClick={onClose} className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900">{t.cancel || "Cancel"}</button>
              <button type="submit" className="inline-flex items-center gap-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-1.5 shadow-2xs transition cursor-pointer">
                <CloudLightning className="h-3.5 w-3.5" />
                {t["submitDisasterReport"] || "Submit Disaster Report"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
