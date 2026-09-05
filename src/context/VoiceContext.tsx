import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useApp } from "./AppContext";
import { processVoiceIntent, VoiceIntentResult } from "../lib/voiceIntentProcessor";
import { LanguageCode } from "../types";

interface VoiceContextType {
  isSpeaking: boolean;
  isListening: boolean;
  isProcessing: boolean;
  transcript: string;
  assistantResponse: VoiceIntentResult | null;
  voiceError: string | null;
  isVoiceEnabled: boolean;
  setIsVoiceEnabled: (enabled: boolean) => void;
  speak: (text: string, customLang?: string) => void;
  stopSpeaking: () => void;
  startListening: () => void;
  stopListening: () => void;
  speakGuide: (section: string) => void;
  readPageSummary: () => void;
  lastCommand: string | null;
  registerCommandHandler: (handler: (cmd: string) => void) => () => void;
  registerActionDispatcher: (dispatcher: (action: string) => void) => () => void;
  clearAssistantResponse: () => void;
}

const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

// Map app language code to BCP 47 tag for Web Speech API
export const langToBcp47: Record<string, string> = {
  en: "en-IN",
  hi: "hi-IN",
  te: "te-IN",
  ta: "ta-IN",
  mr: "mr-IN",
};

/** Polite error messages by language when mic/speech fails */
const micErrorMessages: Record<string, Record<string, string>> = {
  permissionDenied: {
    te: "మైక్రోఫోన్ అనుమతి నిరాకరించబడింది. దయచేసి బ్రౌజర్ సెట్టింగ్స్‌లో మైక్రోఫోన్‌ను అనుమతించండి.",
    hi: "माइक्रोफ़ोन अनुमति अस्वीकृत कर दी गई। कृपया ब्राउज़र सेटिंग में माइक्रोफ़ोन सक्षम करें।",
    en: "Microphone permission denied. Please allow microphone access in browser settings.",
    ta: "மைக்ரோஃபோன் அனுமதி மறுக்கப்பட்டது. உலாவி அமைப்புகளில் மைக்ரோஃபோனை அனுமதிக்கவும்.",
    mr: "मायक्रोफोन परवानगी नाकारली. ब्राउझर सेटिंग्जमध्ये मायक्रोफोन सक्षम करा.",
  },
  noSpeech: {
    te: "మాట్లాడిన శబ్దం వినబడలేదు. దయచేసి మళ్ళీ మాట్లాడండి.",
    hi: "कोई आवाज़ नहीं आई। कृपया फिर से बोलें।",
    en: "No speech detected. Please try speaking again.",
    ta: "பேச்சு கேட்கவில்லை. மீண்டும் பேசவும்.",
    mr: "बोलणे ऐकू आले नाही. कृपया पुन्हा बोला.",
  },
  networkError: {
    te: "నెట్‌వర్క్ లోపం. ఇంటర్నెట్ కనెక్షన్ తనిఖీ చేయండి.",
    hi: "नेटवर्क त्रुटि। इंटरनेट कनेक्शन जांचें।",
    en: "Network error. Please check your internet connection.",
    ta: "நெட்வொர்க் பிழை. இணைய இணைப்பை சரிபார்க்கவும்.",
    mr: "नेटवर्क त्रुटी. इंटरनेट कनेक्शन तपासा.",
  },
  unsupported: {
    te: "మీ బ్రౌజర్ వాయిస్ ఇన్‌పుట్‌కు మద్దతు ఇవ్వదు. గూగుల్ క్రోమ్ ఉపయోగించండి.",
    hi: "आपका ब्राउज़र वॉइस इनपुट सपोर्ट नहीं करता। Google Chrome उपयोग करें।",
    en: "Your browser does not support voice input. Please use Google Chrome.",
    ta: "உங்கள் உலாவி குரல் உள்ளீட்டை ஆதரிக்கவில்லை. Google Chrome பயன்படுத்தவும்.",
    mr: "तुमचा ब्राउझर व्हॉइस इनपुट सपोर्ट करत नाही. Google Chrome वापरा.",
  },
};

