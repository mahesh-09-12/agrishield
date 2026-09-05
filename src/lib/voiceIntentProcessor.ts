import { LanguageCode } from "../types";

export interface VoiceIntentResult {
  intent: string;
  textResponse: string;
  speechResponse: string;
  action?: "OPEN_DISASTER_MODAL" | "OPEN_CROP_MODAL" | "OPEN_FIELD_MODAL" | "OPEN_TUTORIAL" | "OPEN_PROFILE" | "NAVIGATE_DOSSIER" | "READ_PAGE";
}

export function processVoiceIntent(transcript: string, lang: LanguageCode): VoiceIntentResult {
  const text = transcript.trim().toLowerCase();
  if (!text) {
    return getFallbackResponse(lang);
  }

  // 1. Fertilizer & Agronomic Advice
  if (
    matchesAny(text, [
      "ఎరువు", "వరి", "పంటకు ఎరువు", "మందులు", "విత్తనాలు", // Telugu
      "खाद", "उर्वरक", "धान की खाद", "फर्टिलाइजर", // Hindi
      "fertilizer", "fertiliser", "manure", "urea", "npk", // English
      "உரம்", "பயிர் உரம்", // Tamil
      "खत", "उर्वरक", "युरिया" // Marathi
    ])
  ) {
    return getFertilizerResponse(text, lang);
  }

  // 2. Crop Disease & Pest Management
  if (
    matchesAny(text, [
      "తెగులు", "పురుగు", "వ్యాధి", "చీడ", // Telugu
      "बीमारी", "कीट", "रोग", "कीड़ा", // Hindi
      "disease", "pest", "fungus", "infection", "bug", // English
      "நோய்", "பூச்சி", // Tamil
      "कीड", "रोग", "अळी" // Marathi
    ])
  ) {
    return getDiseaseResponse(lang);
  }

  // 3. Report Disaster / Flood / Damage
  if (
    matchesAny(text, [
      "విపత్తు", "వరద", "కరువు", "నష్టం", "రిపోర్ట్", "చేను దెబ్బతింది", // Telugu
      "आपदा", "बाढ़", "सूखा", "नुकसान", "रिपोर्ट", // Hindi
      "disaster", "flood", "drought", "damage", "report loss", "report disaster", // English
      "பேரிடர்", "வெள்ளம்", "வறட்சி", "சேதம்", // Tamil
      "आपत्ती", "पूर", "दुष्काळ", "नुकसान" // Marathi
    ])
  ) {
    return {
      intent: "REPORT_DISASTER",
      textResponse: getTranslation(lang, {
        te: "విపత్తు నివేదిక ఫారమ్‌ను తెరుస్తున్నాను. మీ దెబ్బతిన్న పొలాన్ని ఎంచుకుని ఫోటోలు అప్‌లోడ్ చేయండి.",
        hi: "आपदा रिपोर्ट फॉर्म खोला जा रहा है। अपने प्रभावित खेत का चयन करें और फोटो अपलोड करें।",
        en: "Opening Disaster Report Form. Select your affected field and upload photo evidence.",
        ta: "பேரிடர் அறிக்கை படிவம் திறக்கப்படுகிறது. பாதிக்கப்பட்ட நிலத்தை தேர்ந்தெடுத்து புகைப்படங்களை பதிவேற்றவும்.",
        mr: "आपत्ती अहवाल फॉर्म उघडत आहे. आपले प्रभावित शेत निवडा आणि फोटो अपलोड करा."
      }),
      speechResponse: getTranslation(lang, {
        te: "విపత్తు నివేదిక ఫారమ్‌ను తెరుస్తున్నాను. దెబ్బతిన్న పొలాన్ని ఎంచుకుని ఫోటోలు అప్‌లోడ్ చేయండి.",
        hi: "आपदा रिपोर्ट फॉर्म खोला जा रहा है। प्रभावित खेत का चयन करके फोटो अपलोड करें।",
        en: "Opening Disaster Report Form. Select your affected field and upload photo evidence.",
        ta: "பேரிடர் அறிக்கை படிவம் திறக்கப்படுகிறது. பாதிக்கப்பட்ட நிலத்தை தேர்ந்தெடுத்து புகைப்படங்களை பதிவேற்றவும்.",
        mr: "आपत्ती अहवाल फॉर्म उघडत आहे. तुमचे प्रभावित शेत निवडा आणि फोटो अपलोड करा."
      }),
      action: "OPEN_DISASTER_MODAL",
    };
  }

  // 4. Register Field
  if (
    matchesAny(text, [
      "పొలం", "పొలం నమోదు", "కొత్త పొలం", "సరిహద్దు", "మ్యాప్", // Telugu
      "खेत", "खेत पंजीकृत", "नया खेत", "मानचित्र", // Hindi
      "register field", "add field", "new field", "map field", // English
      "நிலம்", "நிலம் பதிவு", "புதிய நிலம்", // Tamil
      "शेत", "शेत नोंदणी", "नवीन शेत" // Marathi
    ])
  ) {
    return {
      intent: "REGISTER_FIELD",
      textResponse: getTranslation(lang, {
        te: "కొత్త పొలం నమోదు ఫారమ్‌ను తెరుస్తున్నాను. మ్యాప్‌పై సరిహద్దులను గుర్తించి సర్వే నంబర్ నమోదు చేయండి.",
        hi: "खेत पंजीकरण फॉर्म खोला जा रहा है। मानचित्र पर खेत की सीमा चिह्नित करें और सर्वे नंबर दर्ज करें।",
        en: "Opening Field Registration Wizard. Draw your boundary polygon on the map and enter survey number.",
        ta: "நிலப் பதிவு படிவம் திறக்கப்படுகிறது. வரைபடத்தில் எல்லைகளை குறிக்கவும்.",
        mr: "शेत नोंदणी फॉर्म उघडत आहे. नकाशावर सीमा आखा आणि सर्व्हे नंबर टाका."
      }),
      speechResponse: getTranslation(lang, {
        te: "కొత్త పొలం నమోదు ఫారమ్‌ను తెరుస్తున్నాను. మ్యాప్‌పై సరిహద్దులను గుర్తించి సర్వే నంబర్ నమోదు చేయండి.",
        hi: "खेत पंजीकरण फॉर्म खोला जा रहा है। मानचित्र पर सीमा चिह्नित करें।",
        en: "Opening Field Registration Wizard. Draw your boundary polygon on the map and enter survey number.",
        ta: "நிலப் பதிவு படிவம் திறக்கப்படுகிறது.",
        mr: "शेत नोंदणी फॉर्म उघडत आहे."
      }),
      action: "OPEN_FIELD_MODAL",
    };
  }

  // 5. Register Crop
  if (
    matchesAny(text, [
      "పంట నమోదు", "విత్తనాలు", "పంట వివరాలు", // Telugu
      "फसल पंजीकरण", "फसल दर्ज", // Hindi
      "register crop", "add crop", "crop profile", // English
      "பயிர் பதிவு", // Tamil
      "पीक नोंदणी" // Marathi
    ])
  ) {
    return {
      intent: "REGISTER_CROP",
      textResponse: getTranslation(lang, {
        te: "పంట వివరాలు నమోదు చేసే ఫారమ్‌ను తెరుస్తున్నాను. పంట రకం, విత్తిన తేదీ మరియు వంగడాన్ని ఎంచుకోండి.",
        hi: "फसल पंजीकरण फॉर्म खोला जा रहा है। फसल का प्रकार, किस्म और बुवाई तिथि दर्ज करें।",
        en: "Opening Crop Registration Form. Select crop species, variety, and sowing date.",
        ta: "பயிர் பதிவு படிவம் திறக்கப்படுகிறது. பயிர் வகை மற்றும் விதைத்த தேதியை பதிவு செய்யவும்.",
        mr: "पीक नोंदणी फॉर्म उघडत आहे. पीक प्रकार आणि पेरणीची तारीख निवडा."
      }),
      speechResponse: getTranslation(lang, {
        te: "పంట వివరాలు నమోదు చేసే ఫారమ్‌ను తెరుస్తున్నాను. పంట రకం, విత్తిన తేదీ మరియు వంగడాన్ని ఎంచుకోండి.",
        hi: "फसल पंजीकरण फॉर्म खोला जा रहा है।",
        en: "Opening Crop Registration Form. Select crop species, variety, and sowing date.",
        ta: "பயிர் பதிவு படிவம் திறக்கப்படுகிறது.",
        mr: "पीक नोंदणी फॉर्म उघडत आहे."
      }),
      action: "OPEN_CROP_MODAL",
    };
  }

  // 6. Tutorial Video & How to Use
  if (
    matchesAny(text, [
      "ఎలా ఉపయోగించాలి", "ట్యుటోరియల్", "వీడియో", "సహాయం", "గైడ్", // Telugu
      "कैसे उपयोग करें", "ट्यूटोरियल", "वीडियो", "मदद", // Hindi
      "how to use", "tutorial", "video", "guide", "help video", // English
      "பயன்படுத்துவது எப்படி", "பயிற்சி", "வீடியோ", // Tamil
      "कसे वापरावे", "ट्युटोरियल", "व्हिडिओ" // Marathi
    ])
  ) {
    return {
      intent: "OPEN_TUTORIAL",
      textResponse: getTranslation(lang, {
        te: "అగ్రిషీల్డ్ వినియోగ మార్గదర్శక ట్యుటోరియల్ వీడియోను తెరుస్తున్నాను.",
        hi: "एग्रीशील्ड ट्यूटोरियल वीडियो खोला जा रहा है।",
        en: "Opening AgriShield step-by-step video tutorial modal.",
        ta: "அக்ரிஷீல்ட் பயிற்சி வீடியோ திறக்கப்படுகிறது.",
        mr: "ॲग्रीशील्ड मार्गदर्शक व्हिडिओ उघडत आहे."
      }),
      speechResponse: getTranslation(lang, {
        te: "అగ్రిషీల్డ్ వినియోగ మార్గదర్శక ట్యుటోరియల్ వీడియోను తెరుస్తున్నాను.",
        hi: "एग्रीशील्ड ट्यूटोरियल वीडियो खोला जा रहा है।",
        en: "Opening AgriShield step-by-step video tutorial modal.",
        ta: "அக்ரிஷீல்ட் பயிற்சி வீடியோ திறக்கப்படுகிறது.",
        mr: "ॲग्रीशील्ड मार्गदर्शक व्हिडिओ उघडत आहे."
      }),
      action: "OPEN_TUTORIAL",
    };
  }

  // 7. Claim Status / Dossier
  if (
    matchesAny(text, [
      "క్లెయిమ్", "పరిహారం", "బీమా", "నివేదికలు", // Telugu
      "दावा", "बीमा दावा", "क्लेम", // Hindi
      "claim", "dossier", "insurance claim", "status", // English
      "காப்பீடு", "கோரிக்கை", // Tamil
      "दावा", "विमा दावा" // Marathi
    ])
  ) {
    return {
      intent: "NAVIGATE_DOSSIER",
      textResponse: getTranslation(lang, {
        te: "మీ PMFBY పంట బీమా క్లెయిమ్ వివరాలు మరియు సాక్ష్యాల నివేదికకు తీసుకెళ్తున్నాను.",
        hi: "आपके बीमा दावे और फसल साक्ष्य डोजियर सेक्शन पर ले जाया जा रहा है।",
        en: "Navigating to your PMFBY Crop Insurance Claim Dossier.",
        ta: "உங்கள் பயிர் காப்பீட்டு கோரிக்கை பகுதிக்கு செல்கிறது.",
        mr: "तुमच्या विमा दावा आणि पीक पुरावा विभागात नेत आहे."
      }),
      speechResponse: getTranslation(lang, {
        te: "మీ పంట బీమా క్లెయిమ్ వివరాల విభాగానికి తీసుకెళ్తున్నాను.",
        hi: "आपके बीमा दावे के सेक्शन पर ले जाया जा रहा है।",
        en: "Navigating to your PMFBY Crop Insurance Claim Dossier.",
        ta: "உங்கள் பயிர் காப்பீட்டு கோரிக்கை பகுதிக்கு செல்கிறது.",
        mr: "तुमच्या विमा दावा विभागात नेत आहे."
      }),
      action: "NAVIGATE_DOSSIER",
    };
  }

  // Fallback unrecognized response
  return getFallbackResponse(lang);
}

