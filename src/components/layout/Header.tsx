import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import { useVoice } from "../../context/VoiceContext";
import { LanguageCode } from "../../types";
import { FarmerProfileModal } from "../farmer/FarmerProfileModal";
import {
  Globe,
  Sparkles,
  Wifi,
  WifiOff,
  LogOut,
  Building2,
  User,
  Menu,
  X,
  Tv,
  Mic,
  Volume2,
} from "lucide-react";

export const Header: React.FC<{
  onOpenWalkthrough: () => void;
  onOpenTutorial?: () => void;
}> = ({ onOpenWalkthrough, onOpenTutorial }) => {
  const {
    role,
    language,
    setLanguage,
    isOnline,
    toggleSimulatedOffline,
    t,
  } = useApp();

  const { farmerProfile, officerProfile, logout } = useAuth();
  const { isListening, startListening, stopListening, readPageSummary } = useVoice();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const isOfficer = role === "OFFICER" || role === "officer";

  return (
    <header className="sticky top-0 z-40 h-14 bg-white border-b border-slate-200 flex items-center justify-between px-3 sm:px-6 shrink-0 shadow-xs">
      <div className="mx-auto max-w-7xl w-full flex items-center justify-between gap-3">
        {/* Brand & Portal Label */}
        <div className="flex items-center space-x-3">
          <div className={`w-8 h-8 rounded flex items-center justify-center text-white shrink-0 shadow-xs ${isOfficer ? "bg-blue-600" : "bg-emerald-600"}`}>
            <div className="w-3.5 h-3.5 border-2 border-white rotate-45" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 flex items-center gap-1.5">
              <span>AgriShield</span>
              <span className="font-normal text-slate-400 text-xs sm:text-sm">
                | {isOfficer ? t.roleOfficer : t.roleFarmer}
              </span>
            </h1>
          </div>
        </div>

        {/* Right Controls Hub */}
        <div className="hidden sm:flex items-center space-x-2 sm:space-x-3">
          {/* Authenticated Profile Chip */}
          {!isOfficer && farmerProfile && (
            <button
              type="button"
              onClick={() => setIsProfileModalOpen(true)}
              title={t.viewProfile || "View & Edit Farmer Profile"}
              className="flex items-center bg-emerald-50 hover:bg-emerald-100/80 rounded-lg px-2.5 py-1 space-x-1.5 border border-emerald-200 transition cursor-pointer"
            >
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              <span className="text-[11px] font-bold text-emerald-900 max-w-[110px] sm:max-w-[150px] truncate">
                {farmerProfile.name}
              </span>
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100/80 px-1 py-0.2 rounded hidden sm:inline">
                {farmerProfile.farmerId || farmerProfile.id}
              </span>
            </button>
          )}

          {isOfficer && officerProfile && (
            <div className="flex items-center bg-blue-50 rounded-lg px-2.5 py-1 space-x-1.5 border border-blue-200">
              <Building2 className="w-3 h-3 text-blue-600" />
              <span className="text-[11px] font-bold text-blue-900">
                {officerProfile.name}
              </span>
              <span className="text-[10px] font-mono text-blue-700 bg-blue-100 px-1 py-0.2 rounded">
                {officerProfile.officerId}
              </span>
            </div>
          )}

          {/* Prominent Tutorial Video Button ("How to Use AgriShield") */}
          <button
            type="button"
            onClick={onOpenTutorial}
            title="How to Use AgriShield - Step-by-Step Tutorial Video"
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-700 text-white hover:bg-emerald-800 px-3 py-1 text-xs font-bold transition cursor-pointer shadow-xs animate-pulse hover:animate-none"
          >
            <Tv className="h-3.5 w-3.5 text-emerald-200" />
            <span>How to Use AgriShield</span>
          </button>

          {/* Voice Assistance Button */}
          <button
            type="button"
            onClick={() => {
              if (isListening) stopListening();
              else startListening();
            }}
            title="Voice Assistance / Listen & Speak"
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition cursor-pointer shadow-2xs ${
              isListening
                ? "border-rose-400 bg-rose-50 text-rose-700 animate-pulse"
                : "border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800"
            }`}
          >
            <Mic className={`h-3.5 w-3.5 ${isListening ? "text-rose-600" : "text-emerald-700"}`} />
            <span className="hidden md:inline">{isListening ? "Listening..." : "Voice Guide"}</span>
          </button>

          {/* Interactive Guide Pill (Farmer only) */}
          {!isOfficer && (
            <button
              type="button"
              onClick={onOpenWalkthrough}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 transition cursor-pointer shadow-2xs"
            >
              <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
              <span className="hidden sm:inline">{t.guide || "Guide"}</span>
            </button>
          )}

          {/* Language Selector */}
          <div className="relative flex items-center">
            <Globe className="h-3.5 w-3.5 text-slate-400 absolute left-2 pointer-events-none" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as LanguageCode)}
              className="rounded-lg border border-slate-200 bg-slate-50 pl-6 pr-2 py-1 text-xs font-semibold text-slate-700 focus:outline-none focus:border-emerald-600 cursor-pointer"
            >
              <option value="en">EN</option>
              <option value="hi">हिंदी (HI)</option>
              <option value="te">తెలుగు (TE)</option>
              <option value="ta">தமிழ் (TA)</option>
              <option value="mr">मराठी (MR)</option>
            </select>
          </div>

          {/* Offline Simulation Toggle */}
          <button
            type="button"
            onClick={toggleSimulatedOffline}
            title={isOnline ? t.simulateOffline || "Simulate Offline Mode" : t.switchToOnline || "Switch to Online Mode"}
            className={`p-1.5 rounded-lg border transition cursor-pointer ${
              isOnline
                ? "border-slate-200 text-slate-600 hover:bg-slate-100"
                : "border-amber-400 bg-amber-50 text-amber-700"
            }`}
          >
            {isOnline ? <Wifi className="h-3.5 w-3.5 text-emerald-600" /> : <WifiOff className="h-3.5 w-3.5 text-amber-600" />}
          </button>

          {/* Logout Button */}
          <button
            type="button"
            onClick={() => logout()}
            title={t.logout || "Sign Out of AgriShield"}
            className="inline-flex items-center gap-1 p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-rose-700 hover:bg-rose-50 hover:border-rose-200 transition cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden md:inline text-xs font-semibold">{t.logout}</span>
          </button>
        </div>

        {/* Mobile menu toggle */}
        <div className="sm:hidden flex items-center">
          <button
            type="button"
            onClick={() => setMobileMenuOpen((s) => !s)}
            className="p-2 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition"
            aria-expanded={mobileMenuOpen}
            aria-label="Open menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Farmer Profile Modal */}
      <FarmerProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />

      {/* Mobile menu panel - stacks controls for small screens */}
      {mobileMenuOpen && (
        <div className="sm:hidden absolute top-14 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-md">
          <div className="mx-auto max-w-7xl w-full px-3 sm:px-6">
            <div className="flex flex-col gap-2 py-3">
              {/* Tutorial Video button mobile */}
              <button onClick={() => { if (onOpenTutorial) onOpenTutorial(); setMobileMenuOpen(false); }} className="flex items-center gap-2 px-2 py-2 rounded-lg bg-emerald-700 text-white font-bold text-sm">
                <Tv className="h-4 w-4" />
                <span>How to Use AgriShield Tutorial</span>
              </button>

              {/* Voice Guide mobile */}
              <button onClick={() => { readPageSummary(); setMobileMenuOpen(false); }} className="flex items-center gap-2 px-2 py-2 rounded-lg bg-emerald-50 text-emerald-800 font-semibold text-sm">
                <Volume2 className="h-4 w-4 text-emerald-600" />
                <span>Voice Guidance (Read Screen)</span>
              </button>

              {/* Profile / identity */}
              {!isOfficer && farmerProfile && (
                <button onClick={() => { setIsProfileModalOpen(true); setMobileMenuOpen(false); }} className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-slate-50">
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full mt-0.5" />
                  <div className="text-sm font-bold truncate">{farmerProfile.name}</div>
                </button>
              )}

              {/* Guide */}
              {!isOfficer && (
                <button onClick={() => { onOpenWalkthrough(); setMobileMenuOpen(false); }} className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-slate-50">
                  <Sparkles className="h-4 w-4 text-emerald-600" />
                  <div className="text-sm font-semibold">{t.guide || "Guide"}</div>
                </button>
              )}

              {/* Language + toggles */}
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-slate-400 mt-0.5" />
                <select value={language} onChange={(e) => { setLanguage(e.target.value as LanguageCode); setMobileMenuOpen(false); }} className="rounded border border-slate-200 bg-slate-50 pl-2 pr-2 py-1 text-sm">
                  <option value="en">EN</option>
                  <option value="hi">हिंदी (HI)</option>
                  <option value="te">తెలుగు (TE)</option>
                  <option value="ta">தமிழ் (TA)</option>
                  <option value="mr">మరాठी (MR)</option>
                </select>
              </div>

              <div className="flex items-center gap-3">
                <button onClick={() => { toggleSimulatedOffline(); setMobileMenuOpen(false); }} className="inline-flex items-center gap-2 px-3 py-2 rounded bg-slate-50 border border-slate-200 text-sm">
                  {isOnline ? <Wifi className="h-4 w-4 text-emerald-600" /> : <WifiOff className="h-4 w-4 text-amber-600" />}
                  <span className="sr-only">Toggle offline</span>
                </button>

                <button onClick={() => { logout(); setMobileMenuOpen(false); }} className="inline-flex items-center gap-2 px-3 py-2 rounded bg-white border border-slate-200 text-sm">
                  <LogOut className="h-4 w-4" />
                  <span className="ml-1">{t.logout}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

