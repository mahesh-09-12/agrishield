import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { AppProvider, useApp } from "./context/AppContext";
import { VoiceProvider, useVoice } from "./context/VoiceContext";
import { translations } from "./lib/i18n";
import { Header } from "./components/layout/Header";
import { FarmerDashboard } from "./components/farmer/FarmerDashboard";
import { OfficerDashboard } from "./components/officer/OfficerDashboard";
import { WalkthroughModal } from "./components/layout/WalkthroughModal";
import { TutorialVideoModal } from "./components/layout/TutorialVideoModal";
import { VoiceAssistantWidget } from "./components/layout/VoiceAssistantWidget";
import { LoginPage } from "./components/auth/LoginPage";
import { RegisterPage } from "./components/auth/RegisterPage";
import { Loader2 } from "lucide-react";

const MainContent: React.FC = () => {
  const { role, isOnline, t } = useApp();
  const { registerActionDispatcher } = useVoice();
  const [isWalkthroughOpen, setIsWalkthroughOpen] = useState<boolean>(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState<boolean>(false);
  // Voice-triggered modal signals: FarmerDashboard reads these via callbacks
  const [voiceAction, setVoiceAction] = useState<string | null>(null);

  // Register the voice action dispatcher so VoiceContext can trigger UI actions
  useEffect(() => {
    const unregister = registerActionDispatcher((action: string) => {
      switch (action) {
        case "OPEN_TUTORIAL":
          setIsTutorialOpen(true);
          break;
        case "READ_PAGE":
          // handled inside VoiceContext readPageSummary
          break;
        default:
          // Forward farmer-modal actions (OPEN_DISASTER_MODAL, OPEN_FIELD_MODAL, OPEN_CROP_MODAL, NAVIGATE_DOSSIER)
          setVoiceAction(action);
          // Clear after a tick so re-triggering the same action works
          setTimeout(() => setVoiceAction(null), 300);
          break;
      }
    });
    return unregister;
  }, [registerActionDispatcher]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-emerald-200 relative">
      {/* High Density Header */}
      <Header
        onOpenWalkthrough={() => setIsWalkthroughOpen(true)}
        onOpenTutorial={() => setIsTutorialOpen(true)}
      />

      {/* Main High Density Workspace */}
      <main className="flex-1 mx-auto max-w-7xl w-full px-3 sm:px-4 lg:px-6 py-4">
        {role === "FARMER" ? (
          <FarmerDashboard voiceAction={voiceAction} />
        ) : (
          <OfficerDashboard />
        )}
      </main>

      {/* Floating Voice Assistant Widget */}
      <VoiceAssistantWidget />

      {/* High Density Compact System Status Footer */}
      <footer className="h-8 bg-slate-100 border-t border-slate-200 flex items-center justify-between px-4 sm:px-6 shrink-0 text-[10px] text-slate-400 mt-auto">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="flex items-center space-x-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? "bg-emerald-500" : "bg-amber-500"}`} />
            <span>{isOnline ? (t.syncStatusOnline || "Cloud Sync: Live") : (t.syncStatusOffline || "Offline Sync")}</span>
          </div>
          <span className="hidden sm:inline">&bull;</span>
          <span className="hidden sm:inline">{t["systemUptime"] || "System Uptime"}: 99.9%</span>
          <span className="hidden md:inline">&bull;</span>
          <span className="hidden md:inline">{t["seasonLabel"] || "PMFBY Kharif 2026"}</span>
        </div>
        <div className="text-[10px] text-slate-500 font-medium tracking-tight">
          {t["appVersion"] || "AGRI-SHIELD-V2.4"} &bull; {t["smartCropInsuranceSystem"] || "SMART CROP INSURANCE EVIDENCE SYSTEM"}
        </div>
      </footer>

      {/* Interactive Walkthrough Modal */}
      <WalkthroughModal
        isOpen={isWalkthroughOpen}
        onClose={() => setIsWalkthroughOpen(false)}
      />

      {/* Step-by-Step Guiding Tutorial Video Modal */}
      <TutorialVideoModal
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
      />
    </div>
  );
};

const AuthGate: React.FC = () => {
  const { user, userRole, farmerProfile, officerProfile, loading } = useAuth();
  const lang = typeof window !== "undefined" ? (window.localStorage.getItem("agrishield-language") || "en") : "en";
  const t = translations[lang] || translations.en;
  const [authView, setAuthView] = useState<"login" | "register">("login");

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center gap-3 text-center max-w-sm w-full">
          <div className="w-12 h-12 bg-emerald-700 rounded-xl flex items-center justify-center text-white shadow-md">
            <div className="w-6 h-6 border-2 border-white rotate-45" />
          </div>
          <div className="flex items-center gap-2 text-emerald-800 text-sm font-bold mt-1">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{t["signingIn"] || "Signing you in..."}</span>
          </div>
          <p className="text-xs text-slate-500">
            {t["checkingAccount"] || "Checking your account..."}
          </p>
        </div>
      </div>
    );
  }

  if (!user || (!farmerProfile && !officerProfile && userRole !== "officer" && userRole !== "farmer")) {
    if (authView === "register") {
      return <RegisterPage onSwitchToLogin={() => setAuthView("login")} />;
    }
    return <LoginPage onSwitchToRegister={() => setAuthView("register")} />;
  }

  return <MainContent />;
};

export function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <VoiceProvider>
          <AuthGate />
        </VoiceProvider>
      </AppProvider>
    </AuthProvider>
  );
}

export default App;
