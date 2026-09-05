import React, { useState } from "react";
import { Mic, Volume2, VolumeX, HelpCircle, X, Sparkles, ChevronDown, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useVoice } from "../../context/VoiceContext";
import { useApp } from "../../context/AppContext";

/** Multilingual UI strings for the voice widget */
const widgetLabels: Record<string, Record<string, string>> = {
  title: {
    en: "AgriShield Voice Assistant",
    hi: "एग्रीशील्ड वॉइस असिस्टेंट",
    te: "అగ్రిషీల్డ్ వాయిస్ అసిస్టెంట్",
    ta: "அக்ரிஷீல்ட் குரல் உதவியாளர்",
    mr: "ॲग्रीशील्ड व्हॉइस असिस्टंट",
  },
  listeningLabel: {
    en: "Listening...",
    hi: "सुन रहे हैं...",
    te: "వింటున్నది...",
    ta: "கேட்கிறது...",
    mr: "ऐकत आहे...",
  },
  processingLabel: {
    en: "Processing your request...",
    hi: "आपका अनुरोध प्रोसेस हो रहा है...",
    te: "మీ అభ్యర్థన ప్రాసెస్ అవుతోంది...",
    ta: "உங்கள் கோரிக்கை செயலாக்கப்படுகிறது...",
    mr: "तुमची विनंती प्रक्रिया होत आहे...",
  },
  speakPrompt: {
    en: "Speak now...",
    hi: "अब बोलें...",
    te: "ఇప్పుడు మాట్లాడండి...",
    ta: "இப்போது பேசவும்...",
    mr: "आता बोला...",
  },
  responseTitle: {
    en: "Assistant Response:",
    hi: "असिस्टेंट का जवाब:",
    te: "అసిస్టెంట్ సమాధానం:",
    ta: "உதவியாளர் பதில்:",
    mr: "असिस्टंटचे उत्तर:",
  },
  lastHeard: {
    en: "You said:",
    hi: "आपने कहा:",
    te: "మీరు చెప్పింది:",
    ta: "நீங்கள் சொன்னது:",
    mr: "तुम्ही म्हणालात:",
  },
  readPageBtn: {
    en: "Read Page Summary Aloud",
    hi: "पृष्ठ सारांश पढ़ें",
    te: "పేజీ సారాంశం చదవండి",
    ta: "பக்க சுருக்கத்தை படிக்கவும்",
    mr: "पृष्ठ सारांश वाचा",
  },
  startVoice: {
    en: "Speak Voice Command",
    hi: "वॉइस कमांड बोलें",
    te: "వాయిస్ కమాండ్ చెప్పండి",
    ta: "குரல் கட்டளை பேசவும்",
    mr: "व्हॉइस कमांड बोला",
  },
  stopVoice: {
    en: "Stop Listening",
    hi: "सुनना बंद करें",
    te: "వినడం ఆపండి",
    ta: "கேட்பதை நிறுத்தவும்",
    mr: "ऐकणे थांबवा",
  },
  commandHints: {
    en: "Try: 'Fertilizer for rice', 'Register field', 'Report disaster', 'Tutorial'",
    hi: "बोलें: 'धान की खाद', 'खेत पंजीकरण', 'आपदा रिपोर्ट', 'ट्यूटोरियल'",
    te: "బోలండి: 'వరికి ఎరువు', 'పొలం నమోదు', 'విపత్తు నివేదిక', 'ట్యుటోరియల్'",
    ta: "கூறுக: 'நெல்லுக்கு உரம்', 'நிலம் பதிவு', 'பேரிடர் அறிக்கை', 'பயிற்சி'",
    mr: "बोला: 'भाताला खत', 'शेत नोंदणी', 'आपत्ती अहवाल', 'ट्युटोरियल'",
  },
  stopSpeaking: {
    en: "Stop Speaking",
    hi: "बोलना बंद करें",
    te: "మాట్లాడడం ఆపు",
    ta: "பேசுவதை நிறுத்தவும்",
    mr: "बोलणे थांबवा",
  },
  readAloud: {
    en: "Read Aloud",
    hi: "जोर से पढ़ें",
    te: "చదువు",
    ta: "சத்தமாக படிக்க",
    mr: "मोठ्याने वाचा",
  },
  dismiss: {
    en: "Dismiss",
    hi: "बंद करें",
    te: "మూసివేయి",
    ta: "நிராகரி",
    mr: "बंद करा",
  },
  voiceMode: {
    en: "English Voice",
    hi: "हिंदी आवाज",
    te: "తెలుగు స్వరం",
    ta: "தமிழ் குரல்",
    mr: "मराठी आवाज",
  },
};