function matchesAny(text: string, keywords: string[]): boolean {
  return keywords.some((kw) => text.includes(kw.toLowerCase()));
}

function getFertilizerResponse(text: string, lang: LanguageCode): VoiceIntentResult {
  const isPaddy = text.includes("వరి") || text.includes("धान") || text.includes("rice") || text.includes("paddy") || text.includes("நெல்") || text.includes("भात");
  const isCotton = text.includes("పత్తి") || text.includes("कपास") || text.includes("cotton") || text.includes("பருத்தி") || text.includes("कापूस");

  if (isCotton) {
    return {
      intent: "FERTILIZER_ADVISORY",
      textResponse: getTranslation(lang, {
        te: "పత్తి పంటకు: ఎకరానికి NPK 20:20:0:13 కాంప్లెక్స్ 50 కేజీలు, 45-60 రోజులకు యూరియా 25 కేజీలు మరియు పొటాష్ 15 కేజీలు వేయాలి.",
        hi: "कपास की फसल के लिए: प्रति एकड़ 50 किग्रा NPK 20:20:0:13 और बुवाई के 45 दिनों बाद यूरिया 25 किग्रा दें।",
        en: "For Cotton Crop: Apply 50kg NPK 20:20:0:13 per acre, followed by 25kg Urea and 15kg MOP at 45-60 days.",
        ta: "பருத்தி பயிருக்கு: ஏக்கருக்கு 50 கிலோ NPK உரம் மற்றும் 45 நாட்களுக்குப் பின் 25 கிலோ யூரியா இடவும்.",
        mr: "कापूस पिकासाठी: दर एकरी ५० किलो NPK खत आणि ४५ दिवसांनंतर २५ किलो युरिया द्या."
      }),
      speechResponse: getTranslation(lang, {
        te: "పత్తి పంటకు ఎకరానికి NPK కాంప్లెక్స్ 50 కేజీలు మరియు 45 రోజులకు యూరియా వేయాలి.",
        hi: "कपास की फसल के लिए प्रति एकड़ 50 किग्रा NPK और 45 दिनों बाद यूरिया दें।",
        en: "For Cotton Crop: Apply 50kg NPK per acre, followed by 25kg Urea at 45 days.",
        ta: "பருத்தி பயிருக்கு ஏக்கருக்கு 50 கிலோ NPK உரம் இடவும்.",
        mr: "कापूस पिकासाठी दर एकरी ५० किलो NPK खत द्या."
      })
    };
  }

  // Default Paddy / General fertilizer advisory
  return {
    intent: "FERTILIZER_ADVISORY",
    textResponse: getTranslation(lang, {
      te: "వరి పంటకు ఎరువుల సలహా: ప్రారంభంలో NPK 20:20:0:13 ఎకరానికి 50 కేజీలు, 30-35 రోజులకు యూరియా 30 కేజీలు మరియు పొటాష్ 15 కేజీలు వేయండి. ఆకులు పసుపు రంగులోకి మారితే జింక్ సల్ఫేట్ 2 గ్రా/లీటర్ పిచికారీ చేయండి.",
      hi: "धान की फसल के लिए खाद सलाह: शुरुआती चरण में प्रति एकड़ 50 किग्रा NPK, 30-35 दिनों बाद 30 किग्रा यूरिया और 15 किग्रा पोटाश डालें। पत्तियां पीली होने पर जिंक सल्फेट का छिड़काव करें।",
      en: "Rice/Paddy Fertilizer Advisory: Apply NPK 20:20:0:13 (50kg/acre) at basal stage. Apply Urea (30kg/acre) & MOP (15kg/acre) at 30-35 days tillering. Spray Zinc Sulphate if leaves turn yellow.",
      ta: "நெல் பயிர் உர ஆலோசனை: ஆரம்பத்தில் NPK 50 கிலோ/ஏக்கர் இடவும். 30-35 நாட்களில் 30 கிலோ யூரியா மற்றும் பொட்டாஷ் இடவும். இலைகள் மஞ்சளானால் ஜிங்க் சல்பேட் தெளிக்கவும்.",
      mr: "भात पीक खत सल्ला: सुरुवातीला दर एकरी ५० किलो NPK द्या. ३०-३५ दिवसांनी ३० किलो युरिया आणि पोटाश द्या. पाने पिवळी पडल्यास झिंक सल्फेट फवारा."
    }),
    speechResponse: getTranslation(lang, {
      te: "వరి పంటకు ప్రారంభంలో NPK 50 కేజీలు, 35 రోజులకు యూరియా 30 కేజీలు వేయండి.",
      hi: "धान की फसल के लिए शुरुआती चरण में 50 किग्रा NPK और 35 दिनों बाद 30 किग्रा यूरिया डालें।",
      en: "For Rice crop, apply 50kg NPK at basal stage and 30kg Urea at 35 days.",
      ta: "நெல் பயிருக்கு ஆரம்பத்தில் NPK 50 கிலோ இடவும்.",
      mr: "भात पिकासाठी सुरुवातीला ५० किलो NPK द्या."
    })
  };
}

