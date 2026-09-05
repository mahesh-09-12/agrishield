import React, { useState, useEffect } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  X,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Tv,
  MapPin,
  Camera,
  FileText,
  HelpCircle,
  Sparkles,
  BarChart2,
  Globe
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useVoice } from "../../context/VoiceContext";

interface TutorialChapter {
  id: number;
  title: Record<string, string>;
  subtitle: Record<string, string>;
  duration: string;
  icon: any;
  summary?: string;
  narration: Record<string, string>;
  keySteps: Record<string, string[]>;
  visualScene: "navigation" | "fieldMap" | "cropForm" | "evidenceCapture" | "disasterReport" | "claimDossier";
}

const UI: Record<string, Record<string, string>> = {
  modalTitle: { en: "How to Use AgriShield – Step-by-Step Tutorial", hi: "एग्रीशील्ड कैसे उपयोग करें – गाइड", te: "AgriShield ఎలా ఉపయోగించాలి – వివరణ", ta: "AgriShield பயன்படுத்துவது எப்படி", mr: "AgriShield कसे वापरावे – मार्गदर्शक" },
  modalSub: { en: "Farmer Guidance & Platform Walkthrough with Multilingual Audio", hi: "किसानों के लिए मार्गदर्शक और ऑडियो ट्यूटोरियल", te: "రైతులకు మార్గదర్శనం మరియు ఆడియో ట్యుటోరియల్", ta: "விவசாயிகளுக்கான வழிகாட்டல் மற்றும் ஆடியோ பயிற்சி", mr: "शेतकऱ्यांसाठी मार्गदर्शन आणि ऑडियो ट्युटोरियल" },
  chaptersLabel: { en: "Tutorial Chapters", hi: "ट्यूटोरियल अध्याय", te: "ట్యుటోరియల్ అధ్యాయాలు", ta: "பயிற்சி அத்தியாயங்கள்", mr: "ट्युटोरियल प्रकरणे" },
  keyStepsLabel: { en: "Key Action Steps:", hi: "मुख्य चरण:", te: "ముఖ్యమైన దశలు:", ta: "முக்கிய படிகள்:", mr: "महत्त्वाचे टप्पे:" },
  playBtn: { en: "Play Chapter", hi: "अध्याय चलाएं", te: "అధ్యాయం ప్లే చేయండి", ta: "அத்தியாயம் இயக்கவும்", mr: "प्रकरण सुरू करा" },
  pauseBtn: { en: "Pause", hi: "रोकें", te: "ఆపండి", ta: "இடைநிறுத்தவும்", mr: "थांबवा" },
  listenAudio: { en: "Listen Audio", hi: "ऑडियो सुनें", te: "ఆడియో వినండి", ta: "ஆடியோ கேட்கவும்", mr: "ऑडियो ऐका" },
  chapterOf: { en: "Chapter", hi: "अध्याय", te: "అధ్యాయం", ta: "அத்தியாயம்", mr: "प्रकरण" },
  of: { en: "of", hi: "का", te: "లో", ta: "இல்", mr: "पैकी" },
  closeBtn: { en: "Close & Explore Platform", hi: "बंद करें और प्लेटफ़ॉर्म देखें", te: "మూసివేసి అన్వేషించండి", ta: "மூடி தளத்தை ஆராயுங்கள்", mr: "बंद करा आणि तपासा" },
  audioLabel: { en: "Audio Explanation", hi: "ऑडियो व्याख्या", te: "ఆడియో వివరణ", ta: "ஆடியோ விளக்கம்", mr: "ऑडियो स्पष्टीकरण" },
  playing: { en: "VIDEO DEMO PLAYING", hi: "वीडियो चल रहा है", te: "వీడియో నడుస్తోంది", ta: "வீடியோ இயங்குகிறது", mr: "व्हिडिओ सुरू आहे" },
  ready: { en: "CHAPTER READY", hi: "अध्याय तैयार है", te: "అధ్యాయం సిద్ధం", ta: "அத்தியாயம் தயார்", mr: "प्रकरण तयार आहे" },
};
const t = (key: string, lang: string) => UI[key]?.[lang] || UI[key]?.en || key;

