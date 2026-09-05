import React from "react";
import { Volume2, VolumeX, Mic } from "lucide-react";
import { useVoice } from "../../context/VoiceContext";

interface VoiceHelperButtonProps {
  textToSpeak?: string;
  sectionKey?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  label?: string;
}

export const VoiceHelperButton: React.FC<VoiceHelperButtonProps> = ({
  textToSpeak,
  sectionKey,
  size = "sm",
  className = "",
  label,
}) => {
  const { speak, speakGuide, isSpeaking, stopSpeaking } = useVoice();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (isSpeaking) {
      stopSpeaking();
    } else if (textToSpeak) {
      speak(textToSpeak);
    } else if (sectionKey) {
      speakGuide(sectionKey);
    }
  };

  const iconSizes = {
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      title="Click to listen to voice instructions"
      className={`inline-flex items-center gap-1.5 rounded-md border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 hover:border-emerald-400 transition cursor-pointer shadow-2xs ${className}`}
    >
      <Volume2 className={`${iconSizes[size]} text-emerald-700 animate-pulse`} />
      {label && <span>{label}</span>}
    </button>
  );
};