function getDiseaseResponse(lang: LanguageCode): VoiceIntentResult {
  return {
    intent: "DISEASE_REPORTING",
    textResponse: getTranslation(lang, {
      te: "పంట తెగులు లేదా వ్యాధి నష్టాన్ని నివేదించడానికి 'విపత్తు నివేదిక' తెరవండి. ఫోటోలు తీసి విపత్తు రకంలో 'పంట తెగులు/పురుగుల దాడి' లేదా 'ఇతర' అని ఎంచుకుని నమోదు చేయండి.",
      hi: "फसल कीट या बीमारी की रिपोर्ट करने के लिए 'आपदा रिपोर्ट' खोलें। फोटो लें और आपदा प्रकार में 'कीट हमला' या 'अन्य' चुनकर सबमिट करें।",
      en: "To report crop disease or pest damage, click 'Report Disaster'. Capture close-up crop photos, select 'Pest Attack' or 'Other', and submit.",
      ta: "பயிர் நோய் சேதத்தை பதிவு செய்ய 'பேரிடர் அறிக்கை' திறக்கவும். புகைப்படங்களை எடுத்து பதிவேற்றவும்.",
      mr: "पीक कीड किंवा रोगाची नोंद करण्यासाठी 'आपत्ती अहवाल' उघडा. फोटो काढून सादर करा."
    }),
    speechResponse: getTranslation(lang, {
      te: "పంట తెగులు నివేదించడానికి విపత్తు నివేదిక తెరవండి. ఫోటోలు అప్‌లోడ్ చేయండి.",
      hi: "फसल कीट की रिपोर्ट करने के लिए आपदा रिपोर्ट खोलें।",
      en: "To report crop disease, open the Disaster Report modal and upload photo evidence.",
      ta: "பயிர் நோய் பதிவு செய்ய பேரிடர் அறிக்கை திறக்கவும்.",
      mr: "पीक कीड नोंदीसाठी आपत्ती अहवाल उघडा."
    }),
    action: "OPEN_DISASTER_MODAL"
  };
}