export const VoiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { language, role } = useApp();
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>("");
  const [assistantResponse, setAssistantResponse] = useState<VoiceIntentResult | null>(null);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [lastCommand, setLastCommand] = useState<string | null>(null);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState<boolean>(true);
  const recognitionRef = useRef<any>(null);

  // Use refs for mutable handler sets so they don't trigger re-renders
  const commandHandlersRef = useRef<Set<(cmd: string) => void>>(new Set());
  const actionDispatchersRef = useRef<Set<(action: string) => void>>(new Set());

  // Speech Synthesis Helper
  const stopSpeaking = useCallback(() => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  const speak = useCallback(
    (text: string, customLang?: string) => {
      if (!isVoiceEnabled || !("speechSynthesis" in window)) {
        console.warn("Speech synthesis not supported or voice disabled");
        return;
      }

      window.speechSynthesis.cancel(); // Stop any active speech

      const targetLang = customLang || langToBcp47[language] || "en-IN";
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = targetLang;
      utterance.rate = 0.9;
      utterance.pitch = 1.0;

      // Try finding best matching voice if available
      const voices = window.speechSynthesis.getVoices();
      const matchingVoice = voices.find(
        (v) => v.lang === targetLang || v.lang.replace("_", "-") === targetLang || v.lang.startsWith(targetLang.split("-")[0])
      );
      if (matchingVoice) {
        utterance.voice = matchingVoice;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = (e) => {
        console.error("Speech synthesis error:", e);
        setIsSpeaking(false);
      };

      window.speechSynthesis.speak(utterance);
    },
    [language, isVoiceEnabled]
  );

  // Register command handlers from modals/components
  const registerCommandHandler = useCallback((handler: (cmd: string) => void) => {
    commandHandlersRef.current.add(handler);
    return () => {
      commandHandlersRef.current.delete(handler);
    };
  }, []);

  // Register action dispatchers (e.g. open modal functions from App)
  const registerActionDispatcher = useCallback((dispatcher: (action: string) => void) => {
    actionDispatchersRef.current.add(dispatcher);
    return () => {
      actionDispatchersRef.current.delete(dispatcher);
    };
  }, []);

  const clearAssistantResponse = useCallback(() => {
    setAssistantResponse(null);
    setTranscript("");
    setVoiceError(null);
  }, []);

  /** Internal: handle a finalized transcript */
  const handleFinalTranscript = useCallback(
    (rawTranscript: string, currentLang: LanguageCode) => {
      const cleanCmd = rawTranscript.trim();
      if (!cleanCmd) return;

      setLastCommand(cleanCmd);
      setIsProcessing(true);
      setVoiceError(null);

      // Broadcast transcript to any registered command handlers (e.g. form fields)
      commandHandlersRef.current.forEach((h) => h(cleanCmd.toLowerCase()));

      // Process through intent engine
      const result = processVoiceIntent(cleanCmd, currentLang);
      setAssistantResponse(result);
      setIsProcessing(false);

      // Speak the response
      speak(result.speechResponse);

      // Dispatch action to registered handlers (e.g. App.tsx to open modals)
      if (result.action) {
        actionDispatchersRef.current.forEach((d) => d(result.action!));
      }
    },
    [speak]
  );

  // Speech Recognition Setup – recreated when language changes
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("Speech Recognition not supported in this browser.");
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = langToBcp47[language] || "en-IN";

    rec.onresult = (event: any) => {
      let currentText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        currentText += event.results[i][0].transcript;
      }
      setTranscript(currentText);

      const isFinal = event.results[event.results.length - 1].isFinal;
      if (isFinal) {
        setIsListening(false);
        // Use language from ref to avoid stale closures
        handleFinalTranscript(currentText, language as LanguageCode);
      }
    };

    rec.onerror = (event: any) => {
      console.warn("Speech recognition error:", event.error);
      setIsListening(false);
      setIsProcessing(false);

      const errType =
        event.error === "not-allowed" || event.error === "permission-denied"
          ? "permissionDenied"
          : event.error === "no-speech"
          ? "noSpeech"
          : event.error === "network"
          ? "networkError"
          : null;

      if (errType) {
        const msg = micErrorMessages[errType][language] || micErrorMessages[errType].en;
        setVoiceError(msg);
        speak(msg);
      }
    };

    rec.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = rec;
  }, [language, handleFinalTranscript, speak]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      const msg = micErrorMessages.unsupported[language] || micErrorMessages.unsupported.en;
      setVoiceError(msg);
      return;
    }
    try {
      stopSpeaking(); // Stop TTS while listening
      setTranscript("");
      setAssistantResponse(null);
      setVoiceError(null);
      recognitionRef.current.lang = langToBcp47[language] || "en-IN";
      recognitionRef.current.start();
      setIsListening(true);
    } catch (err) {
      console.warn("Speech recognition already active or error:", err);
      setIsListening(false);
    }
  }, [language, stopSpeaking]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  }, []);

  const readPageSummary = useCallback(() => {
    if (role === "FARMER" || role === "farmer") {
      const textMap: Record<string, string> = {
        en: "Welcome to AgriShield Farmer Portal. You can register your agricultural fields, log weekly crop growth photos, report natural disaster damage, and track your insurance claim dossier. Say 'Register Field', 'Report Disaster', 'Fertilizer advice', or 'Tutorial' to get started.",
        hi: "एग्रीशील्ड किसान पोर्टल में आपका स्वागत है। आप अपने खेत का नक्शा पंजीकृत कर सकते हैं, फसल की साप्ताहिक फोटो अपलोड कर सकते हैं, आपदा रिपोर्ट दर्ज कर सकते हैं और फसल बीमा दावा ट्रैक कर सकते हैं।",
        te: "అగ్రిషీల్డ్ రైతు పోర్టల్‌కు స్వాగతం. మీ వ్యవసాయ పొలాలను నమోదు చేయవచ్చు, ప్రతి వారం పంట ఫోటోలను అప్‌లోడ్ చేయవచ్చు, పంట నష్టాన్ని నమోదు చేయవచ్చు మరియు బీమా క్లెయిమ్ స్థితిని తెలుసుకోవచ్చు. 'పొలం నమోదు', 'విపత్తు నివేదిక', 'ఎరువుల సలహా' లేదా 'ట్యుటోరియల్' అని చెప్పండి.",
        ta: "அக்ரிஷீல்ட் விவசாயி தளத்திற்கு நல்வரவு. உங்கள் நிலத்தை பதிவு செய்யவும், வாராந்திர புகைப்படங்களை பதிவேற்றவும், பயிர் சேதத்தை பதிவு செய்யவும், காப்பீட்டு கோரிக்கையை கண்காணிக்கவும் இயலும்.",
        mr: "ॲग्रीशील्ड शेतकरी पोर्टलवर आपले स्वागत आहे. आपण आपले शेत नोंदवू शकता, दर आठवड्याला पिकांचे फोटो टाकू शकता, नैसर्गिक आपत्तीची नोंद करू शकता आणि पीक विमा दावा ट्रॅक करू शकता.",
      };
      speak(textMap[language] || textMap.en);
    } else {
      const textMap: Record<string, string> = {
        en: "Welcome to AgriShield Insurance Officer Portal. Review submitted crop loss dossiers, verify Open-Meteo rainfall telemetry, inspect multi-point AI damage assessments, and approve claims.",
        hi: "बीमा अधिकारी पोर्टल में आपका स्वागत है। जमा किए गए फसल क्षति डोजियर की समीक्षा करें, मौसम डेटा की जांच करें, एआई क्षति मूल्यांकन देखें और बीमा दावा स्वीकृत करें।",
        te: "బీమా అధికారి పోర్టల్‌కు స్వాగతం. దాఖలైన పంట నష్ట నివేదికలను పరిశీలించండి, వాతావరణ సమాచారాన్ని తనిఖీ చేయండి, AI నష్ట అంచనాలను చూసి బీమా క్లెయిమ్‌లను ఆమోదించండి.",
        ta: "காப்பீட்டு அதிகாரி தளத்திற்கு நல்வரவு. சமர்ப்பிக்கப்பட்ட பயிர் இழப்பு கோரிக்கைகளை ஆய்வு செய்து அங்கீகரிக்கவும்.",
        mr: "विमा अधिकारी पोर्टलवर आपले स्वागत आहे. शेतकर्‍यांनी सादर केलेल्या पीक नुकसान अर्जांची तपासणी करा आणि दावे मंजूर करा.",
      };
      speak(textMap[language] || textMap.en);
    }
  }, [role, language, speak]);

  const speakGuide = useCallback(
    (sectionKey: string) => {
      const guides: Record<string, Record<string, string>> = {
        disasterModal: {
          en: "Disaster Report Form: Select your impacted field, pick the disaster type such as flood or drought, select event date and time, and describe the damage.",
          hi: "आपदा रिपोर्ट फॉर्म: अपना प्रभावित खेत चुनें, बाढ़ या सूखा जैसे आपदा का प्रकार चुनें, घटना की तारीख और समय दर्ज करें और क्षति का वर्णन करें।",
          te: "విపత్తు నివేదిక ఫారమ్: దెబ్బతిన్న పొలాన్ని ఎంచుకోండి, వరద లేదా కరువు వంటి విపత్తు రకాన్ని ఎంచుకోండి, తేదీ సమయం నమోదు చేసి నష్ట వివరాలు రాయండి.",
          ta: "பேரிடர் பதிவு படிவம்: பாதிக்கப்பட்ட நிலத்தை தேர்ந்தெடுத்து, வெள்ளப்பெருக்கு அல்லது வறட்சி போன்ற பேரிடர் வகையை பதிவு செய்யவும்.",
          mr: "आपत्ती अहवाल फॉर्म: प्रभावित शेत निवडा, पूर किंवा दुष्काळ यासारखा आपत्तीचा प्रकार निवडा, तारीख आणि वेळ टाका.",
        },
        fieldModal: {
          en: "Field Registration Form: Draw your plot boundary on the interactive map by clicking corners, enter survey number, soil type, and save your plot.",
          hi: "खेत पंजीकरण फॉर्म: मानचित्र पर कोने दबाकर अपने खेत की सीमा बनाएं, सर्वे नंबर और मिट्टी का प्रकार चुनें और सहेजें।",
          te: "పొలం నమోదు ఫారమ్: మ్యాప్‌పై మూలలను నొక్కి సరిహద్దులు గీయండి, సర్వే నంబర్ మరియు నేల రకాన్ని నమోదు చేసి సేవ్ చేయండి.",
          ta: "நிலப் பதிவு படிவம்: வரைபடத்தில் எல்லைகளை குறித்து, சர்வே எண் மற்றும் மண் வகையை பதிவு செய்யவும்.",
          mr: "शेत नोंदणी फॉर्म: नकाशावर कोपरे निवडून शेताची हद्द आखा, सर्व्हे नंबर आणि मातीचा प्रकार निवडा.",
        },
        cropModal: {
          en: "Crop Registration Form: Choose crop type like Rice or Cotton, seed variety, sowing date, soil classification, and irrigation source.",
          hi: "फसल पंजीकरण फॉर्म: धान या कपास जैसी फसल का चयन करें, बीज किस्म, बुवाई तिथि, मिट्टी और सिंचाई का प्रकार चुनें।",
          te: "పంట నమోదు ఫారమ్: వరి లేదా పత్తి వంటి పంట రకాన్ని, విత్తన రకం, విత్తిన తేదీ, నేల మరియు నీటి పారుదల రకాన్ని ఎంచుకోండి.",
          ta: "பயிர் பதிவு படிவம்: பயிர் வகை, விதை ரகம், விதைத்த தேதி மற்றும் பாசன வசதியை தேர்ந்தெடுக்கவும்.",
          mr: "पीक नोंदणी फॉर्म: भात किंवा कापूस यासारखे पीक, वाण, पेरणीची तारीख आणि सिंचन प्रकार निवडा.",
        },
        guidedCapture: {
          en: "4-Step Guided Post-Disaster Photo Capture: Step 1 Wide View of the plot. Step 2 Side Section. Step 3 Epicenter of damage. Step 4 Macro close-up photo of foliage.",
          hi: "4-चरण निर्देशित फोटो कैप्चर: चरण 1 पूरे खेत का चौड़ा फोटो। चरण 2 दूसरा हिस्सा। चरण 3 मुख्य क्षतिग्रस्त भाग। चरण 4 पत्तियों और तनों का क्लोज़-अप फोटो।",
          te: "4-దశల నష్ట ఫోటోల సేకరణ: దశ 1 మొత్తం పొలం ఫోటో. దశ 2 రెండవ విభాగం. దశ 3 తీవ్ర నష్ట స్థలం. దశ 4 ఆకులు మరియు కాండాల దగ్గరి ఫోటో.",
          ta: "4-படி புகைப்பட சேகரிப்பு: படி 1 நிலத்தின் முழு படம். படி 2 பக்கவாட்டு பகுதி. படி 3 கடுமையான சேத பகுதி. படி 4 இலைகளின் நெருங்கிய படம்.",
          mr: "4-टप்प्यांची फोटो काढणी: टप्पा 1 संपूर्ण शेताचा फोटो. टप्पा 2 दुसरा भाग. टप्पा 3 मुख्य नुकसानग्रस्त भाग. टप्पा 4 पानांचा जवळचा फोटो.",
        },
      };

      const langMap = guides[sectionKey];
      if (langMap) {
        speak(langMap[language] || langMap.en);
      } else {
        speak("Voice instructions for this section.");
      }
    },
    [language, speak]
  );

  return (
    <VoiceContext.Provider
      value={{
        isSpeaking,
        isListening,
        isProcessing,
        transcript,
        assistantResponse,
        voiceError,
        isVoiceEnabled,
        setIsVoiceEnabled,
        speak,
        stopSpeaking,
        startListening,
        stopListening,
        speakGuide,
        readPageSummary,
        lastCommand,
        registerCommandHandler,
        registerActionDispatcher,
        clearAssistantResponse,
      }}
    >
      {children}
    </VoiceContext.Provider>
  );
};

export const useVoice = () => {
  const context = useContext(VoiceContext);
  if (!context) {
    throw new Error("useVoice must be used within a VoiceProvider");
  }
  return context;
};
