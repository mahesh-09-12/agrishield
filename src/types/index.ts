export type UserRole = "farmer" | "officer" | "FARMER" | "OFFICER";

export type LanguageCode = "en" | "hi" | "te" | "ta" | "mr";

export interface FarmerProfile {
  id: string; // e.g. "FMR001"
  farmerId?: string; // e.g. "FMR001"
  uid?: string;
  name: string;
  phone: string;
  email: string;
  village: string;
  district: string;
  state: string;
  preferredLanguage: LanguageCode;
  role?: string;
  aadharLastFour?: string;
  createdAt?: string;
  updatedAt?: string;
  insuranceInfo: {
    policyNumber: string;
    schemeName: string; // e.g. "Pradhan Mantri Fasal Bima Yojana (PMFBY)"
    sumInsuredPerAcre: number; // in INR
    insurerName: string; // e.g. "Agriculture Insurance Company of India"
    coverageStartDate: string;
    coverageEndDate: string;
    applicationId: string;
  };
}

export interface FarmerRegistrationInput {
  name: string;
  email: string;
  password: string;
  phone: string;
  village: string;
  district: string;
  state: string;
  preferredLanguage: LanguageCode;
  aadharLastFour?: string;
}

export interface OfficerProfile {
  uid: string;
  id: string;
  name: string;
  email: string;
  role: "officer" | "OFFICER";
  officerId: string;
  district: string;
  badgeNumber?: string;
  assignedDistrict?: string;
  insurerName?: string;
}

export interface FirestoreLatLng {
  latitude: number;
  longitude: number;
}

export interface FirestoreField {
  fieldId: string;
  name: string;
  areaAcres: number;
  surveyNumber: string;
  soilType: string;
  center: FirestoreLatLng;
  boundary: FirestoreLatLng[];
  createdAt: string;
  // UI helper aliases
  id?: string;
  approxAreaAcres?: number;
  centerLat?: number;
  centerLng?: number;
  coordinates?: [number, number][];
}

export interface FirestoreCrop {
  cropId: string;
  fieldId?: string;
  cropType: string;
  variety: string;
  sowingDate: string;
  expectedHarvestDate?: string;
  currentStage: string;
  season: string;
  cultivatedAreaAcres?: number;
  createdAt: string;
  // UI helper alias
  id?: string;
}

export interface FirestoreEvidence {
  evidenceId: string;
  fieldId: string;
  cropId: string;
  type: string;
  imageUrl: string;
  latitude: number;
  longitude: number;
  capturedAt: string;
  cropStage: string;
  stepName?: string;
  notes?: string;
  damageClassification?: string;
  aiAssessment?: AIAssessmentResult;
  verification?: VerificationResult;
  createdAt: string;
  // UI helper aliases
  id?: string;
  lat?: number;
  lng?: number;
  timestamp?: string;
  evidenceType?: EvidenceType;
}

export interface FirestoreDisaster {
  disasterId: string;
  fieldId: string;
  cropId?: string;
  disasterType: string;
  date: string;
  time: string;
  description: string;
  status: string;
  reportedAt: string;
  createdAt: string;
  photoUrl?: string;
  weatherAnomalyConfirmed?: boolean;
  // UI helper alias
  id?: string;
}

export interface FirestoreClaim {
  claimId: string;
  fieldId: string;
  cropId?: string;
  disasterId?: string | null;
  farmerId?: string;
  status: string;
  claimDate?: string;
  disasterDate?: string;
  description?: string;
  evidenceCompleteness?: number;
  disasterType?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  officerRemarks?: string;
  aiDamageAggregate?: {
    healthyPercent: number;
    moderatePercent: number;
    severePercent: number;
    estimatedDamagePercent: number;
    totalImagesAnalyzed: number;
  };
  preliminaryLossEstimate?: {
    fieldAreaAcres: number;
    estimatedDamagePercent: number;
    estimatedAffectedAcres: number;
    sumInsuredPerAcreINR: number;
    estimatedLossAmountINR: number;
  };
  officerDecision?: {
    officerName: string;
    officerId: string;
    decision: ClaimStatus;
    actionTimestamp: string;
    remarks: string;
    approvedPayoutINR?: number;
  };
  createdAt: string;
  // UI helper alias
  id?: string;
}

export interface FieldRecord {
  id: string; // e.g. "FL001"
  fieldId?: string;
  farmerId: string;
  name: string;
  surveyNumber: string;
  soilType: string;
  coordinates: [number, number][]; // [lat, lng] array forming closed polygon
  centerLat: number;
  centerLng: number;
  approxAreaAcres: number;
  areaAcres?: number;
  center?: FirestoreLatLng;
  boundary?: FirestoreLatLng[];
  registeredAt: string;
  createdAt?: string;
}

export type CropStage =
  | "Sowing"
  | "Vegetative Growth"
  | "Tillering"
  | "Flowering"
  | "Grain Filling"
  | "Pre-Harvest"
  | "Harvest Ready";

