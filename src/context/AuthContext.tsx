import React, { createContext, useContext, useState, useEffect } from "react";
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { auth, db, isFirebaseConfigured } from "../lib/firebase";
import { FarmerProfile, FarmerRegistrationInput, OfficerProfile } from "../types";
import { initialFarmerProfile, initialOfficerProfile } from "../lib/demoData";

interface AuthContextType {
  user: User | null;
  userRole: "farmer" | "officer" | null;
  farmerProfile: FarmerProfile | null;
  officerProfile: OfficerProfile | null;
  loading: boolean;
  error: string | null;
  clearError: () => void;
  login: (email: string, pass: string) => Promise<void>;
  loginAsDemoFarmer: () => Promise<void>;
  register: (input: FarmerRegistrationInput) => Promise<void>;
  logout: () => Promise<void>;
  updateFarmerProfile: (updates: Partial<FarmerProfile>) => Promise<void>;
  seedOfficerTestAccount: () => Promise<void>;
  loginAsOfficer: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function getFriendlyAuthErrorMessage(error: unknown): string {
  if (!error) return "An unexpected error occurred. Please try again.";
  console.error("Firebase Authentication error:", error);
  const errObj = error as { code?: string; message?: string };
  const code = errObj.code || errObj.message || "";

  if (code.includes("auth/configuration-not-found")) {
    return "Authentication is not configured for this application. Please check configuration settings.";
  }
  if (code.includes("auth/invalid-email")) {
    return "Please enter a valid email address.";
  }
  if (code.includes("auth/user-not-found") || code.includes("auth/invalid-credential") || code.includes("auth/wrong-password")) {
    return "Invalid email or password. Please verify your login details.";
  }
  if (code.includes("auth/email-already-in-use")) {
    return "An account with this email address already exists. Please sign in.";
  }
  if (code.includes("auth/weak-password")) {
    return "Password is too weak. Please use at least 6 characters.";
  }
  if (code.includes("auth/network-request-failed")) {
    return "Network connection issue. Please check your internet connection.";
  }
  if (code.includes("auth/too-many-requests")) {
    return "Too many failed login attempts. Please wait a moment and try again.";
  }
  if (code.includes("auth/operation-not-allowed")) {
    return "Email/Password sign-in is currently disabled.";
  }
  if (code.includes("permission-denied") || code.includes("Missing or insufficient permissions")) {
    return "We couldn't access your account data. Please try again.";
  }
  if (typeof error === "string") return error;
  return errObj.message || "An authentication error occurred. Please try again.";
}

async function generateReadableFarmerId(): Promise<string> {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `FMR${randomNum}`;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<"farmer" | "officer" | null>(null);
  const [farmerProfile, setFarmerProfile] = useState<FarmerProfile | null>(null);
  const [officerProfile, setOfficerProfile] = useState<OfficerProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  const loadUserRoleAndProfile = async (firebaseUser: User) => {
    const userDocRef = doc(db, "users", firebaseUser.uid);

    // 1. Read users/{uid} first to get role
    let userData: any = null;
    try {
      const userSnap = await getDoc(userDocRef);
      if (userSnap.exists()) {
        userData = userSnap.data();
      }
    } catch (err: any) {
      console.warn("User doc read warning:", err);
    }

    // 2. Check if role === "officer" from Firestore users/{uid}
    const roleVal = (userData?.role || "").toLowerCase();
    if (roleVal === "officer") {
      setUserRole("officer");
      const offProfile: OfficerProfile = {
        uid: firebaseUser.uid,
        id: userData.officerId || "AIC-AP-KR-042",
        name: userData.name || "Dr. Ananya Sharma",
        email: firebaseUser.email || "",
        role: "officer",
        officerId: userData.officerId || "AIC-AP-KR-042",
        district: userData.district || "Krishna",
        badgeNumber: userData.officerId || "AIC-AP-KR-042",
        assignedDistrict: userData.district || "Krishna",
        insurerName: "Agriculture Insurance Company of India",
      };
      setOfficerProfile(offProfile);
      setFarmerProfile(null);
      localStorage.setItem("cached_officer_" + firebaseUser.uid, JSON.stringify(offProfile));
      return;
    }

    // Check cached officer if offline
    const cachedOff = localStorage.getItem("cached_officer_" + firebaseUser.uid);
    if (cachedOff) {
      try {
        const parsed = JSON.parse(cachedOff);
        if (parsed.role === "officer") {
          setUserRole("officer");
          setOfficerProfile(parsed);
          setFarmerProfile(null);
          return;
        }
      } catch (e) {}
    }

    // 3. If role === "farmer" (or not officer), read/provision farmers/{uid}
    const farmerDocRef = doc(db, "farmers", firebaseUser.uid);
    let raw: any = null;
    try {
      const farmerSnap = await getDoc(farmerDocRef);
      if (farmerSnap.exists()) {
        raw = farmerSnap.data();
      }
    } catch (err: any) {
      console.warn("Farmer profile get warning (offline/network):", err);
    }

    if (!raw) {
      // Check cached farmer
      const cachedFarmer = localStorage.getItem("cached_farmer_" + firebaseUser.uid);
      if (cachedFarmer) {
        try {
          raw = JSON.parse(cachedFarmer);
        } catch (e) {}
      }
    }

    if (!raw) {
      // Provision default farmer profile so login never fails with "Farmer profile not found"
      raw = {
        id: `FMR-${firebaseUser.uid.substring(0, 6)}`,
        farmerId: `FMR-${firebaseUser.uid.substring(0, 6)}`,
        uid: firebaseUser.uid,
        name: firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split("@")[0] : "Farmer"),
        phone: "9876543210",
        email: firebaseUser.email || "",
        village: "Vijayawada Rural",
        district: "Krishna",
        state: "Andhra Pradesh",
        preferredLanguage: "en",
        role: "farmer",
        aadharLastFour: "9999",
        createdAt: new Date().toISOString(),
        insuranceInfo: {
          policyNumber: `PMFBY/AP/2026/${Math.floor(100000 + Math.random() * 900000)}`,
          schemeName: "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
          sumInsuredPerAcre: 38500,
          insurerName: "Agriculture Insurance Company of India (AIC)",
          coverageStartDate: "2026-06-01",
          coverageEndDate: "2026-11-30",
          applicationId: `APP-PMFBY-${Math.floor(10000 + Math.random() * 90000)}`,
        },
      };
      try {
        await setDoc(farmerDocRef, raw, { merge: true });
      } catch (e) {
        console.warn("Farmer doc auto-create warning:", e);
      }
    }

    setUserRole("farmer");
    const farmerProf: FarmerProfile = {
      id: raw.farmerId || raw.id || `FMR-${firebaseUser.uid.substring(0, 4)}`,
      farmerId: raw.farmerId || raw.id || `FMR-${firebaseUser.uid.substring(0, 4)}`,
      uid: firebaseUser.uid,
      name: raw.name || firebaseUser.displayName || "Farmer",
      phone: raw.phone || "9876543210",
      email: raw.email || firebaseUser.email || "",
      village: raw.village || "Vijayawada Rural",
      district: raw.district || "Krishna",
      state: raw.state || "Andhra Pradesh",
      preferredLanguage: raw.preferredLanguage || "en",
      role: "farmer",
      aadharLastFour: raw.aadharLastFour || "9999",
      createdAt: raw.createdAt || new Date().toISOString(),
      updatedAt: raw.updatedAt,
      insuranceInfo: raw.insuranceInfo || {
        policyNumber: `PMFBY/AP/2026/${Math.floor(100000 + Math.random() * 900000)}`,
        schemeName: "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
        sumInsuredPerAcre: 38500,
        insurerName: "Agriculture Insurance Company of India (AIC)",
        coverageStartDate: "2026-06-01",
        coverageEndDate: "2026-11-30",
        applicationId: `APP-PMFBY-${Math.floor(10000 + Math.random() * 90000)}`,
      },
    };
    setFarmerProfile(farmerProf);
    setOfficerProfile(null);
    localStorage.setItem("cached_farmer_" + firebaseUser.uid, JSON.stringify(farmerProf));
    return;
  };

