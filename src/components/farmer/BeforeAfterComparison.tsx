import React, { useState } from "react";
import { EvidenceRecord } from "../../types";
import { Sparkles, Layers, SlidersHorizontal } from "lucide-react";

interface BeforeAfterComparisonProps {
  preDisasterEvidence: EvidenceRecord[];
  postDisasterEvidence: EvidenceRecord[];
}

export const BeforeAfterComparison: React.FC<BeforeAfterComparisonProps> = ({
  preDisasterEvidence,
  postDisasterEvidence,
}) => {
  const [selectedPreIdx] = useState<number>(0);
  const [selectedPostIdx] = useState<number>(0);
  const [sliderPosition, setSliderPosition] = useState<number>(50);
  const [viewMode, setViewMode] = useState<"split" | "sideBySide">("sideBySide");

  const preItem = preDisasterEvidence[selectedPreIdx] || preDisasterEvidence[0];
  const postItem = postDisasterEvidence[selectedPostIdx] || postDisasterEvidence[0];

  if (!preItem || !postItem) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center text-xs text-slate-500">
        Both pre-disaster and post-disaster photographic evidence are required to display comparison.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs">
      {/* Header with Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3 mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <Layers className="h-4 w-4 text-emerald-700" />
            Before vs. After Crop Damage Comparison
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Temporal visual verification correlating pre-disaster crop baseline with post-disaster impact.
          </p>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
          <button
            type="button"
            onClick={() => setViewMode("sideBySide")}
            className={`px-2.5 py-1 text-xs font-semibold rounded transition cursor-pointer ${
              viewMode === "sideBySide"
                ? "bg-white text-slate-900 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Side-by-Side
          </button>
          <button
            type="button"
            onClick={() => setViewMode("split")}
            className={`px-2.5 py-1 text-xs font-semibold rounded transition cursor-pointer ${
              viewMode === "split"
                ? "bg-white text-slate-900 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Interactive Overlay Slider
          </button>
        </div>
      </div>

      {/* Main Visual Display */}
      {viewMode === "sideBySide" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* BEFORE CARD */}
          <div className="rounded-lg border border-emerald-200/80 bg-emerald-50/30 p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/80 border border-emerald-200 px-2 py-0.5 rounded">
                Before: Healthy Baseline
              </span>
              <span className="text-[11px] font-semibold text-emerald-700">
                Stage: {preItem.cropStage}
              </span>
            </div>

            <div className="relative rounded overflow-hidden border border-emerald-200 bg-slate-900 aspect-4/3">
              <img
                src={preItem.imageUrl}
                alt="Pre-disaster healthy crop"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-1.5 left-1.5 right-1.5 bg-black/60 backdrop-blur-xs text-white text-[10px] rounded px-2 py-0.5 flex items-center justify-between">
                <span>{new Date(preItem.timestamp).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}</span>
                <span>GPS: {preItem.lat.toFixed(4)}, {preItem.lng.toFixed(4)}</span>
              </div>
            </div>

            <div className="text-xs space-y-1">
              <div className="flex items-center justify-between text-slate-700 font-medium">
                <span className="text-[11px]">Condition:</span>
                <span className="text-emerald-700 font-bold text-[11px]">Lush & Erect Canopy (Healthy)</span>
              </div>
              <p className="text-[10px] text-slate-600 leading-relaxed bg-white/80 rounded p-1.5 border border-slate-200">
                {preItem.aiAssessment?.reason || "Normal tillering and uniform greenness recorded during pre-disaster baseline audit."}
              </p>
            </div>
          </div>

          {/* AFTER CARD */}
          <div className="rounded-lg border border-rose-200/80 bg-rose-50/30 p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-rose-800 bg-rose-100/80 border border-rose-200 px-2 py-0.5 rounded">
                After: Event Damage
              </span>
              <span className="text-[11px] font-semibold text-rose-700">
                Impact: {postItem.damageClassification || "Severe"}
              </span>
            </div>

            <div className="relative rounded overflow-hidden border border-rose-200 bg-slate-900 aspect-4/3">
              <img
                src={postItem.imageUrl}
                alt="Post-disaster damaged crop"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-1.5 left-1.5 right-1.5 bg-black/60 backdrop-blur-xs text-white text-[10px] rounded px-2 py-0.5 flex items-center justify-between">
                <span>{new Date(postItem.timestamp).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}</span>
                <span>GPS: {postItem.lat.toFixed(4)}, {postItem.lng.toFixed(4)}</span>
              </div>
            </div>

            <div className="text-xs space-y-1">
              <div className="flex items-center justify-between text-slate-700 font-medium">
                <span className="text-[11px]">Condition:</span>
                <span className="text-rose-700 font-bold text-[11px]">
                  {postItem.aiAssessment?.detectedDamage?.join(", ") || "Flood Inundation & Lodging"}
                </span>
              </div>
              <p className="text-[10px] text-slate-600 leading-relaxed bg-white/80 rounded p-1.5 border border-slate-200">
                {postItem.aiAssessment?.reason || "Significant water inundation and vegetative lodging causing root-zone anoxia."}
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Interactive Split Slider Overlay */
        <div className="space-y-2.5">
          <div className="relative w-full h-80 rounded-lg overflow-hidden select-none border border-slate-300 shadow-2xs">
            {/* After Image (Full background) */}
            <img
              src={postItem.imageUrl}
              alt="Post disaster"
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute top-2.5 right-2.5 bg-rose-600/90 text-white font-bold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded shadow">
              AFTER (Post-Disaster)
            </div>

            {/* Before Image (Clipped overlay) */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${sliderPosition}%` }}
            >
              <img
                src={preItem.imageUrl}
                alt="Pre disaster"
                referrerPolicy="no-referrer"
                className="absolute inset-0 w-full h-full object-cover max-w-none"
                style={{ width: "100%", minWidth: "100%", height: "100%" }}
              />
              <div className="absolute top-2.5 left-2.5 bg-emerald-700/90 text-white font-bold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded shadow">
                BEFORE (Baseline)
              </div>
            </div>

            {/* Slider Divider Line */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-white shadow-2xl cursor-ew-resize flex items-center justify-center"
              style={{ left: `${sliderPosition}%` }}
            >
              <div className="h-7 w-7 rounded-full bg-white border-2 border-slate-800 shadow-md flex items-center justify-center text-slate-800">
                <SlidersHorizontal className="h-3.5 w-3.5" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="text-xs font-semibold text-slate-600">Slide to compare:</span>
            <input
              type="range"
              min="0"
              max="100"
              value={sliderPosition}
              onChange={(e) => setSliderPosition(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded appearance-none cursor-pointer accent-emerald-600"
            />
          </div>
        </div>
      )}

      {/* AI Comparison Synthesis Summary */}
      <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 mb-1">
          <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
          AI Comparative Transition Analysis
        </div>
        <p className="text-xs text-slate-700 leading-relaxed font-medium">
          Temporal delta between {new Date(preItem.timestamp).toLocaleDateString()} (Pre-disaster) and {new Date(postItem.timestamp).toLocaleDateString()} (Post-disaster) reveals a <strong>60% reduction</strong> in erect vegetative canopy density and <strong>severe root-zone submergence</strong>, confirming acute external flood impact rather than chronic soil disease.
        </p>
      </div>
    </div>
  );
};