function getFallbackResponse(lang: LanguageCode): VoiceIntentResult {
  return {
    intent: "UNKNOWN_FALLBACK",
    textResponse: getTranslation(lang, {
      te: "క్షమించండి, నేను మీ అభ్యర్థనను సరిగ్గా అర్థం చేసుకోలేకపోయాను. దయచేసి 'వరికి ఎరువుల సలహా', 'పొలం నమోదు', 'విపత్తు నివేదిక' లేదా 'ట్యుటోరియల్' అని అడగండి.",
      hi: "क्षमा करें, मैं समझ नहीं पाया। कृपया 'धान की खाद', 'खेत पंजीकरण', 'आपदा रिपोर्ट' या 'ट्यूटोरियल' के बारे में पूछें।",
      en: "I'm sorry, I didn't understand that clearly. Please try asking about 'Rice Fertilizer', 'Register Field', 'Report Disaster', or 'Tutorial'.",
      ta: "மன்னிக்கவும், விளங்கவில்லை. 'உரம்', 'நிலம் பதிவு', 'பேரிடர் அறிக்கை' அல்லது 'பயிற்சி' பற்றி கேளுங்கள்.",
      mr: "क्षमस्व, मला समजले नाही. कृपया 'खत सल्ला', 'शेत नोंदणी', 'आपत्ती अहवाल' किंवा 'ट्युटोरियल' बद्दल विचारा."
    }),
    speechResponse: getTranslation(lang, {
      te: "క్షమించండి, నేను మీ అభ్యర్థనను అర్థం చేసుకోలేకపోయాను. దయచేసి పొలం నమోదు లేదా విపత్తు నివేదిక అని మళ్లీ అడగండి.",
      hi: "क्षमा करें, मैं समझ नहीं पाया। कृपया खेत पंजीकरण या आपदा रिपोर्ट के बारे में पूछें।",
      en: "I'm sorry, I didn't catch that. Please ask about registering a field or reporting a disaster.",
      ta: "மன்னிக்கவும், விளங்கவில்லை. தயவுசெய்து மீண்டும் கேளுங்கள்.",
      mr: "क्षमस्व, मला समजले नाही. कृपया पुन्हा विचारा."
    })
  };
}

function getTranslation(lang: LanguageCode, mapping: Record<string, string>): string {
  return mapping[lang] || mapping.en;
}