  const restoreOfflineSession = () => {
    const savedOffline = localStorage.getItem("agrishield_active_user");
    if (savedOffline) {
      try {
        const parsed = JSON.parse(savedOffline);
        const offlineUser = {
          uid: parsed.uid,
          email: parsed.email,
          displayName: parsed.email?.split("@")[0] || "User",
        } as User;
        setUser(offlineUser);
        if (parsed.role === "officer") {
          setUserRole("officer");
          const cachedOff = localStorage.getItem("cached_officer_" + parsed.uid);
          if (cachedOff) {
            setOfficerProfile(JSON.parse(cachedOff));
          } else {
            setOfficerProfile(initialOfficerProfile);
          }
          setFarmerProfile(null);
        } else {
          setUserRole("farmer");
          const cachedFarm = localStorage.getItem("cached_farmer_" + parsed.uid);
          if (cachedFarm) {
            setFarmerProfile(JSON.parse(cachedFarm));
          } else {
            setFarmerProfile(initialFarmerProfile);
          }
          setOfficerProfile(null);
        }
      } catch {
        setUser(null);
        setUserRole(null);
        setFarmerProfile(null);
        setOfficerProfile(null);
      }
    } else {
      setUser(null);
      setUserRole(null);
      setFarmerProfile(null);
      setOfficerProfile(null);
    }
  };

