import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";

interface AudioPlayerProps {
  src: string;
  isAdmin?: boolean;
}

export default function AudioPlayer({ src, isAdmin = false }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const audio = new Audio(src);
    audioRef.current = audio;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime || 0);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);

    // Some browsers require explicit load
    audio.load();

    return () => {
      audio.pause();
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [src]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch((err) => console.error("Audio playback failed:", err));
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    const nextMute = !isMuted;
    audioRef.current.muted = nextMute;
    setIsMuted(nextMute);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !progressRef.current || duration === 0) return;
    const rect = progressRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const newPercentage = clickX / width;
    const newTime = newPercentage * duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (time: number) => {
    if (isNaN(time) || !isFinite(time)) return "0:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const percentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Set visual theme depending on sender (User has #ceff00 lime-green, Admin has different styling)
  const isSenderUser = !isAdmin; // User message uses black text on yellow/lime-green background
  const themeAccent = isSenderUser ? "text-slate-900 bg-slate-900/10 hover:bg-slate-900/20" : "text-[#ceff00] bg-[#ceff00]/10 hover:bg-[#ceff00]/25";
  const themeBarBg = isSenderUser ? "bg-slate-900/15" : "bg-slate-800";
  const themeBarFill = isSenderUser ? "bg-slate-900" : "bg-[#ceff00]";
  const themeText = isSenderUser ? "text-slate-900" : "text-slate-200";
  const themeSubText = isSenderUser ? "text-slate-800/80" : "text-slate-400";

  return (
    <div className={`flex items-center gap-3 py-1.5 px-3 rounded-xl border ${isSenderUser ? "border-black/5 bg-black/5" : "border-slate-800 bg-slate-950/40"} min-w-[220px] max-w-[280px]`}>
      {/* Play/Pause Button */}
      <button
        type="button"
        onClick={togglePlay}
        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shrink-0 cursor-pointer ${themeAccent}`}
      >
        {isPlaying ? (
          <Pause className="w-3.5 h-3.5 fill-current" />
        ) : (
          <Play className="w-3.5 h-3.5 fill-current translate-x-0.5" />
        )}
      </button>

      {/* Progress & Wave-line simulation */}
      <div className="flex-1 flex flex-col justify-center min-w-0">
        <div 
          ref={progressRef}
          onClick={handleProgressClick}
          className={`h-2.5 rounded-full relative cursor-pointer flex items-center ${themeBarBg}`}
        >
          {/* Progress filled bar */}
          <div 
            className={`h-full rounded-full transition-all ${themeBarFill}`}
            style={{ width: `${percentage}%` }}
          />
          {/* Knobby slider indicator */}
          <div 
            className={`absolute w-2 h-2 rounded-full border border-white shadow-sm ${themeBarFill}`}
            style={{ left: `calc(${percentage}% - 4px)` }}
          />
        </div>
        
        {/* Time display */}
        <div className="flex justify-between items-center mt-1 text-[9px] font-bold select-none leading-none">
          <span className={themeSubText}>{formatTime(currentTime)}</span>
          <span className={themeSubText}>{formatTime(duration || 10)}</span>
        </div>
      </div>

      {/* Mute toggle button */}
      <button
        type="button"
        onClick={toggleMute}
        className={`p-1.5 rounded transition shrink-0 cursor-pointer ${isSenderUser ? "text-slate-900 hover:bg-slate-900/10" : "text-slate-400 hover:text-white hover:bg-slate-900"}`}
      >
        {isMuted ? (
          <VolumeX className="w-3.5 h-3.5" />
        ) : (
          <Volume2 className="w-3.5 h-3.5" />
        )}
      </button>
    </div>
  );
}