export const VoiceAssistantWidget: React.FC = () => {
  const { language } = useApp();
  const {
    isListening,
    isSpeaking,
    isProcessing,
    transcript,
    assistantResponse,
    voiceError,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    readPageSummary,
    lastCommand,
    clearAssistantResponse,
  } = useVoice();

  const [expanded, setExpanded] = useState<boolean>(false);

  const L = (key: string) => widgetLabels[key]?.[language] || widgetLabels[key]?.en || key;

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const hasResponse = Boolean(assistantResponse || voiceError);
  const showPanel = isListening || isProcessing || hasResponse || (transcript && !isListening);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">

      {/* Response / Listening Banner */}
      {showPanel && (
        <div className="bg-slate-900 text-white rounded-2xl p-3.5 shadow-2xl border border-slate-700 max-w-sm w-80 animate-in slide-in-from-bottom-2 space-y-2">
          {/* Header row */}
          <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${
                isListening ? "bg-red-500 animate-ping"
                  : isProcessing ? "bg-amber-400 animate-pulse"
                  : isSpeaking ? "bg-blue-400 animate-pulse"
                  : "bg-emerald-400"
              }`} />
              {isListening ? L("listeningLabel") : isProcessing ? L("processingLabel") : L("title")}
            </span>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-slate-400 font-mono">{L("voiceMode")}</span>
              {hasResponse && (
                <button onClick={clearAssistantResponse} className="text-slate-500 hover:text-slate-300 ml-1">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Listening – live transcript */}
          {isListening && (
            <p className="text-xs text-emerald-200 font-medium italic min-h-[20px]">
              {transcript || L("speakPrompt")}
            </p>
          )}

          {/* Processing spinner */}
          {isProcessing && (
            <div className="flex items-center gap-2 text-amber-300 text-xs">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>{L("processingLabel")}</span>
            </div>
          )}

          {/* What user said */}
          {!isListening && !isProcessing && lastCommand && (
            <div className="text-xs text-slate-400">
              <span className="font-semibold text-slate-300">{L("lastHeard")}</span>{" "}
              <span className="text-emerald-300 italic">"{lastCommand}"</span>
            </div>
          )}

          {/* Error message */}
          {voiceError && (
            <div className="flex items-start gap-2 bg-red-950/60 border border-red-700/60 rounded-xl p-2.5 text-xs text-red-200">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{voiceError}</span>
            </div>
          )}

          {/* Assistant text response */}
          {assistantResponse && !isProcessing && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {L("responseTitle")}
              </span>
              <p className="text-xs text-slate-200 leading-relaxed">
                {assistantResponse.textResponse}
              </p>
              {/* Re-speak button */}
              <button
                onClick={() => speak(assistantResponse.speechResponse)}
                className="flex items-center gap-1 text-[10px] text-emerald-400 hover:text-emerald-300 font-semibold mt-1"
              >
                <Volume2 className="w-3 h-3" /> {L("readAloud")}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Expanded Quick Controls Drawer */}
      {expanded && (
        <div className="bg-white rounded-2xl p-4 shadow-2xl border border-emerald-200 max-w-xs sm:max-w-sm w-80 space-y-3 animate-in slide-in-from-bottom-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                🎙️
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">{L("title")}</h4>
                <p className="text-[10px] text-slate-500">{L("voiceMode")}</p>
              </div>
            </div>
            <button onClick={() => setExpanded(false)} className="text-slate-400 hover:text-slate-600 p-1">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {/* Read Page Button */}
            <button
              onClick={() => { readPageSummary(); setExpanded(false); }}
              className="flex items-center justify-between px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-bold transition border border-emerald-200 cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-emerald-600" />
                {L("readPageBtn")}
              </span>
              <span className="text-[10px] bg-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded font-mono">🔊</span>
            </button>

            {/* Listen / Voice Command Button */}
            <button
              onClick={() => { handleMicClick(); setExpanded(false); }}
              className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition border cursor-pointer ${
                isListening
                  ? "bg-rose-50 border-rose-300 text-rose-800"
                  : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800"
              }`}
            >
              <span className="flex items-center gap-2">
                <Mic className={`w-4 h-4 ${isListening ? "text-rose-600 animate-pulse" : "text-slate-600"}`} />
                {isListening ? L("stopVoice") : L("startVoice")}
              </span>
              <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono">🎙️</span>
            </button>
          </div>

          {/* Command hints – multilingual */}
          <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200 text-[11px] text-slate-500">
            <span className="font-bold text-slate-700 block mb-1">
              <Sparkles className="w-3 h-3 inline mr-1 text-emerald-500" />
              {L("commandHints")}
            </span>
          </div>
        </div>
      )}

      {/* Main Floating Voice Controls Hub */}
      <div className="flex items-center gap-2 bg-white/90 backdrop-blur-md p-1.5 rounded-full border border-emerald-300 shadow-xl">
        {/* Toggle Drawer button */}
        <button
          onClick={() => setExpanded((prev) => !prev)}
          title={L("title")}
          className="p-2 rounded-full text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 transition cursor-pointer"
        >
          {expanded ? <ChevronDown className="w-5 h-5" /> : <HelpCircle className="w-5 h-5" />}
        </button>

        {/* Read Aloud / Stop Speaking Quick Button */}
        <button
          onClick={() => { isSpeaking ? stopSpeaking() : readPageSummary(); }}
          title={isSpeaking ? L("stopSpeaking") : L("readAloud")}
          className={`p-2 rounded-full transition cursor-pointer ${
            isSpeaking
              ? "bg-emerald-600 text-white animate-pulse"
              : "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
          }`}
        >
          {isSpeaking ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>

        {/* Main Microphone Button */}
        <button
          onClick={handleMicClick}
          title={isListening ? L("stopVoice") : L("startVoice")}
          className={`p-3 rounded-full font-bold text-white shadow-lg transition cursor-pointer transform hover:scale-105 flex items-center justify-center ${
            isListening
              ? "bg-gradient-to-r from-red-500 to-rose-600 ring-4 ring-red-200 animate-pulse"
              : isProcessing
              ? "bg-gradient-to-r from-amber-500 to-orange-600 ring-4 ring-amber-200"
              : "bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800"
          }`}
        >
          {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mic className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
};
