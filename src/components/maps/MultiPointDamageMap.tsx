import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { EvidenceRecord, FieldRecord, DamageSeverity } from "../../types";
import { calculatePolygonCentroid } from "../../lib/geoUtils";
import { CheckCircle, X, Sparkles, MapPin } from "lucide-react";

interface MultiPointDamageMapProps {
  field: FieldRecord;
  evidenceList: EvidenceRecord[];
  selectedEvidenceId?: string | null;
  onSelectEvidence?: (evidence: EvidenceRecord) => void;
}

export const MultiPointDamageMap: React.FC<MultiPointDamageMapProps> = ({
  field,
  evidenceList,
  selectedEvidenceId,
  onSelectEvidence,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const [activeEvidence, setActiveEvidence] = useState<EvidenceRecord | null>(null);

  const getMarkerColor = (severity?: DamageSeverity): { bg: string; border: string; label: string } => {
    switch (severity) {
      case "NONE":
        return { bg: "#10b981", border: "#047857", label: "Healthy" };
      case "LOW":
        return { bg: "#10b981", border: "#047857", label: "Low Damage" };
      case "MODERATE":
        return { bg: "#f59e0b", border: "#d97706", label: "Moderate" };
      case "HIGH":
      case "SEVERE":
        return { bg: "#ef4444", border: "#b91c1c", label: "Severe" };
      case "NOT APPLICABLE":
      case "UNKNOWN":
      default:
        return { bg: "#64748b", border: "#475569", label: "Not applicable" };
    }
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
    }

    const center = calculatePolygonCentroid(field.coordinates);
    const map = L.map(mapContainerRef.current, {
      center: center,
      zoom: 17,
      zoomControl: false,
    });

    L.control.zoom({ position: "bottomright" }).addTo(map);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    // Draw field boundary polygon
    if (field.coordinates && field.coordinates.length >= 3) {
      const polygon = L.polygon(field.coordinates, {
        color: "#059669",
        weight: 2.5,
        fillColor: "#10b981",
        fillOpacity: 0.18,
      }).addTo(map);

      map.fitBounds(polygon.getBounds(), { padding: [30, 30] });
    }

    const markersGroup = L.layerGroup().addTo(map);
    markersGroupRef.current = markersGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [field]);

  // Update Evidence Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    evidenceList.forEach((ev, idx) => {
      const isInvalid = ev.aiAssessment?.finalStatus === "INVALID EVIDENCE" || ev.damageClassification === "NOT APPLICABLE";
      const severity = isInvalid
        ? "NOT APPLICABLE"
        : ev.aiAssessment?.damageSeverity || ev.damageClassification || "UNKNOWN";
      const colors = getMarkerColor(severity);
      const isSelected = selectedEvidenceId === ev.id || activeEvidence?.id === ev.id;

      const markerHtml = `
        <div style="
          background-color: ${colors.bg};
          border: ${isSelected ? '3px solid #0f172a' : '2px solid white'};
          color: white;
          width: ${isSelected ? '30px' : '24px'};
          height: ${isSelected ? '30px' : '24px'};
          border-radius: 9999px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 11px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          transform: ${isSelected ? 'scale(1.15)' : 'scale(1.0)'};
          transition: all 0.2s ease;
          cursor: pointer;
        ">
          ${idx + 1}
        </div>
      `;

      const customIcon = L.divIcon({
        className: `damage-marker-${ev.id}`,
        html: markerHtml,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });

      const marker = L.marker([ev.lat, ev.lng], { icon: customIcon }).addTo(markersGroup);

      marker.on("click", () => {
        setActiveEvidence(ev);
        if (onSelectEvidence) {
          onSelectEvidence(ev);
        }
      });
    });
  }, [evidenceList, selectedEvidenceId, activeEvidence, onSelectEvidence]);

  return (
    <div className="relative w-full rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
      {/* Map Header / Legend */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50/90 px-3.5 py-2">
        <div className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-emerald-700" />
          <span className="text-xs font-semibold text-slate-800">
            {field.name} ({field.id}) &bull; {field.approxAreaAcres} Acres
          </span>
        </div>

        {/* Damage Severity Legend */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1 font-medium text-slate-700 text-[11px]">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 border border-emerald-700 inline-block"></span>
            Healthy
          </div>
          <div className="flex items-center gap-1 font-medium text-slate-700 text-[11px]">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500 border border-amber-700 inline-block"></span>
            Moderate
          </div>
          <div className="flex items-center gap-1 font-medium text-slate-700 text-[11px]">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500 border border-rose-700 inline-block"></span>
            Severe
          </div>
        </div>
      </div>

      {/* Map Canvas */}
      <div className="relative w-full h-64 sm:h-72 md:h-[480px]">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Selected Evidence Detail Modal / Drawer Card */}
        {activeEvidence && (
          <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-md z-[400] bg-white/95 backdrop-blur-md border border-slate-300 rounded-lg p-3 shadow-md pointer-events-auto transition-all animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-start justify-between gap-2 mb-1.5 pb-1.5 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  {activeEvidence.stepName || activeEvidence.evidenceType} &bull; {activeEvidence.id}
                </span>
                <span className="text-xs text-slate-600">
                  {new Date(activeEvidence.timestamp).toLocaleString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveEvidence(null)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-1">
                <img
                  src={activeEvidence.imageUrl}
                  alt="Crop evidence point"
                  referrerPolicy="no-referrer"
                  className="w-full h-20 object-cover rounded border border-slate-200 shadow-inner"
                />
              </div>

              <div className="col-span-2 space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-[11px]">Damage:</span>
                  <span
                    className={`font-semibold px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider ${
                      activeEvidence.damageClassification === "NOT APPLICABLE"
                        ? "bg-slate-100 text-slate-700 border border-slate-300"
                        : activeEvidence.damageClassification === "NONE"
                        ? "bg-emerald-100 text-emerald-800"
                        : activeEvidence.damageClassification === "MODERATE"
                        ? "bg-amber-100 text-amber-800"
                        : activeEvidence.damageClassification === "UNKNOWN"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    {activeEvidence.damageClassification === "NOT APPLICABLE"
                      ? "Not applicable"
                      : activeEvidence.damageClassification || "Not applicable"}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">GPS:</span>
                  <span className="font-mono text-slate-800 font-medium text-[10px]">
                    {activeEvidence.lat.toFixed(4)}, {activeEvidence.lng.toFixed(4)}
                  </span>
                </div>

                {activeEvidence.aiAssessment && (
                  <div className="bg-slate-50 rounded p-1.5 border border-slate-200 mt-1">
                    <div className="flex items-center gap-1 text-[10px] text-emerald-800 font-bold mb-0.5">
                      <Sparkles className="h-3 w-3 text-emerald-600" />
                      Gemini AI ({activeEvidence.aiAssessment.confidence}% conf)
                    </div>
                    <p className="text-[10px] text-slate-700 line-clamp-2 leading-relaxed">
                      {activeEvidence.aiAssessment.reason}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px]">
                  <span className="text-slate-500">Validation:</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                    <CheckCircle className="h-3 w-3 text-emerald-600" />
                    GPS & Weather Validated
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
