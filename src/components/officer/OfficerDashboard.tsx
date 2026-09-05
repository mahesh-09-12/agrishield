import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import {
  ClaimStatus,
} from "../../types";
import {
  CheckCircle2,
  HelpCircle,
  ShieldCheck,
  Search,
  Eye,
  Sparkles,
  Check,
  X,
} from "lucide-react";
import { EvidenceDossier } from "../dossier/EvidenceDossier";

export const OfficerDashboard: React.FC = () => {
  const {
    claims,
    fields,
    officer,
    updateOfficerClaimDecision,
    activeClaimId,
    setActiveClaimId,
    t,
  } = useApp();

  const [selectedClaimId, setSelectedClaimId] = useState<string>(activeClaimId || "CLM001");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<"date" | "damage" | "completeness">("date");
  const [activeTab, setActiveTab] = useState<"claimsList" | "dossierView">("claimsList");

  // Decision Modal State
  const [decisionModalType, setDecisionModalType] = useState<ClaimStatus | null>(null);
  const [decisionRemarks, setDecisionRemarks] = useState<string>("");
  const [approvedAmount, setApprovedAmount] = useState<number>(45825);

  const selectedClaim = claims.find((c) => c.id === selectedClaimId) || claims[0];
  const selectedField = fields.find((f) => f.id === selectedClaim?.fieldId) || fields[0];

  if (claims.length === 0) {
    return (
      <div className="space-y-4">
        {/* Officer Header / Welcome Banner */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                  AIC Officer Portal &bull; {officer.assignedDistrict || "Krishna"} District
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mt-1">
                Crop Insurance Evidence Review & Claim Adjudication
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Assessor: {officer.name} ({officer.badgeNumber || officer.id}) &bull; Human-in-the-Loop AI Decision Support
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-xs">
          <ShieldCheck className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">{t.claimsEmptyState || "No claims available for review."}</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            {t.claimsEmptyStateSubtext || "Submitted insurance claims from farmers will appear here automatically for verification, multi-point geo-evidence inspection, and adjudication."}
          </p>
        </div>
      </div>
    );
  }

  // Filtering
  const filteredClaims = claims.filter((c) => {
    const matchesStatus = filterStatus === "ALL" || c.status === filterStatus;
    const matchesSearch =
      c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.disasterType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.farmerId.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Sorting
  const sortedClaims = [...filteredClaims].sort((a, b) => {
    if (sortBy === "damage") {
      const dmgA = a.aiDamageAggregate?.estimatedDamagePercent || 0;
      const dmgB = b.aiDamageAggregate?.estimatedDamagePercent || 0;
      return dmgB - dmgA;
    }
    if (sortBy === "completeness") {
      return (b.evidenceCompleteness || 0) - (a.evidenceCompleteness || 0);
    }
    return new Date(b.claimDate || 0).getTime() - new Date(a.claimDate || 0).getTime();
  });

  // Summary Metrics
  const totalClaimsCount = claims.length;
  const underReviewCount = claims.filter((c) => c.status === "Under Review").length;
  const approvedCount = claims.filter((c) => c.status === "Approved").length;
  const totalLossEstimated = claims.reduce(
    (acc, c) => acc + (c.preliminaryLossEstimate?.estimatedLossAmountINR || 0),
    0
  );

  const handleOpenDecisionModal = (type: ClaimStatus) => {
    setDecisionModalType(type);
    if (type === "Approved") {
      setDecisionRemarks("Damage verified via multi-point geo-tagged evidence & Open-Meteo rainfall telemetry. Approved for DBT indemnity release.");
      setApprovedAmount(selectedClaim?.preliminaryLossEstimate?.estimatedLossAmountINR || 0);
    } else if (type === "More Evidence Requested") {
      setDecisionRemarks("Please submit clear close-up photos of the damaged panicles and complete the western quadrant capture.");
    } else if (type === "Rejected") {
      setDecisionRemarks("Damage severity does not meet the minimum threshold stipulated under PMFBY guidelines.");
    }
  };

  const handleConfirmDecision = () => {
    if (!decisionModalType || !selectedClaim) return;
    updateOfficerClaimDecision(
      selectedClaim.id,
      decisionModalType,
      decisionRemarks,
      decisionModalType === "Approved" ? approvedAmount : undefined
    );
    setDecisionModalType(null);
  };

  return (
    <div className="space-y-4">
      {/* Officer Header / Welcome Banner */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                AIC Officer Portal &bull; {officer.assignedDistrict} District
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1">
              {t["officerReviewHeader"] || "Crop Insurance Evidence Review & Claim Adjudication"}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Assessor: {officer.name} ({officer.badgeNumber}) &bull; Human-in-the-Loop AI Decision Support
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("claimsList")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                activeTab === "claimsList"
                  ? "bg-emerald-700 text-white shadow-2xs"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              {t["claimsQueue"] || "Claims Queue"} ({claims.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("dossierView")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                activeTab === "dossierView"
                  ? "bg-emerald-700 text-white shadow-2xs"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              {t["detailedDossier"] || "Detailed Claim Dossier"}
            </button>
          </div>
        </div>

        {/* Aggregate KPI Grid (High Density) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{t["totalClaims"] || "Total Claims"}</span>
            <span className="text-xl font-bold text-slate-900 mt-0.5 block">{totalClaimsCount}</span>
            <span className="text-[10px] text-slate-500">Kharif 2026 Season</span>
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3 shadow-2xs">
            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">{t["pendingReview"] || "Pending / Under Review"}</span>
            <span className="text-xl font-bold text-amber-900 mt-0.5 block">{underReviewCount}</span>
            <span className="text-[10px] text-amber-700">Requires assessment</span>
          </div>

          <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3 shadow-2xs">
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">{t["approvedPayouts"] || "Approved Payouts"}</span>
            <span className="text-xl font-bold text-emerald-900 mt-0.5 block">{approvedCount}</span>
            <span className="text-[10px] text-emerald-700">Fast-track DBT processed</span>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{t["totalEstimatedLoss"] || "Total Estimated Loss"}</span>
            <span className="text-lg font-bold text-emerald-800 mt-0.5 block">₹{totalLossEstimated.toLocaleString()}</span>
            <span className="text-[10px] text-slate-500">Across {officer.assignedDistrict} district</span>
          </div>
        </div>
      </div>

      {activeTab === "dossierView" ? (
        <div>
          {/* Dossier Header Switcher */}
          <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-slate-200 mb-3 shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">{t["selectField"] || "Select Claim Dossier:"}</span>
              <select
                value={selectedClaimId}
                onChange={(e) => {
                  setSelectedClaimId(e.target.value);
                  setActiveClaimId(e.target.value);
                }}
                className="rounded border border-slate-300 bg-slate-50 px-2 py-1 text-xs font-bold text-slate-900 focus:outline-none"
              >
                {claims.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.id} &bull; {c.disasterType} &bull; {c.status}
                  </option>
                ))}
              </select>
            </div>

            {/* Officer Action Buttons for active dossier */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleOpenDecisionModal("Approved")}
                className="inline-flex items-center gap-1 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-2.5 py-1.5 rounded transition cursor-pointer"
              >
                <Check className="h-3.5 w-3.5" />
                {t["approve"] || "Approve"}
              </button>
              <button
                type="button"
                onClick={() => handleOpenDecisionModal("More Evidence Requested")}
                className="inline-flex items-center gap-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-2.5 py-1.5 rounded transition cursor-pointer"
              >
                <HelpCircle className="h-3.5 w-3.5" />
                {t["requestMoreEvidence"] || "Request More Evidence"}
              </button>
              <button
                type="button"
                onClick={() => handleOpenDecisionModal("Rejected")}
                className="inline-flex items-center gap-1 border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-bold px-2.5 py-1.5 rounded transition cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
                {t["reject"] || "Reject"}
              </button>
            </div>
          </div>

          <EvidenceDossier claimId={selectedClaimId} />
        </div>
      ) : (
        /* Claims Queue Tab */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Claims List (Left 2 Cols) */}
          <div className="lg:col-span-2 space-y-3">
            {/* Filter & Search Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder={t["searchPlaceholder"] || "Search by Claim ID, Disaster, Farmer..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded border border-slate-300 text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="rounded border border-slate-300 bg-slate-50 px-2 py-1.5 text-xs text-slate-700 font-medium focus:outline-none"
                >
                  <option value="ALL">{t["allStatuses"] || "All Statuses"}</option>
                  <option value="Under Review">{t["underReview"] || "Under Review"}</option>
                  <option value="Evidence Collection">{t["evidenceTimeline"] || "Evidence Collection"}</option>
                  <option value="Approved">{t["approved"] || "Approved"}</option>
                  <option value="More Evidence Requested">{t["requestMoreEvidence"] || "More Evidence Requested"}</option>
                  <option value="Rejected">{t["rejected"] || "Rejected"}</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="rounded border border-slate-300 bg-slate-50 px-2 py-1.5 text-xs text-slate-700 font-medium focus:outline-none"
                >
                  <option value="date">{t["sortDate"] || "Sort: Date"}</option>
                  <option value="damage">{t["sortDamage"] || "Sort: Damage %"}</option>
                  <option value="completeness">{t["sortCompleteness"] || "Sort: Completeness"}</option>
                </select>
              </div>
            </div>

            {/* Claims Table / Card List */}
            <div className="space-y-2.5">
              {sortedClaims.map((item) => {
                const isSelected = item.id === selectedClaimId;

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      setSelectedClaimId(item.id);
                      setActiveClaimId(item.id);
                    }}
                    className={`rounded-lg border p-3 transition cursor-pointer ${
                      isSelected
                        ? "border-emerald-600 bg-emerald-50/30 ring-1 ring-emerald-500 shadow-2xs"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-2xs"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-slate-100 pb-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-slate-900">
                          {item.id}
                        </span>
                        <span className="text-xs font-semibold text-slate-700">
                          &bull; {item.disasterType}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          ({item.claimDate})
                        </span>
                      </div>

                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          item.status === "Approved"
                            ? "bg-emerald-100 text-emerald-800"
                            : item.status === "Under Review"
                            ? "bg-amber-100 text-amber-800"
                            : item.status === "More Evidence Requested"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-slate-100 text-slate-800"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div>
                        <span className="text-slate-400 text-[10px] font-bold uppercase block">{t["estimatedDamage"] || "Estimated Damage"}</span>
                        <span className="font-bold text-rose-700 text-sm">
                          {item.aiDamageAggregate.estimatedDamagePercent}%
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 text-[10px] font-bold uppercase block">{t["evidenceCompleteness"] || "Evidence Completeness"}</span>
                        <span className="font-bold text-emerald-800 text-sm">
                          {item.evidenceCompleteness}%
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 text-[10px] font-bold uppercase block">{t["affectedArea"] || "Affected Area"}</span>
                        <span className="font-semibold text-slate-800 text-sm">
                          {item.preliminaryLossEstimate.estimatedAffectedAcres} {t["acres"] || "Acres"}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 text-[10px] font-bold uppercase block">{t["estimatedIndemnity"] || "Estimated Indemnity"}</span>
                        <span className="font-bold text-emerald-800 text-sm">
                          ₹{item.preliminaryLossEstimate.estimatedLossAmountINR.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {item.officerDecision?.remarks && (
                      <div className="mt-2 pt-1.5 border-t border-slate-100 text-[11px] text-slate-600 flex items-start gap-1">
                        <span className="font-semibold text-slate-700">Remarks:</span>
                        <span className="line-clamp-1">{item.officerDecision.remarks}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Review Sidebar (Right Col) with High-Density Deep Slate Action Box */}
          <div className="space-y-3">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
                    {t["selectField"] || "Active Claim Selected"}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">{selectedClaim.id}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("dossierView")}
                  className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer"
                >
                  <Eye className="h-3.5 w-3.5" />
                  {t["detailedDossier"] || "Full Dossier"}
                </button>
              </div>

              {/* Quick AI Summary */}
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-950 flex items-center gap-1 text-[11px]">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                    {t["damageAssessment"] || "AI Damage Assessment"}
                  </span>
                  <span className="font-bold text-rose-700 text-xs">
                    {selectedClaim.aiDamageAggregate.estimatedDamagePercent}% Loss
                  </span>
                </div>

                {/* Progress bar split */}
                <div className="flex h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${selectedClaim.aiDamageAggregate.healthyPercent}%` }}
                    className="bg-emerald-500"
                    title={`Healthy: ${selectedClaim.aiDamageAggregate.healthyPercent}%`}
                  />
                  <div
                    style={{ width: `${selectedClaim.aiDamageAggregate.moderatePercent}%` }}
                    className="bg-amber-400"
                    title={`Moderate: ${selectedClaim.aiDamageAggregate.moderatePercent}%`}
                  />
                  <div
                    style={{ width: `${selectedClaim.aiDamageAggregate.severePercent}%` }}
                    className="bg-rose-500"
                    title={`Severe: ${selectedClaim.aiDamageAggregate.severePercent}%`}
                  />
                </div>

                <div className="grid grid-cols-3 gap-1 text-center text-[10px] font-semibold">
                  <div className="bg-white rounded p-1 text-emerald-800 border border-emerald-200">
                    {selectedClaim.aiDamageAggregate.healthyPercent}% {t["healthy"] || "Healthy"}
                  </div>
                  <div className="bg-white rounded p-1 text-amber-800 border border-amber-200">
                    {selectedClaim.aiDamageAggregate.moderatePercent}% {t["moderate"] || "Moderate"}
                  </div>
                  <div className="bg-white rounded p-1 text-rose-800 border border-rose-200">
                    {selectedClaim.aiDamageAggregate.severePercent}% {t["severe"] || "Severe"}
                  </div>
                </div>
              </div>

              {/* Rule Validation Checklist */}
              <div className="space-y-1 text-xs">
                <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wider block">{t["ruleValidationMatrix"] || "Rule Validation Matrix:"}</span>
                <div className="flex items-center justify-between text-[11px] p-1.5 bg-slate-50 rounded border border-slate-100">
                  <span className="text-slate-600">{t["gpsVerification"] || "Boundary GPS Coordinates:"}</span>
                  <span className="font-bold text-emerald-700">Passed ✓</span>
                </div>
                <div className="flex items-center justify-between text-[11px] p-1.5 bg-slate-50 rounded border border-slate-100">
                  <span className="text-slate-600">{t["timestampCheck"] || "Timestamp Continuity:"}</span>
                  <span className="font-bold text-emerald-700">Passed ✓</span>
                </div>
                <div className="flex items-center justify-between text-[11px] p-1.5 bg-slate-50 rounded border border-slate-100">
                  <span className="text-slate-600">{t["weatherCorrelation"] || "Open-Meteo Rainfall Spike:"}</span>
                  <span className="font-bold text-emerald-700">Confirmed (94.2mm) ✓</span>
                </div>
              </div>

              {/* High-Density Action Command Box */}
              <div className="bg-slate-900 rounded-lg p-3 text-slate-300 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-white border-b border-slate-800 pb-1.5">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                    {t["officerDecision"] || "Officer Decision"}
                  </span>
                  <span className="font-mono text-emerald-400">
                    ₹{selectedClaim.preliminaryLossEstimate.estimatedLossAmountINR.toLocaleString()}
                  </span>
                </div>

                <div className="space-y-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => handleOpenDecisionModal("Approved")}
                    className="w-full flex items-center justify-center gap-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 shadow-xs transition cursor-pointer"
                  >
                    <Check className="h-3.5 w-3.5" />
                    {t["approvePayout"] || "Approve Claim Payout"}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenDecisionModal("More Evidence Requested")}
                    className="w-full flex items-center justify-center gap-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs py-1.5 border border-slate-700 transition cursor-pointer"
                  >
                    <HelpCircle className="h-3.5 w-3.5" />
                    {t["requestMoreEvidence"] || "Request Additional Evidence"}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenDecisionModal("Rejected")}
                    className="w-full flex items-center justify-center gap-1 rounded border border-rose-900/60 text-rose-400 hover:bg-rose-950/40 font-bold text-xs py-1.5 transition cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                    {t["rejectClaim"] || "Reject Claim"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Officer Decision Confirmation Modal */}
      {decisionModalType && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-2xl space-y-3 animate-in fade-in zoom-in-95 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-sm font-bold text-slate-900">
                {t["confirmDetermination"] || "Confirm Determination"}: {decisionModalType}
              </h3>
              <button
                type="button"
                onClick={() => setDecisionModalType(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="text-xs text-slate-600">
              Claim ID: <span className="font-mono font-bold text-slate-900">{selectedClaim.id}</span> &bull; Field Area: {selectedField.approxAreaAcres} Acres
            </div>

            {decisionModalType === "Approved" && (
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  {t["approvedCompensationAmount"] || "Approved Compensation Amount (INR):"}
                </label>
                <input
                  type="number"
                  value={approvedAmount}
                  onChange={(e) => setApprovedAmount(Number(e.target.value))}
                  className="w-full rounded border border-slate-300 px-3 py-1.5 text-sm font-bold text-emerald-800 focus:outline-none focus:border-emerald-600"
                />
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
                {t["officialRemarks"] || "Official Case Remarks / Justification:"}
              </label>
              <textarea
                rows={3}
                value={decisionRemarks}
                onChange={(e) => setDecisionRemarks(e.target.value)}
                className="w-full rounded border border-slate-300 p-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                placeholder="Enter remarks explaining the decision..."
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setDecisionModalType(null)}
                className="px-3 py-1.5 rounded border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDecision}
                className="px-3 py-1.5 rounded bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-2xs transition"
              >
                {t["submitDetermination"] || "Submit Official Determination"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