const TUTORIAL_CHAPTERS: TutorialChapter[] = [
  {
    id: 1,
    title: { en: "1. Website Navigation & Overview", hi: "1. वेबसाइट नेविगेशन और सिंहावलोकन", te: "1. వెబ్‌సైట్ నావిగేషన్ & పరిచయం", ta: "1. இணையதள வழிசெலுத்தல் & கண்ணோட்டம்", mr: "1. वेबसाइट नेव्हिगेशन आणि आढावा" },
    subtitle: { en: "Learn how to navigate AgriShield easily", hi: "एग्रीशील्ड को आसानी से नेविगेट करना सीखें", te: "అగ్రిషీల్డ్‌ని సులభంగా నావిగేట్ చేయడం నేర్చుకోండి", ta: "AgriShieldஐ எளிதாக வழிசெலுத்த கற்றுக்கொள்ளுங்கள்", mr: "AgriShield सहज वापरणे शिका" },
    duration: "0:45",
    icon: Tv,
    summary: "Welcome to AgriShield! This chapter shows how to switch between Farmer Portal, My Fields, Evidence Timeline, and change your preferred language.",
    narration: {
      en: "Welcome to AgriShield! To navigate, use the top bar to view your registered fields, switch languages like Telugu or Hindi, or access your profile.",
      hi: "एग्रीशील्ड में आपका स्वागत है! वेबसाइट पर नेविगेट करने के लिए ऊपर दिए गए मेनू से खेत देखें, भाषा बदलें और अपना प्रोफ़ाइल खोलें।",
      te: "అగ్రిషీల్డ్‌కి స్వాగతం! వెబ్‌సైట్‌లో నావిగేట్ చేయడానికి పైన ఉన్న బార్‌ను ఉపయోగించి మీ పొలాలు చూడండి, తెలుగు లేదా ఇతర భాషలకు మారండి.",
      ta: "அக்ரிஷீல்டிற்கு நல்வரவு! தளத்தை பயன்படுத்த மேல் உள்ள பட்டியலை பயன்படுத்தி உங்கள் நிலங்களை பார்வையிடலாம்.",
      mr: "ॲग्रीशील्डमध्ये आपले स्वागत आहे! मुख्य मेनू वापरून आपली शेते पहा आणि भाषा बदला."
    },
    keySteps: {
      en: ["Click Language dropdown (top right) to select Telugu, Hindi, or English.", "Click 'My Fields' to view plot boundaries and active crop status.", "Click the Microphone widget anytime for voice instructions in your language."],
      hi: ["भाषा ड्रॉपडाउन से तेलुगु, हिंदी या अंग्रेज़ी चुनें।", "'मेरे खेत' पर क्लिक करके पंजीकृत खेत और फसल स्थिति देखें।", "किसी भी समय माइक्रोफ़ोन बटन से वॉइस निर्देश पाएं।"],
      te: ["భాష ఎంచుకోవడానికి (కుడి వైపు) భాష డ్రాప్‌డౌన్ నొందండి.", "'నా పొలాలు' నొక్కి నమోదైన సరిహద్దులు మరియు పంట స్థితి చూడండి.", "ఎప్పుడైనా మైక్రోఫోన్ బటన్ నొక్కి వాయిస్ సహాయం పొందండి."],
      ta: ["மேல் வலதில் உள்ள மொழி தேர்வு செய்யவும்.", "'என் நிலங்கள்' என்பதை கிளிக் செய்து நிலங்களை பார்க்கவும்.", "எந்த நேரத்திலும் மைக்ரோஃபோன் பொத்தானை அழுத்தி குரல் வழிகாட்டல் பெறவும்."],
      mr: ["भाषा ड्रॉपडाउनमधून तेलुगु, हिंदी किंवा मराठी निवडा.", "'माझी शेतं' वर क्लिक करून नोंदणीकृत शेते पहा.", "कधीही मायक्रोफोन बटणावर क्लिक करून व्हॉइस मदत घ्या."]
    },
    visualScene: "navigation"
  },
  {
    id: 2,
    title: { en: "2. Registering Agricultural Fields & Boundaries", hi: "2. कृषि खेत और सीमाएं पंजीकृत करें", te: "2. వ్యవసాయ పొలాలు & సరిహద్దులు నమోదు", ta: "2. விவசாய நிலங்கள் மற்றும் எல்லைகளை பதிவு செய்யவும்", mr: "2. शेते आणि सीमा नोंदणी करा" },
    subtitle: { en: "Map your plot boundary on the interactive map", hi: "इंटरेक्टिव मानचित्र पर अपनी भू-सीमा बनाएं", te: "ఇంటరాక్టివ్ మ్యాప్‌పై సరిహద్దు గీయండి", ta: "ஊடாடும் வரைபடத்தில் நிலத்தின் எல்லையை வரையுங்கள்", mr: "इंटरेक्टिव्ह नकाशावर शेताची हद्द आखा" },
    duration: "1:15",
    icon: MapPin,
    summary: "Mark your agricultural survey land by clicking boundary points on the cadastral map. Real-time acreage (e.g. 2.35 acres) is computed automatically.",
    narration: {
      en: "To register a field, click 'Register Field'. Tap the map to mark boundary corners, enter survey number and soil classification, then click Save.",
      hi: "खेत पंजीकृत करने के लिए 'खेत पंजीकृत करें' दबाएं। नक्शे पर कोने क्लिक करके सीमा बनाएं, सर्वे नंबर और मिट्टी दर्ज करें और सहेजें।",
      te: "పొలం నమోదు చేయడానికి 'పొలం నమోదు చేయండి' నొక్కండి. నక్షాపై మూలలను నొక్కి సరిహద్దు మార్క్ చేయండి, సర్వే నంబర్ నమోదు చేసి సేవ్ చేయండి.",
      ta: "நிலத்தை பதிவு செய்ய வரைபடத்தில் எல்லை புள்ளிகளை குறிக்கவும். சர்வே எண் மற்றும் மண் வகையை உள்ளிடவும்.",
      mr: "शेत नोंदवण्यासाठी नकाशावर कोपरे निवडून हद्द आखा, सर्व्हे नंबर टाका आणि सेव्ह करा."
    },
    keySteps: {
      en: ["Click 'Register Field' from your dashboard.", "Tap map corners to draw a closed boundary polygon.", "Fill Survey Number (e.g. 142/3B) and Soil Classification.", "If soil type not listed, select 'Other' and type your own."],
      hi: ["डैशबोर्ड से 'खेत पंजीकृत करें' दबाएं।", "नक्शे पर कोने क्लिक करके सीमा बनाएं।", "सर्वे नंबर और मिट्टी का प्रकार दर्ज करें।", "यदि मिट्टी सूची में नहीं है तो 'अन्य' चुनें।"],
      te: ["డ్యాష్‌బోర్డ్ నుండి 'పొలం నమోదు' నొక్కండి.", "మ్యాప్‌పై మూలలను నొక్కి సరిహద్దు గీయండి.", "సర్వే నంబర్ & నేల రకం నమోదు చేయండి.", "నేల రకం లేకపోతే 'ఇతర' ఎంచుకుని మీ రకం టైప్ చేయండి."],
      ta: ["'நிலத்தை பதிவு செய்' என்பதை அழுத்தவும்.", "வரைபடத்தில் மூலைகளை குறித்து எல்லை வரையுங்கள்.", "சர்வே எண் மற்றும் மண் வகையை பதிவிடவும்.", "பட்டியலில் இல்லையென்றால் 'மற்றவை' தேர்ந்தெடுக்கவும்."],
      mr: ["'शेत नोंदणी करा' वर क्लिक करा.", "नकाशावर कोपरे निवडून हद्द आखा.", "सर्व्हे नंबर आणि मातीचा प्रकार टाका.", "यादीत नसल्यास 'इतर' निवडून स्वतःचा प्रकार टाका."]
    },
    visualScene: "fieldMap"
  },
  {
    id: 3,
    title: { en: "3. Sowing Crop Profile & Options", hi: "3. फसल प्रोफ़ाइल और विकल्प", te: "3. పంట ప్రొఫైల్ & ఎంపికలు", ta: "3. பயிர் சுயவிவரம் மற்றும் விருப்பங்கள்", mr: "3. पीक प्रोफाइल आणि पर्याय" },
    subtitle: { en: "Select crop species, seed variety, and irrigation", hi: "फसल प्रकार, किस्म और सिंचाई स्रोत चुनें", te: "పంట రకం, విత్తన జాతి మరియు నీటి పారుదల ఎంచుకోండి", ta: "பயிர் வகை, விதை ரகம் மற்றும் பாசன ஆதாரத்தை தேர்ந்தெடுக்கவும்", mr: "पीक प्रकार, वाण आणि सिंचन स्रोत निवडा" },
    duration: "1:00",
    icon: FileText,
    summary: "Record details about what you have sown: crop species (Paddy, Cotton, Maize), cultivar variety, sowing date, and expected harvest date.",
    narration: {
      en: "Select your sown crop like Paddy or Cotton, seed variety, sowing date, and irrigation source. Choose 'Other' if your custom variety isn't listed.",
      hi: "अपनी बोई गई फसल जैसे धान या कपास चुनें, बीज किस्म, बुवाई तिथि दर्ज करें। अगर आपकी किस्म सूची में नहीं है, तो 'अन्य' चुनें।",
      te: "మీరు వేసిన వరి లేదా పత్తి పంట రకాన్ని, విత్తన జాతిని, విత్తిన తేదీని ఎంచుకోండి. మీ రకం లేకపోతే 'ఇతర' ఎంపికను ఉపయోగించండి.",
      ta: "பயிர் வகை, விதை ரகம் மற்றும் விதைத்த தேதியை தேர்ந்தெடுக்கவும். பட்டியல் இல்லையென்றால் 'மற்றவை' தேர்ந்தெடுக்கவும்.",
      mr: "पिकाचा प्रकार, वाण आणि पेरणीची तारीख निवडा. यादीत नसल्यास 'इतर' निवडा."
    },
    keySteps: {
      en: ["Select Crop Species (Rice, Cotton, Groundnut).", "Enter Variety (e.g. BPT 5204). Use 'Other' for custom seeds.", "Choose Sowing Date and Irrigation source.", "Click 'Save Crop Profile' to activate monitoring."],
      hi: ["फसल प्रकार चुनें (धान, कपास, मूंगफली)।", "बीज किस्म डालें (जैसे BPT 5204)। 'अन्य' से कस्टम किस्म डालें।", "बुवाई तिथि और सिंचाई स्रोत चुनें।", "'फसल सहेजें' पर क्लिक करें।"],
      te: ["పంట రకం ఎంచుకోండి (వరి, పత్తి, వేరుశెనగ).", "విత్తన జాతి నమోదు చేయండి. 'ఇతర' తో అనుకూల జాతి టైప్ చేయండి.", "విత్తిన తేదీ & నీటి పారుదల రకం ఎంచుకోండి.", "'పంట సేవ్ చేయి' నొక్కండి."],
      ta: ["பயிர் வகை தேர்வு செய்யவும் (நெல், பருத்தி).", "விதை ரகம் உள்ளிடவும். 'மற்றவை' மூலம் தனிப்பயனாக்கவும்.", "விதைத்த தேதி மற்றும் பாசன ஆதாரம் தேர்வு செய்யவும்.", "'பயிரை சேமி' என்பதை கிளிக் செய்யவும்."],
      mr: ["पीक प्रकार निवडा (भात, कापूस, भुईमूग).", "वाण टाका. 'इतर' वापरून स्वतःचे वाण लिहा.", "पेरणीची तारीख आणि सिंचन स्रोत निवडा.", "'पीक सेव्ह करा' वर क्लिक करा."]
    },
    visualScene: "cropForm"
  },
  {
    id: 4,
    title: { en: "4. Capturing 4-Step Geo-Tagged Photo Evidence", hi: "4. 4-चरण जियो-टैग्ड फोटो साक्ष्य कैप्चर करें", te: "4. 4-దశల జియో-ట్యాగ్డ్ ఫోటో ఆధారాలు తీయండి", ta: "4. 4-படி புவிக்குறியீட்டு புகைப்பட சான்றுகள்", mr: "4. 4-टप्पा जिओ-टॅग्ड फोटो पुरावे" },
    subtitle: { en: "Follow guided sector photography after a disaster", hi: "आपदा के बाद निर्देशित क्षेत्र फोटो लें", te: "విపత్తు తరువాత గైడెడ్ ఫోటోలు తీయండి", ta: "பேரிடருக்கு பின் வழிகாட்டப்பட்ட புகைப்படங்களை எடுக்கவும்", mr: "आपत्तीनंतर मार्गदर्शित छायाचित्रे घ्या" },
    duration: "1:30",
    icon: Camera,
    summary: "Prevent claim rejection by following our 4-step guided photo capture: Wide field view → Quadrant section → Epicenter damage → Macro close-up photo.",
    narration: {
      en: "Follow our 4-step guided camera capture: Step 1 Wide field view, Step 2 Side plot section, Step 3 Epicenter damage, Step 4 Close-up foliage photo.",
      hi: "4-चरण निर्देशित फोटो लें: चरण 1 चौड़ा दृश्य, चरण 2 दूसरा अनुभाग, चरण 3 मुख्य नुकसान का केंद्र, चरण 4 पत्तियों का क्लोज़-अप फोटो।",
      te: "4-దశల నష్ట ఫోటోల సేకరణ: దశ 1 మొత్తం పొలం ఫోటో, దశ 2 రెండవ విభాగం, దశ 3 తీవ్ర నష్ట స్థలం, దశ 4 ఆకుల దగ్గరి ఫోటో తీయండి.",
      ta: "4-படி புகைப்பட சேகரிப்பு: படி 1 நிலத்தின் முழு படம், படி 2 பக்கவாட்டு பகுதி, படி 3 சேத மையம், படி 4 நெருங்கிய படம்.",
      mr: "4 फोटो घ्या: टप्पा 1 संपूर्ण शेत, टप्पा 2 बाजूचा भाग, टप्पा 3 मुख्य नुकसान केंद्र, टप्पा 4 पानांचा फोटो."
    },
    keySteps: {
      en: ["Step 1 (Wide View): Stand at boundary ridge, capture the full field.", "Step 2 (Section View): Walk 50m into plot, capture cross-section.", "Step 3 (Epicenter): Focus on the most damaged area.", "Step 4 (Close-Up): Hold camera 20cm from foliage for leaf/stem detail."],
      hi: ["चरण 1 (वाइड): मेड़ पर खड़े होकर पूरे खेत का फोटो लें।", "चरण 2 (अनुभाग): 50 मीटर अंदर जाकर साइड सेक्शन लें।", "चरण 3 (केंद्र): सबसे क्षतिग्रस्त भाग का फोटो लें।", "चरण 4 (क्लोज़-अप): पत्तियां 20 सेमी दूर से फोटो लें।"],
      te: ["దశ 1 (విస్తృత): గట్టుపై నిలబడి పొలం ఫోటో తీయండి.", "దశ 2 (విభాగం): 50 మీ లోపలికి నడిచి అడ్డకోత ఫోటో.", "దశ 3 (కేంద్రం): అత్యంత దెబ్బతిన్న భాగం.", "దశ 4 (క్లోజప్): ఆకులను 20 సెమీ దూరం నుండి ఫోటో."],
      ta: ["படி 1 (விரிவு): வரப்பில் நின்று முழு நிலப் படம் எடுக்கவும்.", "படி 2 (பகுதி): 50 மீ நடந்து பக்கப் படம் எடுக்கவும்.", "படி 3 (மையம்): மிகவும் சேதமடைந்த பகுதி.", "படி 4 (நெருங்கிய): 20 செ.மீ தொலைவில் இலைப் படம்."],
      mr: ["टप्पा 1 (विस्तृत): बांधावर उभे राहून शेताचा फोटो.", "टप्पा 2 (भाग): 50 मी आत जाऊन बाजूचा फोटो.", "टप्पा 3 (केंद्र): सर्वाधिक नुकसानग्रस्त भागाचा फोटो.", "टप्पा 4 (क्लोज-अप): 20 सेमी दूर पानांचा फोटो."]
    },
    visualScene: "evidenceCapture"
  },
  {
    id: 5,
    title: { en: "5. Reporting Disaster & Weather Correlation", hi: "5. आपदा रिपोर्ट और मौसम सहसंबंध", te: "5. విపత్తు నివేదిక & వాతావరణ అనుసంధానం", ta: "5. பேரிடர் அறிக்கை மற்றும் வானிலை தொடர்பு", mr: "5. आपत्ती अहवाल आणि हवामान सहसंबंध" },
    subtitle: { en: "Log heavy rainfall, floods, or drought with weather proof", hi: "भारी वर्षा, बाढ़ या सूखे की मौसम साक्ष्य के साथ रिपोर्ट करें", te: "భారీ వర్షం, వరద లేదా కరువును వాతావరణ ఆధారాలతో నమోదు చేయండి", ta: "பெரும் மழை, வெள்ளம் அல்லது வறட்சியை வானிலை சான்றுடன் பதிவிடவும்", mr: "अतिवृष्टी, पूर किंवा दुष्काळ हवामान पुराव्यांसह नोंदवा" },
    duration: "1:10",
    icon: HelpCircle,
    summary: "Select your disaster event type (Flood, Drought, Hailstorm), date and time. AgriShield automatically fetches Open-Meteo weather telemetry rainfall graphs.",
    narration: {
      en: "Click 'Report Disaster', choose the disaster type like Heavy Rainfall or Flood, event date, and submit. The system automatically verifies Open-Meteo weather data.",
      hi: "'आपदा की सूचना दें' दबाएं, बाढ़ या सूखा चुनें और सबमिट करें। सिस्टम स्वचालित रूप से मौसम विज्ञान डेटा और बारिश की जांच करता है।",
      te: "'విపత్తు నమోదు చేయండి' నొక్కండి, వరద లేదా కరువు వంటి విపత్తు రకాన్ని ఎంచుకుని సమర్పించండి. సిస్టమ్ స్వయంచాలకంగా వర్షపాత డేటాను తనిఖీ చేస్తుంది.",
      ta: "பேரிடரை பதிவு செய்ய 'பேரிடர் నమోదు' பொத்தானை அழுத்தவும். வானிலை தரவு தானாக சரிபார்க்கப்படும்.",
      mr: "आपत्तीची नोंद करण्यासाठी आपत्ती प्रकार आणि तारीख निवडा. हवामान डेटा आपोआप तपासला जातो."
    },
    keySteps: {
      en: ["Click 'Report Disaster' from your dashboard.", "Select impacted field and Disaster Type (Flood, Drought, Pest Attack, or 'Other').", "System auto-fetches Open-Meteo weather data for verification.", "Submit to link your 4-step photo evidence."],
      hi: ["डैशबोर्ड से 'आपदा रिपोर्ट' दबाएं।", "प्रभावित खेत और आपदा प्रकार चुनें ('अन्य' भी उपलब्ध है)।", "सिस्टम Open-Meteo से मौसम डेटा स्वचालित रूप से जांचता है।", "4-चरण फोटो साक्ष्य लिंक करने के लिए सबमिट करें।"],
      te: ["డ్యాష్‌బోర్డ్ నుండి 'విపత్తు నమోదు' నొక్కండి.", "దెబ్బతిన్న పొలం & విపత్తు రకం ఎంచుకోండి ('ఇతర' కూడా వుంది).", "సిస్టమ్ వాతావరణ డేటాను స్వయంచాలకంగా తనిఖీ చేస్తుంది.", "4-దశల ఫోటోలు లింక్ చేయడానికి సమర్పించండి."],
      ta: ["'பேரிடரை பதிவு செய்' என்பதை அழுத்தவும்.", "பாதிக்கப்பட்ட நிலம் மற்றும் பேரிடர் வகை தேர்வு செய்யவும்.", "Open-Meteo தரவு தானாக சரிபார்க்கப்படும்.", "4-படி புகைப்படங்களை இணைக்க சமர்ப்பிக்கவும்."],
      mr: ["'आपत्ती अहवाल' वर क्लिक करा.", "प्रभावित शेत आणि आपत्ती प्रकार निवडा ('इतर' पर्याय उपलब्ध).", "Open-Meteo हवामान डेटा आपोआप तपासला जातो.", "4-टप्पा फोटो पुरावे जोडण्यासाठी सादर करा."]
    },
    visualScene: "disasterReport"
  },
  {
    id: 6,
    title: { en: "6. AI Loss Ratings & Claim Dossier", hi: "6. AI क्षति रेटिंग और दावा डोजियर", te: "6. AI నష్ట రేటింగ్‌లు & క్లెయిమ్ డాక్యుమెంట్", ta: "6. AI சேத மதிப்பீடு மற்றும் கோரிக்கை ஆவணம்", mr: "6. AI नुकसान रेटिंग आणि दावा डोसियर" },
    subtitle: { en: "View % damage breakdown, loss estimate ₹, and status", hi: "क्षति % विश्लेषण, नुकसान अनुमान और दावा स्थिति देखें", te: "నష్టం % విभজন, అంచనా పరిహారం మరియు స్థితి చూడండి", ta: "சேத சதவீதம், இழப்பீட்டு மதிப்பீடு மற்றும் கோரிக்கை நிலையை பாருங்கள்", mr: "नुकसान % विभाजन, अंदाजित भरपाई आणि दावा स्थिती पहा" },
    duration: "1:20",
    icon: BarChart2,
    summary: "Gemini AI categorizes sector damage into Healthy (35%), Moderate (40%), and Severe (25%). The complete PMFBY claim dossier is submitted for officer review.",
    narration: {
      en: "View your claim dossier to see AI damage percentage, preliminary loss estimate in Rupees, and insurance status. Track approval progress transparently.",
      hi: "अपना दावा डोजियर देखकर एआई क्षति प्रतिशत, अनुमानित मुआवजा राशि (रुपये में) और स्वीकृति स्थिति जांचें।",
      te: "మీ క్లెయిమ్ డాక్యుమెంట్ చూసి AI నష్ట శాతం, అంచనా వేసిన పరిహారం మొత్తం (రూపాయలలో) మరియు బీమా స్థితి తెలుసుకోండి.",
      ta: "உங்கள் கோரிக்கை ஆவணத்தில் AI சேத சதவீதம் மற்றும் காப்பீட்டு இழப்பீட்டு தொகையை பார்வையிடலாம்.",
      mr: "आपला दावा डोजियर पाहून AI नुकसान टक्केवारी आणि अंदाजित भरपाई रक्कम तपासा."
    },
    keySteps: {
      en: ["Open 'Claim Dossier' to review AI spatial loss ratings.", "Check compensation estimate (e.g. ₹45,825 for 65% loss).", "Officer reviews rule matrix and approves Direct Benefit Transfer.", "Track status from 'Under Review' to 'Approved'."],
      hi: ["'दावा डोजियर' खोलकर AI क्षति रेटिंग देखें।", "अनुमानित मुआवजा जांचें (जैसे ₹45,825)।", "अधिकारी नियम सत्यापन के बाद DBT स्वीकृत करते हैं।", "स्थिति 'समीक्षाधीन' से 'स्वीकृत' तक ट्रैक करें।"],
      te: ["'క్లెయిమ్ దాఖలా' తెరిచి AI నష్ట రేటింగ్‌లు చూడండి.", "అంచనా పరిహారం చెక్ చేయండి (ఉదా. ₹45,825).", "అధికారి నియమ సత్యాపన తర్వాత DBT ఆమోదిస్తారు.", "స్థితి 'పరిశీలనలో' నుండి 'ఆమోదించబడింది' వరకు ట్రాక్ చేయండి."],
      ta: ["'கோரிக்கை ஆவணம்' திறந்து AI சேத மதிப்பீடு பார்க்கவும்.", "இழப்பீட்டு மதிப்பீட்டை சரிபார்க்கவும் (₹45,825 போன்று).", "அதிகாரி DBT அங்கீகரிக்கிறார்.", "நிலையை 'பரிசீலனையில்' இருந்து 'ஏற்கப்பட்டது' வரை கண்காணிக்கவும்."],
      mr: ["'दावा डोसियर' उघडून AI नुकसान रेटिंग पहा.", "अंदाजित भरपाई तपासा (उदा. ₹45,825).", "अधिकारी नियम तपासणीनंतर DBT मंजूर करतात.", "स्थिती 'पुनरावलोकनाधीन' ते 'मंजूर' पर्यंत ट्रॅक करा."]
    },
    visualScene: "claimDossier"
  }
];

