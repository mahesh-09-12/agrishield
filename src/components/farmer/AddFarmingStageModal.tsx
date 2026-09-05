import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { X, CheckCircle2, Sprout, Camera } from "lucide-react";

export const AddFarmingStageModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  fieldId: string;
  cropId: string;
}> = ({ isOpen, onClose, fieldId, cropId }) => {
  const { captureEvidence, updateCropStage, farmer, fields, crops, t } = useApp();

  const currentField = fields.find((f) => f.id === fieldId) || fields[0];
  const currentCrop = crops.find((c) => c.id === cropId) || crops[0];

  const [selectedStage, setSelectedStage] = useState<string>("Vegetative Growth");
  const [customStage, setCustomStage] = useState<string>("");
  const [observationDate, setObservationDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState<string>("");
  const [imageFileOrDataUrl, setImageFileOrDataUrl] = useState<string | File>("");
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [imageError, setImageError] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFileOrDataUrl(file);
      setImageError(false);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fieldId || !cropId) return;
    setIsSubmitting(true);

    const finalStage = selectedStage === "Other" ? (customStage || "Custom Farming Stage") : selectedStage;

    try {
      await captureEvidence({
        farmerId: farmer?.farmerId || farmer?.id || "FMR-001",
        fieldId,
        cropId,
        imageUrl: previewUrl || undefined,
        imageFileOrDataUrl: imageFileOrDataUrl || undefined,
        lat: undefined,
        lng: undefined,
        cropStage: finalStage,
        evidenceType: "Growth",
        stepName: `Stage Update: ${finalStage}`,
        notes: notes || `Manually recorded farming stage progression to ${finalStage} on ${observationDate}.`,
        damageClassification: "NONE",
      });

      if (currentCrop && updateCropStage) {
        await updateCropStage(currentCrop.id, finalStage);
      }

      onClose();
    } catch (err) {
      console.error("Error adding farming stage:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-4 sm:p-5 shadow-xl space-y-3.5 animate-in fade-in zoom-in-95 border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded bg-emerald-100 flex items-center justify-center text-emerald-700">
              <Sprout className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Add Next Farming Stage</h3>
              <span className="text-[11px] text-slate-500">
                Plot: {currentField?.name} • Crop: {currentCrop?.cropType || "Rice"}
              </span>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-100 transition cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1 uppercase tracking-wider">Select Farming Growth Stage</label>
            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="w-full rounded border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
            >
              <option value="Vegetative Growth">Vegetative Growth</option>
              <option value="Tillering">Tillering / Branching</option>
              <option value="Flowering">Flowering / Anthesis</option>
              <option value="Grain Filling">Grain Filling / Pod Formation</option>
              <option value="Pre-Harvest">Pre-Harvest / Maturity</option>
              <option value="Harvest Ready">Harvest Ready</option>
              <option value="Fertilization">Fertilization / Nutrient Application</option>
              <option value="Irrigation">Irrigation Milestone</option>
              <option value="Pest Management">Pest & Disease Monitoring</option>
              <option value="Other">Other (Custom Stage)</option>
            </select>
            {selectedStage === "Other" && (
              <input
                type="text"
                value={customStage}
                onChange={(e) => setCustomStage(e.target.value)}
                placeholder="Enter custom farming stage name..."
                required
                className="mt-1.5 w-full rounded border border-amber-300 bg-amber-50/50 px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
              />
            )}
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1 uppercase tracking-wider">Observation Date</label>
            <input
              type="date"
              value={observationDate}
              onChange={(e) => setObservationDate(e.target.value)}
              required
              className="w-full rounded border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1 uppercase tracking-wider">Stage Notes & Observations</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Enter details about crop health, fertilizer applied, weather conditions, or growth status..."
              className="w-full rounded border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 resize-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1 uppercase tracking-wider">Stage Photo Evidence (Optional)</label>
            <div className="flex items-center gap-3">
              {previewUrl ? (
                <img src={previewUrl} alt="Stage preview" className="w-16 h-12 object-cover rounded border border-slate-200 shrink-0" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-16 h-12 rounded border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                  <Camera className="w-5 h-5" />
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <button type="button" onClick={onClose} className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900">Cancel</button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-3.5 py-1.5 shadow-2xs transition cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              {isSubmitting ? "Saving Stage..." : "Add to Timeline"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