  useEffect(() => {
    if (!isFirebaseConfigured) {
      restoreOfflineSession();
      setLoading(false);
      return;
    }

    try {
      const unsubscribe = onAuthStateChanged(
        auth,
        async (currentUser) => {
          setLoading(true);
          if (currentUser) {
            setUser(currentUser);
            try {
              await loadUserRoleAndProfile(currentUser);
              setError(null);
            } catch (err: any) {
              console.error("Role lookup error:", err);
              setUserRole(null);
              setFarmerProfile(null);
              setOfficerProfile(null);
              setError(err.message || "Farmer profile not found. Please register first.");
            }
          } else {
            restoreOfflineSession();
          }
          setLoading(false);
        },
        (authErr) => {
          console.warn("onAuthStateChanged auth error handler:", authErr);
          restoreOfflineSession();
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.warn("Could not register onAuthStateChanged:", err);
      restoreOfflineSession();
      setLoading(false);
    }
  }, []);

  const login = async (email: string, pass: string): Promise<void> => {
    setError(null);
    setLoading(true);

    if (!isFirebaseConfigured) {
      // Direct offline farmer session for demo / preview environments
      const offlineUser = {
        uid: "offline_" + email.replace(/[^a-zA-Z0-9]/g, "_"),
        email: email.trim(),
        displayName: email.split("@")[0],
      } as User;
      setUser(offlineUser);
      localStorage.setItem(
        "agrishield_active_user",
        JSON.stringify({ uid: offlineUser.uid, email: offlineUser.email, role: "farmer" })
      );
      const cachedFarmer = localStorage.getItem("cached_farmer_" + offlineUser.uid);
      if (cachedFarmer) {
        try {
          const parsed = JSON.parse(cachedFarmer);
          setUserRole("farmer");
          setFarmerProfile(parsed);
          setOfficerProfile(null);
          setLoading(false);
          return;
        } catch {}
      }
      const defaultFarmer: FarmerProfile = {
        id: "FMR-OFFLINE",
        farmerId: "FMR-OFFLINE",
        uid: offlineUser.uid,
        name: email.split("@")[0],
        email: email.trim(),
        phone: "9876543210",
        village: "Vijayawada Rural",
        district: "Krishna",
        state: "Andhra Pradesh",
        preferredLanguage: "en",
        role: "farmer",
        aadharLastFour: "9999",
        createdAt: new Date().toISOString(),
        insuranceInfo: {
          policyNumber: "PMFBY/AP/2026/999888",
          schemeName: "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
          sumInsuredPerAcre: 38500,
          insurerName: "Agriculture Insurance Company of India (AIC)",
          coverageStartDate: "2026-06-01",
          coverageEndDate: "2026-11-30",
          applicationId: "APP-PMFBY-OFFLINE",
        },
      };
      setUserRole("farmer");
      setFarmerProfile(defaultFarmer);
      setOfficerProfile(null);
      localStorage.setItem("cached_farmer_" + offlineUser.uid, JSON.stringify(defaultFarmer));
      setLoading(false);
      return;
    }

    try {
      const credential = await signInWithEmailAndPassword(auth, email.trim(), pass);
      setUser(credential.user);
      await loadUserRoleAndProfile(credential.user);
    } catch (err: any) {
      const code = err.code || err.message || "";
      if (
        code.includes("auth/network-request-failed") ||
        code.includes("offline") ||
        code.includes("unavailable") ||
        code.includes("auth/invalid-api-key") ||
        code.includes("auth/api-key-not-valid") ||
        code.includes("auth/configuration-not-found")
      ) {
        // Fallback offline session for demo/network issues
        const offlineUser = { uid: "offline_" + email.replace(/[^a-zA-Z0-9]/g, "_"), email: email.trim(), displayName: email.split("@")[0] } as User;
        setUser(offlineUser);
        localStorage.setItem(
          "agrishield_active_user",
          JSON.stringify({ uid: offlineUser.uid, email: offlineUser.email, role: "farmer" })
        );
        const cachedFarmer = localStorage.getItem("cached_farmer_" + offlineUser.uid);
        if (cachedFarmer) {
          try {
            const parsed = JSON.parse(cachedFarmer);
            setUserRole("farmer");
            setFarmerProfile(parsed);
            setOfficerProfile(null);
            setLoading(false);
            return;
          } catch {}
        }
        // Create default offline farmer profile
        const defaultFarmer: FarmerProfile = {
          id: "FMR-OFFLINE",
          farmerId: "FMR-OFFLINE",
          uid: offlineUser.uid,
          name: email.split("@")[0],
          email: email.trim(),
          phone: "9876543210",
          village: "Vijayawada Rural",
          district: "Krishna",
          state: "Andhra Pradesh",
          preferredLanguage: "en",
          role: "farmer",
          aadharLastFour: "9999",
          createdAt: new Date().toISOString(),
          insuranceInfo: {
            policyNumber: "PMFBY/AP/2026/999888",
            schemeName: "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
            sumInsuredPerAcre: 38500,
            insurerName: "Agriculture Insurance Company of India (AIC)",
            coverageStartDate: "2026-06-01",
            coverageEndDate: "2026-11-30",
            applicationId: "APP-PMFBY-OFFLINE",
          },
        };
        setUserRole("farmer");
        setFarmerProfile(defaultFarmer);
        setOfficerProfile(null);
        localStorage.setItem("cached_farmer_" + offlineUser.uid, JSON.stringify(defaultFarmer));
        setLoading(false);
        return;
      }
      const friendly = getFriendlyAuthErrorMessage(err);
      setError(friendly);
      throw new Error(friendly);
    } finally {
      setLoading(false);
    }
  };

  const loginAsDemoFarmer = async (): Promise<void> => {
    setError(null);
    setLoading(true);
    try {
      const demoUser = {
        uid: "FMR001",
        email: "ramesh.kumar@agrimail.in",
        displayName: "Ramesh Kumar",
      } as User;

      setUser(demoUser);
      setUserRole("farmer");
      setFarmerProfile(initialFarmerProfile);
      setOfficerProfile(null);
      localStorage.setItem("cached_farmer_FMR001", JSON.stringify(initialFarmerProfile));
      localStorage.setItem(
        "agrishield_active_user",
        JSON.stringify({ uid: "FMR001", email: "ramesh.kumar@agrimail.in", role: "farmer" })
      );
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to log in as demo farmer");
    } finally {
      setLoading(false);
    }
  };

  const loginAsOfficer = async (): Promise<void> => {
    setError(null);
    setLoading(true);
    const officerEmail = import.meta.env.VITE_OFFICER_EMAIL || "officer@agrishield.in";
    const officerPass = import.meta.env.VITE_OFFICER_PASSWORD || "AgriShieldOfficer2026!";

    if (!isFirebaseConfigured) {
      const offlineUser = {
        uid: "offline_officer_uid",
        email: officerEmail,
        displayName: "Dr. Ananya Sharma",
      } as User;
      setUser(offlineUser);
      setUserRole("officer");
      const offProfile: OfficerProfile = {
        uid: offlineUser.uid,
        id: "AIC-AP-KR-042",
        name: "Dr. Ananya Sharma",
        email: officerEmail,
        role: "officer",
        officerId: "AIC-AP-KR-042",
        district: "Krishna",
        badgeNumber: "AIC-AP-KR-042",
        assignedDistrict: "Krishna",
        insurerName: "Agriculture Insurance Company of India",
      };
      setOfficerProfile(offProfile);
      setFarmerProfile(null);
      localStorage.setItem("cached_officer_" + offlineUser.uid, JSON.stringify(offProfile));
      localStorage.setItem(
        "agrishield_active_user",
        JSON.stringify({ uid: offlineUser.uid, email: officerEmail, role: "officer" })
      );
      setError(null);
      setLoading(false);
      return;
    }

    try {
      let credential;
      try {
        credential = await signInWithEmailAndPassword(auth, officerEmail, officerPass);
      } catch (authErr: any) {
        const code = authErr.code || "";
        if (code.includes("user-not-found") || code.includes("invalid-credential") || code.includes("wrong-password")) {
          credential = await createUserWithEmailAndPassword(auth, officerEmail, officerPass);
        } else if (code.includes("auth/network-request-failed")) {
          throw authErr;
        } else {
          throw authErr;
        }
      }

      const userDocRef = doc(db, "users", credential.user.uid);
      const officerData = {
        uid: credential.user.uid,
        name: "Dr. Ananya Sharma",
        email: officerEmail,
        officerId: "AIC-AP-KR-042",
        district: "Krishna",
        role: "officer",
      };
      try {
        await setDoc(userDocRef, officerData, { merge: true });
      } catch (e) {
        console.warn("Offline officer doc write warning:", e);
      }

      setUser(credential.user);
      setUserRole("officer");
      const offProfile: OfficerProfile = {
        uid: credential.user.uid,
        id: "AIC-AP-KR-042",
        name: "Dr. Ananya Sharma",
        email: officerEmail,
        role: "officer",
        officerId: "AIC-AP-KR-042",
        district: "Krishna",
        badgeNumber: "AIC-AP-KR-042",
        assignedDistrict: "Krishna",
        insurerName: "Agriculture Insurance Company of India",
      };
      setOfficerProfile(offProfile);
      setFarmerProfile(null);
      localStorage.setItem("cached_officer_" + credential.user.uid, JSON.stringify(offProfile));
      localStorage.setItem(
        "agrishield_active_user",
        JSON.stringify({ uid: credential.user.uid, email: officerEmail, role: "officer" })
      );
      setError(null);
    } catch (err: any) {
      const code = err.code || err.message || "";
      if (
        code.includes("auth/network-request-failed") ||
        code.includes("offline") ||
        code.includes("unavailable") ||
        code.includes("auth/invalid-api-key") ||
        code.includes("auth/api-key-not-valid") ||
        code.includes("auth/configuration-not-found") ||
        !isFirebaseConfigured
      ) {
        // Offline officer fallback
        const offlineUser = { uid: "offline_officer_uid", email: officerEmail, displayName: "Dr. Ananya Sharma" } as User;
        setUser(offlineUser);
        setUserRole("officer");
        const offProfile: OfficerProfile = {
          uid: offlineUser.uid,
          id: "AIC-AP-KR-042",
          name: "Dr. Ananya Sharma",
          email: officerEmail,
          role: "officer",
          officerId: "AIC-AP-KR-042",
          district: "Krishna",
          badgeNumber: "AIC-AP-KR-042",
          assignedDistrict: "Krishna",
          insurerName: "Agriculture Insurance Company of India",
        };
        setOfficerProfile(offProfile);
        setFarmerProfile(null);
        localStorage.setItem("cached_officer_" + offlineUser.uid, JSON.stringify(offProfile));
        localStorage.setItem(
          "agrishield_active_user",
          JSON.stringify({ uid: offlineUser.uid, email: officerEmail, role: "officer" })
        );
        setError(null);
        setLoading(false);
        return;
      }
      const friendly = getFriendlyAuthErrorMessage(err);
      setError(friendly);
      throw new Error(friendly);
    } finally {
      setLoading(false);
    }
  };

  const register = async (input: FarmerRegistrationInput): Promise<void> => {
    setError(null);
    setLoading(true);

    if (!isFirebaseConfigured) {
      const offlineUid = `offline_${Date.now()}`;
      const offlineUser = {
        uid: offlineUid,
        email: input.email.trim(),
        displayName: input.name.trim(),
      } as User;
      const newFarmerId = await generateReadableFarmerId();
      const stateCode = (input.state || "AP").substring(0, 2).toUpperCase();
      const randomPolicyDigits = Math.floor(100000 + Math.random() * 900000);

      const newProfile: FarmerProfile = {
        id: newFarmerId,
        farmerId: newFarmerId,
        uid: offlineUid,
        name: input.name.trim(),
        email: input.email.trim().toLowerCase(),
        phone: input.phone.trim(),
        village: input.village.trim(),
        district: input.district.trim(),
        state: input.state.trim(),
        preferredLanguage: input.preferredLanguage || "en",
        role: "farmer",
        aadharLastFour: input.aadharLastFour?.trim() || "",
        createdAt: new Date().toISOString(),
        insuranceInfo: {
          policyNumber: `PMFBY/${stateCode}/2026/${randomPolicyDigits}`,
          schemeName: "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
          sumInsuredPerAcre: 38500,
          insurerName: "Agriculture Insurance Company of India (AIC)",
          coverageStartDate: "2026-06-01",
          coverageEndDate: "2026-11-30",
          applicationId: `APP-PMFBY-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        },
      };

      setUser(offlineUser);
      setUserRole("farmer");
      setFarmerProfile(newProfile);
      setOfficerProfile(null);
      localStorage.setItem("cached_farmer_" + offlineUid, JSON.stringify(newProfile));
      localStorage.setItem(
        "agrishield_active_user",
        JSON.stringify({ uid: offlineUid, email: offlineUser.email, role: "farmer" })
      );
      setError(null);
      setLoading(false);
      return;
    }

    try {
      const credential = await createUserWithEmailAndPassword(
        auth,
        input.email.trim(),
        input.password
      );

      const newFarmerId = await generateReadableFarmerId();
      const stateCode = (input.state || "AP").substring(0, 2).toUpperCase();
      const randomPolicyDigits = Math.floor(100000 + Math.random() * 900000);

      const newProfile: FarmerProfile = {
        id: newFarmerId,
        farmerId: newFarmerId,
        uid: credential.user.uid,
        name: input.name.trim(),
        email: input.email.trim().toLowerCase(),
        phone: input.phone.trim(),
        village: input.village.trim(),
        district: input.district.trim(),
        state: input.state.trim(),
        preferredLanguage: input.preferredLanguage || "en",
        role: "farmer",
        aadharLastFour: input.aadharLastFour?.trim() || "",
        createdAt: new Date().toISOString(),
        insuranceInfo: {
          policyNumber: `PMFBY/${stateCode}/2026/${randomPolicyDigits}`,
          schemeName: "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
          sumInsuredPerAcre: 38500,
          insurerName: "Agriculture Insurance Company of India (AIC)",
          coverageStartDate: "2026-06-01",
          coverageEndDate: "2026-11-30",
          applicationId: `APP-PMFBY-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        },
      };

      const farmerDocRef = doc(db, "farmers", credential.user.uid);
      await setDoc(farmerDocRef, newProfile);

      setUser(credential.user);
      setUserRole("farmer");
      setFarmerProfile(newProfile);
      setOfficerProfile(null);
      localStorage.setItem("cached_farmer_" + credential.user.uid, JSON.stringify(newProfile));
      localStorage.setItem(
        "agrishield_active_user",
        JSON.stringify({ uid: credential.user.uid, email: input.email.trim(), role: "farmer" })
      );
    } catch (err: any) {
      const code = err.code || err.message || "";
      if (
        code.includes("auth/network-request-failed") ||
        code.includes("offline") ||
        code.includes("unavailable") ||
        code.includes("auth/invalid-api-key") ||
        code.includes("auth/api-key-not-valid") ||
        code.includes("auth/configuration-not-found") ||
        !isFirebaseConfigured
      ) {
        const offlineUid = `offline_${Date.now()}`;
        const offlineUser = {
          uid: offlineUid,
          email: input.email.trim(),
          displayName: input.name.trim(),
        } as User;
        const newFarmerId = await generateReadableFarmerId();
        const stateCode = (input.state || "AP").substring(0, 2).toUpperCase();
        const randomPolicyDigits = Math.floor(100000 + Math.random() * 900000);

        const newProfile: FarmerProfile = {
          id: newFarmerId,
          farmerId: newFarmerId,
          uid: offlineUid,
          name: input.name.trim(),
          email: input.email.trim().toLowerCase(),
          phone: input.phone.trim(),
          village: input.village.trim(),
          district: input.district.trim(),
          state: input.state.trim(),
          preferredLanguage: input.preferredLanguage || "en",
          role: "farmer",
          aadharLastFour: input.aadharLastFour?.trim() || "",
          createdAt: new Date().toISOString(),
          insuranceInfo: {
            policyNumber: `PMFBY/${stateCode}/2026/${randomPolicyDigits}`,
            schemeName: "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
            sumInsuredPerAcre: 38500,
            insurerName: "Agriculture Insurance Company of India (AIC)",
            coverageStartDate: "2026-06-01",
            coverageEndDate: "2026-11-30",
            applicationId: `APP-PMFBY-2026-${Math.floor(1000 + Math.random() * 9000)}`,
          },
        };

        setUser(offlineUser);
        setUserRole("farmer");
        setFarmerProfile(newProfile);
        setOfficerProfile(null);
        localStorage.setItem("cached_farmer_" + offlineUid, JSON.stringify(newProfile));
        localStorage.setItem(
          "agrishield_active_user",
          JSON.stringify({ uid: offlineUid, email: offlineUser.email, role: "farmer" })
        );
        setError(null);
        setLoading(false);
        return;
      }
      const friendly = getFriendlyAuthErrorMessage(err);
      setError(friendly);
      throw new Error(friendly);
    } finally {
      setLoading(false);
    }
  };

  const seedOfficerTestAccount = async (): Promise<void> => {
    await loginAsOfficer();
  };

  const logout = async (): Promise<void> => {
    setLoading(true);
    try {
      localStorage.removeItem("agrishield_active_user");
      await signOut(auth);
    } catch (err) {
      console.error("Sign out error:", err);
    } finally {
      setUser(null);
      setUserRole(null);
      setFarmerProfile(null);
      setOfficerProfile(null);
      setLoading(false);
    }
  };

  const updateFarmerProfile = async (updates: Partial<FarmerProfile>): Promise<void> => {
    if (!user || !farmerProfile) return;

    const updatedProfile: FarmerProfile = {
      ...farmerProfile,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    try {
      const farmerDocRef = doc(db, "farmers", user.uid);
      await updateDoc(farmerDocRef, updates as Record<string, unknown>);
      setFarmerProfile(updatedProfile);
    } catch (err) {
      console.warn("Firestore update error, updating local state:", err);
      setFarmerProfile(updatedProfile);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userRole,
        farmerProfile,
        officerProfile,
        loading,
        error,
        clearError,
        login,
        loginAsDemoFarmer,
        register,
        logout,
        updateFarmerProfile,
        seedOfficerTestAccount,
        loginAsOfficer,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