export interface CropRecord {
  id: string; // e.g. "CRP001"
  fieldId: string;
  farmerId: string;
  cropType: string; // e.g. "Rice (Paddy)"
  variety: string; // e.g. "BPT 5204 (Samba Mahsuri)"
  sowingDate: string;
  expectedHarvestDate: string;
  currentStage: CropStage;
  season: string; // "Kharif 2026"
  cultivatedAreaAcres: number;
}

export type EvidenceType =
  | "Growth"
  | "Pre-disaster"
  | "Post-disaster"
  | "Wide field view"
  | "Damaged area"
  | "Close-up";

export type DamageSeverity = "NONE" | "LOW" | "MODERATE" | "HIGH" | "SEVERE" | "UNKNOWN" | "NOT APPLICABLE";

export interface AIAssessmentResult {
  finalStatus: "VERIFIED EVIDENCE" | "NEEDS REVIEW" | "INVALID EVIDENCE" | "EVIDENCE MISMATCH";
  contentIdentified?: string;
  isAgricultural?: boolean;
  evidenceType: string;
  evidenceQuality: "HIGH" | "MEDIUM" | "LOW" | "INVALID";
  cropIdentified: string;
  cropStage: string;
  observedConditions: string;
  detectedDamage: string[];
  damageSeverity: DamageSeverity;
  estimatedAffectedArea?: string;
  impactPercentage?: string;
  evidenceMismatch: boolean;
  confidence: number;
  reason: string;
  humanReviewRequired: boolean;
  // Fallback and metadata fields
  isFallback?: boolean;
  fallbackReason?: string;
  analyzedAt?: string;
}

export interface VerificationResult {
  gpsPassed: boolean;
  gpsDistanceMeters: number;
  timestampPassed: boolean;
  duplicatePassed: boolean;
  weatherCorrelationPassed: boolean;
  timelinePassed: boolean;
  overallStatus: "Passed" | "Flagged";
  anomalyDetails?: string[];
  checkedAt: string;
}

export interface EvidenceRecord {
  id: string; // e.g. "EVD001"
  farmerId: string;
  fieldId: string;
  cropId: string;
  imageUrl: string;
  lat: number;
  lng: number;
  timestamp: string;
  cropStage: CropStage | string;
  evidenceType: EvidenceType;
  stepName?: string;
  notes?: string;
  damageClassification?: DamageSeverity;
  aiAssessment?: AIAssessmentResult;
  verification?: VerificationResult;
  isOfflinePending?: boolean;
  imageHash?: string;
}

export type SoilType =
  | "Alluvial Clay Loam"
  | "Black Cotton Soil"
  | "Red Sandy Soil"
  | "Loamy Soil"
  | "Sandy Loam";

export type DisasterType =
  | "Flood"
  | "Heavy Rainfall"
  | "Cyclone"
  | "Hailstorm"
  | "Drought"
  | "Pest Attack"
  | "Pest/Disease"
  | "Unseasonal Frost";

export type ClaimStatus =
  | "Evidence Collection"
  | "Submitted"
  | "Under Review"
  | "Approved"
  | "Rejected"
  | "More Evidence Requested";

export interface DisasterReport {
  id: string; // e.g. "DR001"
  fieldId: string;
  cropId: string;
  farmerId: string;
  disasterType: DisasterType;
  date: string;
  time: string;
  description: string;
  photoUrl?: string;
  status: ClaimStatus;
  reportedAt: string;
  weatherAnomalyConfirmed?: boolean;
}

export interface ClaimRecord {
  id: string; // e.g. "CLM001"
  disasterReportId: string;
  farmerId: string;
  fieldId: string;
  cropId: string;
  status: ClaimStatus;
  claimDate: string;
  evidenceCompleteness: number; // percentage, e.g. 91%
  disasterType: DisasterType;
  aiDamageAggregate: {
    healthyPercent: number;
    moderatePercent: number;
    severePercent: number;
    estimatedDamagePercent: number;
    totalImagesAnalyzed: number;
  };
  preliminaryLossEstimate: {
    fieldAreaAcres: number;
    estimatedDamagePercent: number;
    estimatedAffectedAcres: number;
    sumInsuredPerAcreINR: number;
    estimatedLossAmountINR: number;
  };
  officerDecision?: {
    officerName: string;
    officerId: string;
    decision: ClaimStatus;
    actionTimestamp: string;
    remarks: string;
    approvedPayoutINR?: number;
  };
}

export interface WeatherDataPoint {
  date: string;
  maxTempC: number;
  rainfallMm: number;
  windSpeedKmh: number;
  condition: string;
  isExtremeEvent: boolean;
}

export interface WeatherReport {
  source: string;
  location: { lat: number; lng: number };
  daily: WeatherDataPoint[];
  correlationSummary: {
    peakRainfallDate: string;
    peakRainfallMm: number;
    peakWindSpeedKmh: number;
    avgMaxTempC: number;
    extremeEventConfirmed: boolean;
    eventLabel: string;
    correlationStatement: string;
  };
}