export const TutorialVideoModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { language } = useApp();
  const { speak, isSpeaking, stopSpeaking } = useVoice();
  const [activeChapterIdx, setActiveChapterIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);

  const currentChapter = TUTORIAL_CHAPTERS[activeChapterIdx];

  // Auto progression simulated video timeline
  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            setIsPlaying(false);
            return 100;
          }
          return prev + 2;
        });
      }, 300);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  useEffect(() => {
    setProgress(0);
    setIsPlaying(false);
  }, [activeChapterIdx]);

  if (!isOpen) return null;

  const handlePlayToggle = () => {
    if (isPlaying) {
      setIsPlaying(false);
      stopSpeaking();
    } else {
      setIsPlaying(true);
      if (progress >= 100) setProgress(0);
      const textToNarrate = currentChapter.narration[language] || currentChapter.narration.en;
      speak(textToNarrate);
    }
  };

  const handleNextChapter = () => {
    if (activeChapterIdx < TUTORIAL_CHAPTERS.length - 1) {
      setActiveChapterIdx(activeChapterIdx + 1);
    }
  };

  const handlePrevChapter = () => {
    if (activeChapterIdx > 0) {
      setActiveChapterIdx(activeChapterIdx - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 rounded-3xl max-w-4xl w-full text-white shadow-2xl border border-slate-800 flex flex-col overflow-hidden animate-in zoom-in-95">
        {/* Modal Top Header */}
        <div className="bg-slate-950 px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold">
              <Tv className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>{t("modalTitle", language)}</span>
                <span className="text-xs bg-emerald-950 text-emerald-400 border border-emerald-800/80 px-2 py-0.5 rounded-full hidden sm:inline">Interactive</span>
              </h3>
              <p className="text-xs text-slate-400">{t("modalSub", language)}</p>
            </div>
          </div>

          <button
            onClick={() => { stopSpeaking(); onClose(); }}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Player & Main Body */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
          {/* Left / Top: Interactive Simulated Screen Canvas (8 cols) */}
          <div className="lg:col-span-8 bg-slate-950 p-4 flex flex-col justify-between min-h-[320px] sm:min-h-[400px] border-r border-slate-800 relative">
            {/* Visual Simulated Screen Frame */}
            <div className="relative flex-1 rounded-2xl bg-gradient-to-br from-slate-900 to-emerald-950/40 border border-slate-800 p-6 flex flex-col justify-between overflow-hidden shadow-inner">
              {/* Top Video Status Badge */}
              <div className="flex items-center justify-between z-10">
                <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-700/50 px-3 py-1 rounded-full flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${isPlaying ? "bg-red-500 animate-ping" : "bg-emerald-400"}`} />
                  {isPlaying ? t("playing", language) : t("ready", language)}
                </span>

                <button
                  onClick={() => {
                    const textToNarrate = currentChapter.narration[language] || currentChapter.narration.en;
                    speak(textToNarrate);
                  }}
                  className="flex items-center gap-1.5 text-xs bg-slate-800/80 hover:bg-slate-700 text-emerald-300 border border-slate-700 px-2.5 py-1 rounded-lg transition"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>{t("listenAudio", language)}</span>
                </button>
              </div>

              {/* Central Graphic Simulation based on chapter */}
              <div className="my-6 flex flex-col items-center justify-center text-center space-y-4 z-10">
                {currentChapter.visualScene === "navigation" && (
                  <div className="space-y-3 animate-pulse">
                    <div className="w-20 h-20 rounded-2xl bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-300 shadow-lg mx-auto">
                      <Tv className="w-10 h-10" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-lg font-bold text-white">AgriShield Interface Navigation</h4>
                      <p className="text-xs text-slate-300 max-w-md">
                        Header bar menu &bull; Language selector &bull; Farmer profile &bull; Dashboard view
                      </p>
                    </div>
                  </div>
                )}

                {currentChapter.visualScene === "fieldMap" && (
                  <div className="space-y-3">
                    <div className="w-20 h-20 rounded-2xl bg-blue-500/20 border-2 border-blue-400 flex items-center justify-center text-blue-300 shadow-lg mx-auto">
                      <MapPin className="w-10 h-10 animate-bounce" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-lg font-bold text-white">Interactive Cadastral Boundary Drawing</h4>
                      <p className="text-xs text-emerald-300 font-mono">
                        Polygon Area: 2.35 Acres &bull; Sy.No: 142/3B &bull; Soil: Black Cotton
                      </p>
                    </div>
                  </div>
                )}

                {currentChapter.visualScene === "cropForm" && (
                  <div className="space-y-3">
                    <div className="w-20 h-20 rounded-2xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-amber-300 shadow-lg mx-auto">
                      <FileText className="w-10 h-10" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-lg font-bold text-white">Sown Crop & Variety Selection</h4>
                      <p className="text-xs text-amber-200">
                        Crop: Rice / Paddy &bull; Variety: BPT 5204 &bull; Custom "Other" options enabled!
                      </p>
                    </div>
                  </div>
                )}

                {currentChapter.visualScene === "evidenceCapture" && (
                  <div className="space-y-3">
                    <div className="w-20 h-20 rounded-2xl bg-rose-500/20 border-2 border-rose-400 flex items-center justify-center text-rose-300 shadow-lg mx-auto">
                      <Camera className="w-10 h-10" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-lg font-bold text-white">4-Step Guided Post-Disaster Photo Capture</h4>
                      <div className="flex gap-2 justify-center text-[10px]">
                        <span className="bg-slate-800 px-2 py-0.5 rounded text-emerald-400">1. Wide View</span>
                        <span className="bg-slate-800 px-2 py-0.5 rounded text-amber-400">2. Section</span>
                        <span className="bg-slate-800 px-2 py-0.5 rounded text-rose-400">3. Epicenter</span>
                        <span className="bg-slate-800 px-2 py-0.5 rounded text-blue-400">4. Close-Up</span>
                      </div>
                    </div>
                  </div>
                )}

                {currentChapter.visualScene === "disasterReport" && (
                  <div className="space-y-3">
                    <div className="w-20 h-20 rounded-2xl bg-teal-500/20 border-2 border-teal-400 flex items-center justify-center text-teal-300 shadow-lg mx-auto">
                      <HelpCircle className="w-10 h-10" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-lg font-bold text-white">Disaster Report & Weather Verification</h4>
                      <p className="text-xs text-teal-200 font-mono">
                        Event: Heavy Rainfall &bull; Open-Meteo Spike: 94.2 mm &bull; Telemetry Matched
                      </p>
                    </div>
                  </div>
                )}

                {currentChapter.visualScene === "claimDossier" && (
                  <div className="space-y-3">
                    <div className="w-20 h-20 rounded-2xl bg-purple-500/20 border-2 border-purple-400 flex items-center justify-center text-purple-300 shadow-lg mx-auto">
                      <BarChart2 className="w-10 h-10" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-lg font-bold text-white">AI Damage Ratings & Compensation</h4>
                      <p className="text-xs text-purple-200">
                        Gemini AI Loss: 65% &bull; Estimated Payout: ₹45,825 &bull; Status: Under Review
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Subtitles / Audio Transcript Box */}
              <div className="bg-slate-950/90 rounded-xl p-3 border border-slate-800 text-xs text-slate-200 z-10 space-y-1">
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">
                  {t("audioLabel", language)} ({language.toUpperCase()}):
                </span>
                <p className="leading-relaxed font-medium italic">
                  "{currentChapter.narration[language] || currentChapter.narration.en}"
                </p>
              </div>
            </div>

            {/* Video Controls Bar */}
            <div className="pt-3 space-y-2">
              {/* Progress Bar */}
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden cursor-pointer">
                <div
                  className="bg-emerald-500 h-full transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrevChapter}
                    disabled={activeChapterIdx === 0}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <button
                    onClick={handlePlayToggle}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl transition cursor-pointer text-xs shadow-md"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                    <span>{isPlaying ? t("pauseBtn", language) : t("playBtn", language)}</span>
                  </button>

                  <button
                    onClick={handleNextChapter}
                    disabled={activeChapterIdx === TUTORIAL_CHAPTERS.length - 1}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 transition"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-xs text-slate-400 font-mono">
                  {t("chapterOf", language)} {currentChapter.id} {t("of", language)} {TUTORIAL_CHAPTERS.length}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Step-by-step Chapter List & Key Steps (4 cols) */}
          <div className="lg:col-span-4 bg-slate-900 p-4 sm:p-5 flex flex-col justify-between space-y-4">
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                {t("chaptersLabel", language)}
              </h4>

              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {TUTORIAL_CHAPTERS.map((ch, idx) => {
                  const Icon = ch.icon;
                  const isActive = idx === activeChapterIdx;
                  return (
                    <button
                      key={ch.id}
                      onClick={() => setActiveChapterIdx(idx)}
                      className={`w-full text-left p-2.5 rounded-xl border transition flex items-center justify-between cursor-pointer ${
                        isActive
                          ? "bg-emerald-950/80 border-emerald-500/80 text-white shadow-md"
                          : "bg-slate-950/50 hover:bg-slate-800 border-slate-800 text-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`p-1.5 rounded-lg ${isActive ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-400"}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold leading-snug">{ch.title[language] || ch.title.en}</div>
                          <div className="text-[10px] text-slate-400 font-normal truncate max-w-[170px]">{ch.subtitle[language] || ch.subtitle.en}</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">{ch.duration}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Practical Step Instructions for Current Chapter */}
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                {t("keyStepsLabel", language)}
              </span>
              <ul className="space-y-1.5 text-[11px] text-slate-300">
                {(currentChapter.keySteps[language] || currentChapter.keySteps.en).map((step, sIdx) => (
                  <li key={sIdx} className="flex items-start gap-1.5 leading-tight">
                    <span className="text-emerald-500 font-bold">&bull;</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Bottom Action */}
            <button
              onClick={() => { stopSpeaking(); onClose(); }}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition cursor-pointer text-center"
            >
              {t("closeBtn", language)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
